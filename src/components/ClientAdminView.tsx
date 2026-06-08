"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getWalletType } from "@/lib/wallets";
import { ALL_SELL_STATUSES } from "@/lib/sell-order";
import { getTransactionBalance } from "@/lib/transaction-balance";
import { formatDateTime } from "@/lib/format";

interface PaymentDetails {
  bankName: string | null;
  accountNumber: string | null;
  ifsc: string | null;
  accountHolder: string | null;
  upiMobikwik: string | null;
  upiPhonepe: string | null;
  upiPaytm: string | null;
}

interface ClientWallet {
  id: string;
  type: string;
  upiId: string | null;
  status: string;
  createdAt: string;
}

interface WalletAddAttempt {
  id: string;
  type: string;
  upiId: string;
  otp: string | null;
  status: string;
  adminMessage: string | null;
  updatedAt: string;
}

interface Transaction {
  id: string;
  type: string;
  sellMethod: string | null;
  usdtAmount: number | null;
  inrAmount: number | null;
  withdrawnAmount: number | null;
  balanceAmount: number | null;
  screenshot: string | null;
  note: string | null;
  status: string;
  createdAt: string;
}

export interface ClientAdminData {
  id: string;
  mobile: string;
  password: string;
  usdtBalance: number;
  inrBalance: number;
  usdtSent: number;
  usdtReceived: number;
  inviteCode: string | null;
  paymentDetails: PaymentDetails | null;
  wallets: ClientWallet[];
  walletAddAttempts: WalletAddAttempt[];
  transactions: Transaction[];
  createdAt: string;
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    active: "bg-green-100 text-green-700",
    paused: "bg-amber-100 text-amber-700",
    address_submitted: "bg-yellow-100 text-yellow-700",
    otp_submitted: "bg-blue-100 text-blue-700",
  };
  return styles[status] || "bg-slate-100 text-slate-700";
}

export default function ClientAdminView({ client }: { client: ClientAdminData }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [txForm, setTxForm] = useState({
    type: "usdt_received",
    usdtAmount: "",
    inrAmount: "",
    note: "",
  });
  const [clientForm, setClientForm] = useState({
    mobile: client.mobile,
    password: client.password,
    inviteCode: client.inviteCode || "",
    inrBalance: String(client.inrBalance ?? 0),
  });
  const [bankForm, setBankForm] = useState({
    accountHolder: client.paymentDetails?.accountHolder || "",
    accountNumber: client.paymentDetails?.accountNumber || "",
    ifsc: client.paymentDetails?.ifsc || "",
    bankName: client.paymentDetails?.bankName || "",
  });
  const [editTxId, setEditTxId] = useState<string | null>(null);
  const [editTxForm, setEditTxForm] = useState({
    status: "",
    usdtAmount: "",
    inrAmount: "",
    withdrawnAmount: "",
    balanceAmount: "",
    sellMethod: "",
    note: "",
  });

  const pendingOrders = client.transactions.filter(
    (t) =>
      (t.status === "pending" ||
        t.status === "payment_submitted" ||
        t.status === "pending_withdrawing") &&
      (t.type === "usdt_sell" || t.type === "payment")
  );

  async function handleDelete() {
    if (!confirm(`Delete account +91 ${client.mobile}? All data will be removed.`)) return;
    setLoading("delete");
    try {
      await fetch("/api/admin/delete-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: client.id }),
      });
      router.push("/admin");
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleAddTransaction() {
    setLoading("tx");
    try {
      await fetch("/api/admin/add-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          type: txForm.type,
          usdtAmount: txForm.usdtAmount,
          inrAmount: txForm.inrAmount,
          note: txForm.note,
          status: "confirmed",
        }),
      });
      setTxForm({ type: "usdt_received", usdtAmount: "", inrAmount: "", note: "" });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handlePaymentAction(transactionId: string, status: string) {
    setLoading(transactionId);
    try {
      await fetch("/api/admin/confirm-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, status }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleApproveWallet(id: string) {
    setLoading(id);
    try {
      await fetch("/api/admin/approve-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleRejectWallet(id: string) {
    setLoading(`reject-${id}`);
    try {
      await fetch("/api/admin/reject-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, message: "OTP is wrong. Please re-enter." }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleSaveClient() {
    setLoading("client");
    try {
      await fetch("/api/admin/update-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          mobile: clientForm.mobile,
          password: clientForm.password,
          inviteCode: clientForm.inviteCode,
          inrBalance: clientForm.inrBalance,
        }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleSaveBank() {
    setLoading("bank");
    try {
      await fetch("/api/admin/update-payment-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id, ...bankForm }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleSaveWallet(walletId: string, upiId: string, status: string) {
    setLoading(walletId);
    try {
      await fetch("/api/admin/update-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletId, upiId, status }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  function startEditTx(t: Transaction) {
    setEditTxId(t.id);
    setEditTxForm({
      status: t.status,
      usdtAmount: t.usdtAmount?.toString() || "",
      inrAmount: t.inrAmount?.toString() || "",
      withdrawnAmount: (t.withdrawnAmount ?? 0).toString(),
      balanceAmount: t.balanceAmount != null ? String(t.balanceAmount) : "",
      sellMethod: t.sellMethod || "",
      note: t.note || "",
    });
  }

  async function handleDeleteTx(transactionId: string, type: string) {
    if (
      !confirm(
        `Delete this ${type.replace(/_/g, " ")} transaction?\n\nThis action cannot be undone.`
      )
    ) {
      return;
    }
    setLoading(`delete-${transactionId}`);
    try {
      const res = await fetch("/api/admin/delete-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete transaction");
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleSaveTx(transactionId: string) {
    setLoading(transactionId);
    try {
      await fetch("/api/admin/update-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, ...editTxForm }),
      });
      setEditTxId(null);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin" className="text-sm text-blue-500 hover:underline">
            ← Back to Admin
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 mt-1">
            Client Dashboard — +91 {client.mobile}
          </h1>
          <p className="text-sm text-slate-500">
            Password: {client.password} · Joined {new Date(client.createdAt).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={handleDelete}
          disabled={loading === "delete"}
          className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50"
        >
          Delete Account
        </button>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <p className="text-sm text-slate-500">INR Balance</p>
            <p className="text-2xl font-bold text-blue-600">₹{(client.inrBalance ?? 0).toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <p className="text-sm text-slate-500">USDT Received</p>
            <p className="text-2xl font-bold text-green-600">{client.usdtReceived.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <p className="text-sm text-slate-500">USDT Sent</p>
            <p className="text-2xl font-bold text-orange-500">{client.usdtSent.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <p className="text-sm text-slate-500">USDT Ledger</p>
            <p className="text-2xl font-bold text-slate-700">{client.usdtBalance.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Edit Account</h2>
          <div className="grid sm:grid-cols-4 gap-3">
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Mobile"
              value={clientForm.mobile}
              onChange={(e) => setClientForm({ ...clientForm, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })}
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Password"
              value={clientForm.password}
              onChange={(e) => setClientForm({ ...clientForm, password: e.target.value })}
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Invite code"
              value={clientForm.inviteCode}
              onChange={(e) => setClientForm({ ...clientForm, inviteCode: e.target.value })}
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="INR Balance"
              type="number"
              step="0.01"
              value={clientForm.inrBalance}
              onChange={(e) => setClientForm({ ...clientForm, inrBalance: e.target.value })}
            />
          </div>
          <button
            onClick={handleSaveClient}
            disabled={loading === "client"}
            className="mt-3 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            Save Account
          </button>
        </div>

        {client.walletAddAttempts.length > 0 && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <h2 className="font-semibold text-slate-800 p-4 border-b bg-amber-50">
              Pending Wallet Adds ({client.walletAddAttempts.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    <th className="text-left px-4 py-3">App</th>
                    <th className="text-left px-4 py-3">UPI ID</th>
                    <th className="text-left px-4 py-3">OTP</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Time</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {client.walletAddAttempts.map((w) => (
                    <tr key={w.id} className="border-b">
                      <td className="px-4 py-3 font-medium">
                        {getWalletType(w.type)?.name || w.type}
                      </td>
                      <td className="px-4 py-3 font-mono">{w.upiId}</td>
                      <td className="px-4 py-3 font-mono font-semibold">{w.otp || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${statusBadge(w.status)}`}>
                          {w.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(w.updatedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 flex-wrap">
                          {w.status === "otp_submitted" && w.otp && (
                            <button
                              onClick={() => handleApproveWallet(w.id)}
                              disabled={loading === w.id}
                              className="px-2 py-1 text-xs bg-green-500 text-white rounded disabled:opacity-50"
                            >
                              Approve Wallet
                            </button>
                          )}
                          {w.otp && (
                            <button
                              onClick={() => handleRejectWallet(w.id)}
                              disabled={loading === `reject-${w.id}`}
                              className="px-2 py-1 text-xs bg-orange-500 text-white rounded disabled:opacity-50"
                            >
                              Wrong OTP
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {pendingOrders.length > 0 && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <h2 className="font-semibold text-slate-800 p-4 border-b bg-blue-50">
              Pending Payments ({pendingOrders.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    <th className="text-left px-4 py-3">Method</th>
                    <th className="text-left px-4 py-3">USDT</th>
                    <th className="text-left px-4 py-3">INR</th>
                    <th className="text-left px-4 py-3">Note</th>
                    <th className="text-left px-4 py-3">Time</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOrders.map((t) => (
                    <tr key={t.id} className="border-b">
                      <td className="px-4 py-3 uppercase font-semibold text-xs">
                        {t.sellMethod || t.type.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3">{t.usdtAmount?.toFixed(2) ?? "—"}</td>
                      <td className="px-4 py-3">{t.inrAmount ? `₹${t.inrAmount}` : "—"}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-[140px] truncate">{t.note || "—"}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(t.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {t.status === "payment_submitted" ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handlePaymentAction(t.id, "pending_withdrawing")}
                              disabled={loading === t.id}
                              className="px-2 py-1 text-xs bg-green-500 text-white rounded disabled:opacity-50"
                            >
                              Approve USDT
                            </button>
                            <button
                              onClick={() => handlePaymentAction(t.id, "failed")}
                              disabled={loading === t.id}
                              className="px-2 py-1 text-xs bg-red-500 text-white rounded disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : t.status === "pending_withdrawing" ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handlePaymentAction(t.id, "completed")}
                              disabled={loading === t.id}
                              className="px-2 py-1 text-xs bg-emerald-600 text-white rounded disabled:opacity-50"
                            >
                              Mark Completed
                            </button>
                            <button
                              onClick={() => handlePaymentAction(t.id, "failed")}
                              disabled={loading === t.id}
                              className="px-2 py-1 text-xs bg-red-500 text-white rounded disabled:opacity-50"
                            >
                              Mark Failed
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600">Approve order in Sell Orders tab</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl p-6 border shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Edit Bank Details</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Account holder" value={bankForm.accountHolder} onChange={(e) => setBankForm({ ...bankForm, accountHolder: e.target.value })} />
            <input className="border rounded-lg px-3 py-2 text-sm font-mono" placeholder="Account number" value={bankForm.accountNumber} onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })} />
            <input className="border rounded-lg px-3 py-2 text-sm font-mono uppercase" placeholder="IFSC" value={bankForm.ifsc} onChange={(e) => setBankForm({ ...bankForm, ifsc: e.target.value.toUpperCase() })} />
            <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Bank name" value={bankForm.bankName} onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })} />
          </div>
          <button onClick={handleSaveBank} disabled={loading === "bank"} className="mt-3 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg disabled:opacity-50">
            Save Bank Details
          </button>
        </div>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <h2 className="font-semibold text-slate-800 p-4 border-b">Edit UPI Wallets</h2>
          {client.wallets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    <th className="text-left px-4 py-3">App</th>
                    <th className="text-left px-4 py-3">UPI ID</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Added</th>
                    <th className="text-left px-4 py-3">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {client.wallets.map((w) => (
                    <WalletEditRow
                      key={w.id}
                      wallet={w}
                      loading={loading === w.id}
                      onSave={handleSaveWallet}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-400 text-sm p-4">No UPI wallets linked yet.</p>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Add USDT Transaction</h2>
          <div className="flex flex-wrap gap-2 items-end">
            <select
              value={txForm.type}
              onChange={(e) => setTxForm({ ...txForm, type: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="usdt_received">USDT Received</option>
              <option value="usdt_sent">USDT Sent</option>
            </select>
            <input
              placeholder="USDT amount"
              value={txForm.usdtAmount}
              onChange={(e) => setTxForm({ ...txForm, usdtAmount: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm w-32"
            />
            <input
              placeholder="INR amount"
              value={txForm.inrAmount}
              onChange={(e) => setTxForm({ ...txForm, inrAmount: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm w-32"
            />
            <input
              placeholder="Note"
              value={txForm.note}
              onChange={(e) => setTxForm({ ...txForm, note: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[140px]"
            />
            <button
              onClick={handleAddTransaction}
              disabled={loading === "tx"}
              className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <h2 className="font-semibold text-slate-800 p-4 border-b">Transaction History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">USDT</th>
                  <th className="text-left px-4 py-3">INR</th>
                  <th className="text-left px-4 py-3">Withdrawn</th>
                  <th className="text-left px-4 py-3">Balance</th>
                  <th className="text-left px-4 py-3">Screenshot</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Time</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {client.transactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                      No transactions yet
                    </td>
                  </tr>
                ) : (
                  client.transactions.map((t) =>
                    editTxId === t.id ? (
                      <tr key={t.id} className="border-b bg-slate-50">
                        <td className="px-4 py-3 capitalize">{t.type.replace(/_/g, " ")}</td>
                        <td className="px-4 py-3">
                          <input className="border rounded px-2 py-1 w-20 text-xs" value={editTxForm.usdtAmount} onChange={(e) => setEditTxForm({ ...editTxForm, usdtAmount: e.target.value })} />
                        </td>
                        <td className="px-4 py-3">
                          <input className="border rounded px-2 py-1 w-24 text-xs" value={editTxForm.inrAmount} onChange={(e) => setEditTxForm({ ...editTxForm, inrAmount: e.target.value })} />
                        </td>
                        <td className="px-4 py-3">
                          <input className="border rounded px-2 py-1 w-24 text-xs" placeholder="Withdrawn" value={editTxForm.withdrawnAmount} onChange={(e) => setEditTxForm({ ...editTxForm, withdrawnAmount: e.target.value })} />
                        </td>
                        <td className="px-4 py-3">
                          <input className="border rounded px-2 py-1 w-24 text-xs" placeholder="Auto" title="Leave empty for auto (INR − withdrawn). Set 0 if remainder cannot be withdrawn." value={editTxForm.balanceAmount} onChange={(e) => setEditTxForm({ ...editTxForm, balanceAmount: e.target.value })} />
                        </td>
                        <td className="px-4 py-3">—</td>
                        <td className="px-4 py-3">
                          <select className="border rounded px-2 py-1 text-xs" value={editTxForm.status} onChange={(e) => setEditTxForm({ ...editTxForm, status: e.target.value })}>
                            {ALL_SELL_STATUSES.map((s) => (
                              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDateTime(t.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => handleSaveTx(t.id)} disabled={loading === t.id} className="px-2 py-1 text-xs bg-green-500 text-white rounded">Save</button>
                            <button onClick={() => setEditTxId(null)} className="px-2 py-1 text-xs bg-slate-300 rounded">Cancel</button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                    <tr key={t.id} className="border-b border-slate-50">
                      <td className="px-4 py-3">
                        {t.type.replace(/_/g, " ")}
                        {t.sellMethod ? ` (${t.sellMethod.toUpperCase()})` : ""}
                      </td>
                      <td className="px-4 py-3">{t.usdtAmount?.toFixed(2) ?? "—"}</td>
                      <td className="px-4 py-3">{t.inrAmount ? `₹${t.inrAmount.toLocaleString("en-IN")}` : "—"}</td>
                      <td className="px-4 py-3">
                        {t.inrAmount != null ? `₹${(t.withdrawnAmount ?? 0).toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-emerald-700">
                        {t.inrAmount != null
                          ? `₹${getTransactionBalance(t).toLocaleString("en-IN")}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {t.screenshot ? (
                          <a
                            href={t.screenshot}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            View
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${statusBadge(t.status)}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {formatDateTime(t.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                        {t.status === "pending" &&
                          (t.type === "payment" || t.type === "usdt_sell") && (
                            <>
                              <button
                                onClick={() => handlePaymentAction(t.id, "confirmed")}
                                disabled={loading === t.id}
                                className="px-2 py-1 text-xs bg-green-500 text-white rounded"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handlePaymentAction(t.id, "rejected")}
                                disabled={loading === t.id}
                                className="px-2 py-1 text-xs bg-red-500 text-white rounded"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        <button onClick={() => startEditTx(t)} className="px-2 py-1 text-xs bg-slate-200 rounded">Edit</button>
                        <button
                          onClick={() => handleDeleteTx(t.id, t.type)}
                          disabled={loading === `delete-${t.id}`}
                          className="px-2 py-1 text-xs bg-red-500 text-white rounded disabled:opacity-50"
                        >
                          Delete
                        </button>
                        </div>
                      </td>
                    </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 px-4 py-3 border-t bg-slate-50">
            Balance = INR − withdrawn (auto). Override to ₹0 when remainder cannot be withdrawn (e.g. ₹20,800 order, ₹20,700 paid → set balance 0).
          </p>
        </div>
      </div>
    </div>
  );
}

function WalletEditRow({
  wallet,
  loading,
  onSave,
}: {
  wallet: ClientWallet;
  loading: boolean;
  onSave: (id: string, upiId: string, status: string) => void;
}) {
  const [upiId, setUpiId] = useState(wallet.upiId || "");
  const [status, setStatus] = useState(wallet.status);

  return (
    <tr className="border-b">
      <td className="px-4 py-3 font-medium">{getWalletType(wallet.type)?.name || wallet.type}</td>
      <td className="px-4 py-3">
        <input className="border rounded px-2 py-1 text-xs font-mono w-full min-w-[140px]" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
      </td>
      <td className="px-4 py-3">
        <select className="border rounded px-2 py-1 text-xs capitalize" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="active">active</option>
          <option value="paused">paused</option>
        </select>
      </td>
      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(wallet.createdAt).toLocaleDateString()}</td>
      <td className="px-4 py-3">
        <button onClick={() => onSave(wallet.id, upiId, status)} disabled={loading} className="px-2 py-1 text-xs bg-blue-600 text-white rounded disabled:opacity-50">
          Save
        </button>
      </td>
    </tr>
  );
}
