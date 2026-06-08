"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ClientData } from "@/types/client";
import { getWalletType } from "@/lib/wallets";
import { maskMobile } from "@/lib/format";
import { PageContainer, PageHeader, Card } from "./PageLayout";
import WalletSelectModal from "./WalletSelectModal";

function maskAccountNumber(num: string | null | undefined) {
  if (!num) return "—";
  if (num.length <= 4) return num;
  return "••••" + num.slice(-4);
}

export default function ToolsScreen({ client }: { client: ClientData }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [upiInput, setUpiInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [addStep, setAddStep] = useState<1 | 2>(1);
  const [attemptId, setAttemptId] = useState<string | null>(client.pendingWalletAdd?.id || null);
  const [loading, setLoading] = useState(false);
  const [walletError, setWalletError] = useState("");
  const [walletMessage, setWalletMessage] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState("");
  const [bankForm, setBankForm] = useState({
    accountHolder: client.paymentDetails?.accountHolder || "",
    accountNumber: "",
    confirmAccountNumber: "",
    ifsc: client.paymentDetails?.ifsc || "",
  });

  const [bankLabel, setBankLabel] = useState("");

  const pendingAdd = client.pendingWalletAdd;

  useEffect(() => {
    if (pendingAdd?.status === "address_submitted" || pendingAdd?.status === "otp_submitted") {
      setAttemptId(pendingAdd.id);
      setAddStep(pendingAdd.status === "address_submitted" ? 2 : 2);
      setUpiInput(pendingAdd.upiId);
      setSelectedType(pendingAdd.type);
    }
  }, [pendingAdd]);

  useEffect(() => {
    async function pollStatus() {
      try {
        const res = await fetch("/api/client/wallets/add-status");
        const data = await res.json();
        const attempt = data.attempt;
        if (!attempt) {
          if (pendingAdd?.status === "otp_submitted") {
            setWalletMessage("Wallet approved and added!");
            setWalletError("");
            setSelectedType(null);
            setAddStep(1);
            setUpiInput("");
            setOtpInput("");
            router.refresh();
          }
          return;
        }

        if (attempt.status === "rejected" && attempt.adminMessage) {
          setWalletError(attempt.adminMessage);
          setWalletMessage("");
          setAddStep(2);
          setAttemptId(attempt.id);
        } else if (attempt.status === "otp_submitted") {
          setWalletMessage("OTP submitted. Waiting for admin verification...");
          setWalletError("");
        }
      } catch {
        // ignore
      }
    }

    if (selectedType || pendingAdd) {
      pollStatus();
      const interval = setInterval(pollStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedType, pendingAdd, router]);

  async function handleSelectType(type: string) {
    setSelectedType(type);
    setAddStep(1);
    setUpiInput("");
    setOtpInput("");
    setWalletError("");
    setWalletMessage("");
    setModalOpen(false);
  }

  async function handleSubmitWalletAddress() {
    if (!selectedType) return;
    if (!upiInput.trim()) {
      setWalletError("Enter your wallet UPI address");
      return;
    }

    setLoading(true);
    setWalletError("");
    setWalletMessage("");
    try {
      const res = await fetch("/api/client/wallets/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: selectedType, upiId: upiInput.trim(), bankLabel: bankLabel.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWalletError(data.error || "Failed to submit wallet");
        return;
      }
      setAttemptId(data.attemptId);
      setAddStep(2);
      setWalletMessage(data.message || "Enter OTP received on your number.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmWalletOtp() {
    if (!otpInput.trim()) {
      setWalletError("Enter the OTP received on your number");
      return;
    }

    setLoading(true);
    setWalletError("");
    try {
      const res = await fetch("/api/client/wallets/confirm-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: otpInput.trim(), attemptId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWalletError(data.error || "Failed to submit OTP");
        return;
      }
      setWalletMessage(data.message || "OTP submitted. Waiting for admin verification.");
      setOtpInput("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleWalletAction(walletId: string, action: "pause" | "resume" | "delete") {
    if (action === "delete" && !confirm("Delete this wallet?")) return;

    setActionLoading(`${action}-${walletId}`);
    try {
      if (action === "delete") {
        await fetch(`/api/client/wallets/${walletId}`, { method: "DELETE" });
      } else {
        await fetch(`/api/client/wallets/${walletId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
      }
      router.refresh();
    } finally {
      setActionLoading(null);
    }
  }

  function closeAddModal() {
    setSelectedType(null);
    setAddStep(1);
    setUpiInput("");
    setOtpInput("");
    setBankLabel("");
    setWalletError("");
    setWalletMessage("");
  }

  async function handleSaveBankAccount() {
    setBankError("");

    if (!bankForm.accountHolder.trim()) {
      setBankError("Account holder name is required");
      return;
    }
    if (!bankForm.accountNumber.trim()) {
      setBankError("Account number is required");
      return;
    }
    if (bankForm.accountNumber !== bankForm.confirmAccountNumber) {
      setBankError("Account numbers do not match");
      return;
    }
    if (!bankForm.ifsc.trim()) {
      setBankError("IFSC code is required");
      return;
    }

    setBankLoading(true);
    try {
      const res = await fetch("/api/client/payment-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bankForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setBankError(data.error || "Failed to save bank account");
        return;
      }
      setBankModalOpen(false);
      setBankForm((f) => ({ ...f, accountNumber: "", confirmAccountNumber: "" }));
      router.refresh();
    } finally {
      setBankLoading(false);
    }
  }

  function openBankModal() {
    setBankError("");
    setBankForm({
      accountHolder: client.paymentDetails?.accountHolder || "",
      accountNumber: "",
      confirmAccountNumber: "",
      ifsc: client.paymentDetails?.ifsc || "",
    });
    setBankModalOpen(true);
  }

  return (
    <PageContainer>
      <PageHeader
        title="Tools"
        subtitle="Link UPI wallets and bank accounts — each UPI ID and bank has its own daily reference limit"
        action={
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20"
          >
            <span className="text-xl leading-none">+</span> Add Wallet
          </button>
        }
      />

      <Card className="p-5 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-2xl shrink-0">
                🏦
              </div>
              <div>
                <p className="font-bold text-slate-900 text-lg">Bank Accounts</p>
                <p className="text-sm text-slate-500 mt-1">
                  IMPS reference limit of ₹1 lakh per day per account. Add multiple accounts for higher capacity.
                </p>
              </div>
            </div>
            {client.bankAccounts.length === 0 ? (
              <p className="text-sm text-slate-500 ml-16">No bank accounts added yet.</p>
            ) : (
              <div className="space-y-3 ml-0 sm:ml-16">
                {client.bankAccounts.map((b) => (
                  <div
                    key={b.id}
                    className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 text-sm"
                  >
                    <p className="font-semibold text-slate-800">{b.accountHolder}</p>
                    <p className="text-slate-500 mt-0.5">
                      {maskAccountNumber(b.accountNumber)} · {b.ifsc}
                      {b.bankName ? ` · ${b.bankName}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={openBankModal}
            className="shrink-0 px-5 py-2.5 rounded-xl font-semibold text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            Add Bank Account
          </button>
        </div>
      </Card>

      {pendingAdd && !selectedType && (
        <Card className="p-4 mb-6 border-amber-200 bg-amber-50">
          <p className="font-semibold text-amber-800">Wallet verification in progress</p>
          <p className="text-sm text-amber-700 mt-1">
            {getWalletType(pendingAdd.type)?.name} — {pendingAdd.upiId} ({pendingAdd.status.replace(/_/g, " ")})
          </p>
          <button
            onClick={() => {
              setSelectedType(pendingAdd.type);
              setUpiInput(pendingAdd.upiId);
              setAttemptId(pendingAdd.id);
              setAddStep(2);
            }}
            className="mt-3 text-sm font-semibold text-amber-800 underline"
          >
            Continue OTP entry
          </button>
        </Card>
      )}

      {client.wallets.length === 0 && !selectedType && !pendingAdd ? (
        <Card className="py-16 sm:py-24 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-4xl mb-4">
            👛
          </div>
          <p className="text-xl font-bold text-slate-800">No wallets connected</p>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">
            Add Mobikwik, PhonePe, Paytm or other UPI wallets for withdrawals.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-6 bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Add Your First Wallet
          </button>
        </Card>
      ) : client.wallets.length > 0 ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {client.wallets.map((w) => {
            const config = getWalletType(w.type);
            const isPaused = w.status === "paused";
            return (
              <Card
                key={w.id}
                className="p-5 hover:shadow-md transition-shadow"
                style={{ borderLeftWidth: 4, borderLeftColor: config?.color || "#2563eb" }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                    style={{ backgroundColor: config?.color || "#2563eb" }}
                  >
                    {config?.letter || "W"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-lg">{config?.name || w.type}</p>
                    <p className="text-sm text-slate-500 mt-0.5 truncate">{w.upiId || "UPI not configured"}</p>
                    {w.bankLabel && (
                      <p className="text-xs text-slate-400 mt-0.5">Bank: {w.bankLabel}</p>
                    )}
                    <span
                      className={`inline-block mt-3 text-xs px-2.5 py-1 rounded-full font-medium ${
                        isPaused ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {isPaused ? "Paused" : "Active"}
                    </span>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {isPaused ? (
                        <button
                          onClick={() => handleWalletAction(w.id, "resume")}
                          disabled={actionLoading === `resume-${w.id}`}
                          className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Play
                        </button>
                      ) : (
                        <button
                          onClick={() => handleWalletAction(w.id, "pause")}
                          disabled={actionLoading === `pause-${w.id}`}
                          className="text-xs px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
                        >
                          Pause
                        </button>
                      )}
                      <button
                        onClick={() => handleWalletAction(w.id, "delete")}
                        disabled={actionLoading === `delete-${w.id}`}
                        className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}

      {selectedType && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 sm:p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-1">
              Add {getWalletType(selectedType)?.name} Wallet
            </h3>

            {addStep === 1 ? (
              <>
                <p className="text-sm text-slate-500 mb-4">Enter your wallet UPI address</p>
                <input
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  placeholder="yourname@upi"
                  value={upiInput}
                  onChange={(e) => setUpiInput(e.target.value)}
                />
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Connected bank (optional)
                </label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  placeholder="e.g. SBI, HDFC — helps track UPI limits"
                  value={bankLabel}
                  onChange={(e) => setBankLabel(e.target.value)}
                />
                <div className="flex gap-3">
                  <button
                    onClick={closeAddModal}
                    className="flex-1 py-3 border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitWalletAddress}
                    disabled={loading}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? "Sending..." : "Add Wallet"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-500 mb-1">Wallet: {upiInput}</p>
                <p className="text-sm text-slate-500 mb-5">
                  Enter OTP received on +91 {maskMobile(client.mobile)}
                </p>
                <input
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  placeholder="Enter OTP"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                />
                <div className="flex gap-3">
                  <button
                    onClick={closeAddModal}
                    className="flex-1 py-3 border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmWalletOtp}
                    disabled={loading}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? "Confirming..." : "Confirm"}
                  </button>
                </div>
              </>
            )}

            {walletError && <p className="text-red-600 text-sm mt-4">{walletError}</p>}
            {walletMessage && <p className="text-green-600 text-sm mt-4">{walletMessage}</p>}
          </Card>
        </div>
      )}

      {bankModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Add Bank Account</h3>
            <p className="text-sm text-slate-500 mb-5">
              Each account has its own ₹1 lakh IMPS daily reference limit
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Account Holder Name</label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  placeholder="Name as per bank"
                  value={bankForm.accountHolder}
                  onChange={(e) => setBankForm((f) => ({ ...f, accountHolder: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Account Number</label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  placeholder="Enter account number"
                  inputMode="numeric"
                  value={bankForm.accountNumber}
                  onChange={(e) => setBankForm((f) => ({ ...f, accountNumber: e.target.value.replace(/\D/g, "") }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Account Number</label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  placeholder="Re-enter account number"
                  inputMode="numeric"
                  value={bankForm.confirmAccountNumber}
                  onChange={(e) =>
                    setBankForm((f) => ({ ...f, confirmAccountNumber: e.target.value.replace(/\D/g, "") }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">IFSC Code</label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 uppercase"
                  placeholder="e.g. SBIN0001234"
                  maxLength={11}
                  value={bankForm.ifsc}
                  onChange={(e) => setBankForm((f) => ({ ...f, ifsc: e.target.value.toUpperCase() }))}
                />
              </div>
            </div>

            {bankError && <p className="text-red-600 text-sm mt-4">{bankError}</p>}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setBankModalOpen(false)}
                className="flex-1 py-3 border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBankAccount}
                disabled={bankLoading}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50"
              >
                {bankLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </Card>
        </div>
      )}

      <button
        onClick={() => setModalOpen(true)}
        className="lg:hidden fixed bottom-24 right-5 w-14 h-14 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-2xl shadow-xl flex items-center justify-center text-3xl font-light z-40"
      >
        +
      </button>

      <WalletSelectModal open={modalOpen} onClose={() => setModalOpen(false)} onSelect={handleSelectType} />
    </PageContainer>
  );
}
