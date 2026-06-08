"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ClientData, ClientTransaction } from "@/types/client";
import type { SellMethod } from "@/lib/pricing";
import { calcInrFromUsdt, calcUsdtFromInr, getRateForMethod } from "@/lib/pricing";
import { getWalletType } from "@/lib/wallets";
import { maskAccountNumber } from "@/lib/daily-limits";
import {
  formatCountdown,
  getApprovalLabel,
  getPaymentSecondsLeft,
  getPayoutMessage,
  getStatusLabel,
  getWithdrawLabel,
  isActiveSellStatus,
  isDepositWindowOpen,
} from "@/lib/sell-order";
import { PAYMENT_WINDOW_MINUTES } from "@/lib/constants";
import { PageContainer, PageHeader, StatCard, Card } from "./PageLayout";
import { formatInr, formatDateTime } from "@/lib/format";
import { getTransactionBalance } from "@/lib/transaction-balance";

export default function DepositScreen({ client }: { client: ClientData }) {
  const router = useRouter();
  const [sellMethod, setSellMethod] = useState<SellMethod>("upi");
  const [inrAmount, setInrAmount] = useState("");
  const [usdtAmount, setUsdtAmount] = useState("");
  const [selectedWalletId, setSelectedWalletId] = useState(
    client.wallets.find((w) => w.status === "active")?.id || ""
  );
  const [selectedBankId, setSelectedBankId] = useState(client.bankAccounts[0]?.id || "");
  const [note, setNote] = useState("");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [proofLoading, setProofLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);

  const activeSellOrder = useMemo(
    () =>
      client.transactions.find(
        (t) => t.type === "usdt_sell" && isActiveSellStatus(t.status)
      ) ?? null,
    [client.transactions]
  );

  const latestCompletedSell = useMemo(
    () =>
      client.transactions.find(
        (t) => t.type === "usdt_sell" && t.status === "completed"
      ) ?? null,
    [client.transactions]
  );

  const activeRate = getRateForMethod(client.sellRates, sellMethod);
  const selectedWalletLimit = client.dailySellLimits.upiWallets.find(
    (w) => w.walletId === selectedWalletId
  );
  const selectedBankLimit = client.dailySellLimits.impsBanks.find(
    (b) => b.bankAccountId === selectedBankId
  );

  useEffect(() => {
    if (!activeSellOrder?.paymentExpiresAt || activeSellOrder.status !== "awaiting_payment") {
      setSecondsLeft(0);
      return;
    }

    function tick() {
      const left = getPaymentSecondsLeft(activeSellOrder?.paymentExpiresAt);
      setSecondsLeft(left);
      if (left === 0) router.refresh();
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeSellOrder, router]);

  useEffect(() => {
    if (activeSellOrder?.status === "pending" || activeSellOrder?.status === "payment_submitted") {
      const interval = setInterval(() => router.refresh(), 5000);
      return () => clearInterval(interval);
    }
  }, [activeSellOrder, router]);

  function handleUsdtChange(val: string) {
    setUsdtAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num)) setInrAmount(calcInrFromUsdt(num, activeRate).toString());
  }

  function handleInrChange(val: string) {
    setInrAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num)) setUsdtAmount(calcUsdtFromInr(num, activeRate).toString());
  }

  function handleMethodChange(method: SellMethod) {
    setSellMethod(method);
    const rate = getRateForMethod(client.sellRates, method);
    const usdt = parseFloat(usdtAmount);
    if (!isNaN(usdt)) setInrAmount(calcInrFromUsdt(usdt, rate).toString());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (!usdtAmount || Number(usdtAmount) <= 0) {
      setError("Enter USDT amount to sell");
      setLoading(false);
      return;
    }

    if (sellMethod === "upi" && !selectedWalletId) {
      setError("Select a UPI wallet. Add one in Tools if needed.");
      setLoading(false);
      return;
    }

    if (sellMethod === "imps" && !selectedBankId) {
      setError("Select a bank account. Add one in Tools if needed.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("sellMethod", sellMethod);
    formData.append("inrAmount", inrAmount);
    formData.append("usdtAmount", usdtAmount);
    if (sellMethod === "upi") formData.append("walletId", selectedWalletId);
    if (sellMethod === "imps") formData.append("bankAccountId", selectedBankId);
    if (note) formData.append("note", note);

    try {
      const res = await fetch("/api/client/payment", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit sell order");
        return;
      }
      setMessage(data.message || "Sell order submitted. Waiting for admin approval.");
      setInrAmount("");
      setUsdtAmount("");
      setNote("");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadProof() {
    if (!activeSellOrder || !paymentProof) {
      setError("Select a payment screenshot to upload");
      return;
    }

    setProofLoading(true);
    setError("");
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("transactionId", activeSellOrder.id);
      formData.append("screenshot", paymentProof);
      const res = await fetch("/api/client/payment-proof", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to upload payment proof");
        return;
      }
      setMessage(data.message || "Payment proof submitted.");
      setPaymentProof(null);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setProofLoading(false);
    }
  }

  const showDepositWindow =
    activeSellOrder &&
    isDepositWindowOpen(activeSellOrder.status, activeSellOrder.paymentExpiresAt);

  return (
    <PageContainer>
      <PageHeader
        title="Sell USDT"
        subtitle="Submit a sell order, send USDT when approved, and receive INR via your chosen payout method"
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Available Balance"
          value={formatInr(client.availableBalance)}
          sub="Updates when admin adjusts your withdrawal"
          accent="green"
        />
        <StatCard
          label="Est. Value"
          value={formatInr(client.estValue)}
          sub="Balance + USDT at rates"
          accent="blue"
        />
        <StatCard
          label="Total Withdrawn"
          value={formatInr(client.totalWithdrawn)}
          sub="Completed payouts"
          accent="violet"
        />
      </div>

      {activeSellOrder && (
        <ActiveOrderCard
          order={activeSellOrder}
          secondsLeft={secondsLeft}
          showDepositWindow={Boolean(showDepositWindow)}
          paymentProof={paymentProof}
          onProofChange={setPaymentProof}
          onUploadProof={handleUploadProof}
          proofLoading={proofLoading}
        />
      )}

      {!activeSellOrder && (
        <div className="grid lg:grid-cols-5 gap-8">
          <Card className="lg:col-span-2 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Payout Method</h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => handleMethodChange("upi")}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  sellMethod === "upi"
                    ? "border-blue-600 bg-blue-50 shadow-md"
                    : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <p className="font-bold text-slate-900">UPI</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  ₹{client.sellRates.upiSellRate.toFixed(2)}
                </p>
                <p className="text-xs text-slate-500 mt-1">Per USDT · payout within 10 min</p>
              </button>
              <button
                type="button"
                onClick={() => handleMethodChange("imps")}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  sellMethod === "imps"
                    ? "border-violet-600 bg-violet-50 shadow-md"
                    : "border-slate-200 hover:border-violet-300"
                }`}
              >
                <p className="font-bold text-slate-900">IMPS</p>
                <p className="text-2xl font-bold text-violet-600 mt-1">
                  ₹{client.sellRates.impsSellRate.toFixed(2)}
                </p>
                <p className="text-xs text-slate-500 mt-1">Per USDT · instant transfer</p>
              </button>
            </div>

            <h2 className="text-lg font-bold text-slate-900 mb-4">Sell Order</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">USDT to Sell</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  placeholder="10.00"
                  value={usdtAmount}
                  onChange={(e) => handleUsdtChange(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  You Receive (INR) via {sellMethod.toUpperCase()}
                </label>
                <input
                  type="number"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-lg font-semibold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  value={inrAmount}
                  onChange={(e) => handleInrChange(e.target.value)}
                />
                <p className="text-xs text-slate-400 mt-1">
                  Rate: ₹{activeRate.toFixed(2)} per USDT
                  {sellMethod === "upi" && selectedWalletLimit
                    ? ` · ${selectedWalletLimit.remaining.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })} reference left on this UPI`
                    : sellMethod === "imps" && selectedBankLimit
                      ? ` · ${selectedBankLimit.remaining.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })} reference left on this bank`
                      : ""}
                </p>
              </div>

              {sellMethod === "upi" ? (
                <WalletSelect
                  wallets={client.wallets}
                  selectedWalletId={selectedWalletId}
                  onChange={setSelectedWalletId}
                />
              ) : (
                <BankSelect
                  bankAccounts={client.bankAccounts}
                  selectedBankId={selectedBankId}
                  onChange={setSelectedBankId}
                />
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Note (optional)</label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  placeholder="Any reference for admin"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
              {message && <p className="text-green-600 text-sm bg-green-50 px-4 py-2 rounded-lg">{message}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity shadow-lg shadow-blue-500/20"
              >
                {loading ? "Submitting..." : `Sell USDT via ${sellMethod.toUpperCase()}`}
              </button>
            </form>
          </Card>

          <SellHistory transactions={client.transactions} availableBalance={client.availableBalance} />
        </div>
      )}

      {activeSellOrder && !showDepositWindow && activeSellOrder.status !== "payment_submitted" && (
        <div className="mt-8">
          <SellHistory transactions={client.transactions} availableBalance={client.availableBalance} />
        </div>
      )}

      {!activeSellOrder && latestCompletedSell && (
        <Card className="mt-6 p-5 border-emerald-200 bg-emerald-50">
          <p className="font-semibold text-emerald-800">Latest completed withdrawal</p>
          <p className="text-sm text-emerald-700 mt-1">{getPayoutMessage(latestCompletedSell.sellMethod)}</p>
        </Card>
      )}
    </PageContainer>
  );
}

function ActiveOrderCard({
  order,
  secondsLeft,
  showDepositWindow,
  paymentProof,
  onProofChange,
  onUploadProof,
  proofLoading,
}: {
  order: ClientTransaction;
  secondsLeft: number;
  showDepositWindow: boolean;
  paymentProof: File | null;
  onProofChange: (f: File | null) => void;
  onUploadProof: () => void;
  proofLoading: boolean;
}) {
  return (
    <Card className="p-6 sm:p-8 mb-8 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">Active Sell Order</p>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            {order.usdtAmount?.toFixed(2)} USDT → ₹{order.inrAmount?.toLocaleString("en-IN")}
          </h2>
          <p className="text-sm text-slate-500 mt-1 capitalize">
            Payout via {order.sellMethod?.toUpperCase() || "—"}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {order.status === "pending" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="font-semibold text-amber-800">Waiting for admin approval</p>
          <p className="text-sm text-amber-700 mt-1">
            Your sell order has been submitted. Please wait until admin approves it. You will then receive
            deposit instructions to send USDT within {PAYMENT_WINDOW_MINUTES} minutes.
          </p>
        </div>
      )}

      {order.status === "payment_submitted" && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
          <p className="font-semibold text-violet-800">Payment proof under review</p>
          <p className="text-sm text-violet-700 mt-1">
            Admin is verifying your USDT transfer. Please wait for approval.
          </p>
        </div>
      )}

      {order.status === "pending_withdrawing" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="font-semibold text-amber-800">Pending withdrawing</p>
          <p className="text-sm text-amber-700 mt-1">{getPayoutMessage(order.sellMethod)}</p>
          <p className="text-xs text-amber-600 mt-2">
            Your USDT payment was approved. INR payout is being processed. You can place a new order once this
            withdrawal is marked completed.
          </p>
        </div>
      )}

      {showDepositWindow && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="font-semibold text-red-800">Complete payment within {PAYMENT_WINDOW_MINUTES} minutes</p>
            <p className="text-2xl font-mono font-bold text-red-600">{formatCountdown(secondsLeft)}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Network</p>
              <p className="font-bold text-slate-900">{order.depositNetwork}</p>
              <p className="text-sm font-medium text-slate-600 mt-4 mb-1">Send exactly {order.usdtAmount?.toFixed(2)} USDT to</p>
              <p className="font-mono text-sm bg-white border rounded-xl p-3 break-all">{order.depositAddressText}</p>
            </div>
            {order.depositQr && (
              <div className="flex flex-col items-center">
                <p className="text-sm font-medium text-slate-600 mb-2">Scan QR Code</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={order.depositQr}
                  alt="Deposit QR"
                  className="w-48 h-48 object-contain border rounded-xl bg-white p-2"
                />
              </div>
            )}
          </div>

          <div className="border-t pt-5">
            <p className="font-semibold text-slate-800 mb-2">Upload payment screenshot</p>
            <p className="text-sm text-slate-500 mb-3">
              After sending USDT, upload a screenshot of your transaction as proof.
            </p>
            <input
              type="file"
              accept="image/*"
              className="w-full text-sm mb-3 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium"
              onChange={(e) => onProofChange(e.target.files?.[0] || null)}
            />
            <button
              onClick={onUploadProof}
              disabled={proofLoading || !paymentProof}
              className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50"
            >
              {proofLoading ? "Uploading..." : "Submit Payment Proof"}
            </button>
          </div>
        </div>
      )}

      {order.status === "awaiting_payment" && !showDepositWindow && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="font-semibold text-slate-800">Payment window expired</p>
          <p className="text-sm text-slate-600 mt-1">
            The {PAYMENT_WINDOW_MINUTES}-minute payment window has ended. Please submit a new sell order.
          </p>
        </div>
      )}
    </Card>
  );
}

function WalletSelect({
  wallets,
  selectedWalletId,
  onChange,
}: {
  wallets: ClientData["wallets"];
  selectedWalletId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">Select UPI Wallet</label>
      {wallets.length === 0 ? (
        <p className="text-sm text-amber-600">
          No UPI wallet linked.{" "}
          <a href="/tools" className="font-semibold underline">Add in Tools</a>
        </p>
      ) : (
        <select
          className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          value={selectedWalletId}
          onChange={(e) => onChange(e.target.value)}
        >
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {getWalletType(w.type)?.name} — {w.upiId || "No UPI"}
              {w.bankLabel ? ` (${w.bankLabel})` : ""}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function BankSelect({
  bankAccounts,
  selectedBankId,
  onChange,
}: {
  bankAccounts: ClientData["bankAccounts"];
  selectedBankId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Bank Account</label>
      {bankAccounts.length === 0 ? (
        <p className="text-sm text-amber-600">
          No bank account added.{" "}
          <a href="/tools" className="font-semibold underline">Add in Tools</a>
        </p>
      ) : (
        <select
          className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
          value={selectedBankId}
          onChange={(e) => onChange(e.target.value)}
        >
          {bankAccounts.map((b) => (
            <option key={b.id} value={b.id}>
              {b.accountHolder} — {maskAccountNumber(b.accountNumber)} · {b.ifsc}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function SellHistory({
  transactions,
  availableBalance,
}: {
  transactions: ClientTransaction[];
  availableBalance: number;
}) {
  const sells = transactions.filter((t) => t.type === "usdt_sell");
  return (
    <Card className="lg:col-span-3 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold text-slate-900">Withdraw History</h2>
        <span className="text-xs text-slate-500">
          Available balance: <strong className="text-slate-800">{formatInr(availableBalance)}</strong>
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600">
              <th className="text-left px-6 py-3 font-semibold">Method</th>
              <th className="text-left px-6 py-3 font-semibold">USDT</th>
              <th className="text-left px-6 py-3 font-semibold hidden sm:table-cell">INR</th>
              <th className="text-left px-6 py-3 font-semibold hidden md:table-cell">Withdrawn</th>
              <th className="text-left px-6 py-3 font-semibold">Approval</th>
              <th className="text-left px-6 py-3 font-semibold">Withdraw</th>
              <th className="text-left px-6 py-3 font-semibold hidden lg:table-cell">Balance</th>
              <th className="text-left px-6 py-3 font-semibold hidden md:table-cell">Date</th>
            </tr>
          </thead>
          <tbody>
            {sells.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-400">No withdrawals yet.</td>
              </tr>
            ) : (
              sells.map((t) => (
                <tr key={t.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                  <td className="px-6 py-4 uppercase text-xs font-semibold text-slate-500">
                    {t.sellMethod || "—"}
                  </td>
                  <td className="px-6 py-4 font-semibold">{t.usdtAmount?.toFixed(2) ?? "—"}</td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    {t.inrAmount ? formatInr(t.inrAmount) : "—"}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell text-slate-600">
                    {t.inrAmount != null ? formatInr(t.withdrawnAmount ?? 0) : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <ApprovalBadge status={t.status} />
                  </td>
                  <td className="px-6 py-4">
                    <WithdrawBadge status={t.status} />
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell text-slate-600 font-medium">
                    {t.inrAmount != null ? formatInr(getTransactionBalance(t)) : "—"}
                  </td>
                  <td className="px-6 py-4 text-slate-500 hidden md:table-cell whitespace-nowrap">
                    {formatDateTime(t.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ApprovalBadge({ status }: { status: string }) {
  const label = getApprovalLabel(status);
  const styles = {
    Pending: "bg-amber-100 text-amber-700",
    Success: "bg-emerald-100 text-emerald-700",
    Failed: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[label]}`}>
      {label}
    </span>
  );
}

function WithdrawBadge({ status }: { status: string }) {
  const label = getWithdrawLabel(status);
  if (label === "—") return <span className="text-slate-400">—</span>;
  const styles: Record<string, string> = {
    "Pending Withdrawing": "bg-amber-100 text-amber-800",
    Completed: "bg-emerald-100 text-emerald-700",
    Failed: "bg-red-100 text-red-700",
    Expired: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[label] || "bg-slate-100 text-slate-600"}`}>
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    confirmed: "bg-emerald-100 text-emerald-700",
    completed: "bg-emerald-100 text-emerald-700",
    pending_withdrawing: "bg-amber-100 text-amber-800",
    pending: "bg-amber-100 text-amber-700",
    awaiting_payment: "bg-blue-100 text-blue-700",
    payment_submitted: "bg-violet-100 text-violet-700",
    expired: "bg-slate-100 text-slate-600",
    rejected: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status] || "bg-slate-100 text-slate-600"}`}>
      {getStatusLabel(status)}
    </span>
  );
}
