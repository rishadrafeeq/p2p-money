"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface PaymentDetails {
  bankName: string | null;
  accountNumber: string | null;
  ifsc: string | null;
  accountHolder: string | null;
  upiMobikwik: string | null;
  upiPhonepe: string | null;
  upiPaytm: string | null;
}

interface Transaction {
  id: string;
  type: string;
  usdtAmount: number | null;
  inrAmount: number | null;
  screenshot: string | null;
  note: string | null;
  status: string;
  createdAt: string;
}

interface ClientData {
  id: string;
  mobile: string;
  usdtBalance: number;
  usdtSent: number;
  usdtReceived: number;
  paymentDetails: PaymentDetails | null;
  transactions: Transaction[];
}

function typeLabel(type: string) {
  const labels: Record<string, string> = {
    usdt_sent: "USDT Sent",
    usdt_received: "USDT Received",
    payment: "Payment",
  };
  return labels[type] || type;
}

export default function ClientDashboard({ client }: { client: ClientData }) {
  const router = useRouter();
  const [tab, setTab] = useState<"overview" | "payment" | "details" | "history">("overview");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [bankName, setBankName] = useState(client.paymentDetails?.bankName || "");
  const [accountNumber, setAccountNumber] = useState(client.paymentDetails?.accountNumber || "");
  const [ifsc, setIfsc] = useState(client.paymentDetails?.ifsc || "");
  const [accountHolder, setAccountHolder] = useState(client.paymentDetails?.accountHolder || "");
  const [upiMobikwik, setUpiMobikwik] = useState(client.paymentDetails?.upiMobikwik || "");
  const [upiPhonepe, setUpiPhonepe] = useState(client.paymentDetails?.upiPhonepe || "");
  const [upiPaytm, setUpiPaytm] = useState(client.paymentDetails?.upiPaytm || "");

  const [inrAmount, setInrAmount] = useState("");
  const [usdtAmount, setUsdtAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);

  async function handleLogout() {
    await fetch("/api/client/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function savePaymentDetails(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/client/payment-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName,
          accountNumber,
          ifsc,
          accountHolder,
          upiMobikwik,
          upiPhonepe,
          upiPaytm,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save");
        return;
      }
      setMessage("Payment details saved");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const formData = new FormData();
    if (inrAmount) formData.append("inrAmount", inrAmount);
    if (usdtAmount) formData.append("usdtAmount", usdtAmount);
    if (paymentNote) formData.append("note", paymentNote);
    if (screenshot) formData.append("screenshot", screenshot);

    try {
      const res = await fetch("/api/client/payment", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit payment");
        return;
      }
      setMessage("Payment submitted. Admin will verify shortly.");
      setInrAmount("");
      setUsdtAmount("");
      setPaymentNote("");
      setScreenshot(null);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#f5e6ff] via-[#f0e8ff] to-[#e8f0ff]">
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">P2P USDT Dashboard</h1>
          <p className="text-sm text-slate-500">+91 {client.mobile}</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700"
        >
          Logout
        </button>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500">USDT Received</p>
            <p className="text-2xl font-bold text-green-600">{client.usdtReceived.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500">USDT Sent</p>
            <p className="text-2xl font-bold text-orange-500">{client.usdtSent.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500">Balance</p>
            <p className="text-2xl font-bold text-blue-600">{client.usdtBalance.toFixed(2)} USDT</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {(["overview", "payment", "details", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                tab === t
                  ? "bg-blue-500 text-white"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {message && (
          <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm">{message}</div>
        )}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        {tab === "overview" && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <h2 className="font-semibold text-slate-800 mb-4">Account Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Mobile</span>
                <span className="font-medium">+91 {client.mobile}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">USDT Balance</span>
                <span className="font-bold text-blue-600">{client.usdtBalance.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Total Transactions</span>
                <span className="font-medium">{client.transactions.length}</span>
              </div>
              <p className="text-slate-400 text-xs pt-2">
                Buy and sell USDT through this platform. Submit payment screenshots for admin verification.
              </p>
            </div>
          </div>
        )}

        {tab === "payment" && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <h2 className="font-semibold text-slate-800 mb-4">Submit Payment</h2>
            <form onSubmit={submitPayment} className="space-y-4">
              <div>
                <label className="text-sm text-slate-600">INR Amount Paid</label>
                <input
                  type="number"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1"
                  value={inrAmount}
                  onChange={(e) => setInrAmount(e.target.value)}
                  placeholder="e.g. 5000"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600">USDT Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1"
                  value={usdtAmount}
                  onChange={(e) => setUsdtAmount(e.target.value)}
                  placeholder="e.g. 60"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600">Note (optional)</label>
                <input
                  type="text"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="UPI ref / transaction id"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600">Payment Screenshot</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full mt-1 text-sm"
                  onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg text-white font-semibold bg-gradient-to-r from-blue-500 to-pink-500 disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit Payment"}
              </button>
            </form>
          </div>
        )}

        {tab === "details" && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <h2 className="font-semibold text-slate-800 mb-4">Bank & UPI Details</h2>
            <form onSubmit={savePaymentDetails} className="space-y-4">
              <p className="text-xs text-slate-400 font-medium uppercase">Bank Account</p>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2"
                placeholder="Bank Name"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2"
                placeholder="Account Holder Name"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
              />
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2"
                placeholder="Account Number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2"
                placeholder="IFSC Code"
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value)}
              />

              <p className="text-xs text-slate-400 font-medium uppercase pt-2">UPI IDs</p>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2"
                placeholder="Mobikwik UPI"
                value={upiMobikwik}
                onChange={(e) => setUpiMobikwik(e.target.value)}
              />
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2"
                placeholder="PhonePe UPI"
                value={upiPhonepe}
                onChange={(e) => setUpiPhonepe(e.target.value)}
              />
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2"
                placeholder="Paytm UPI"
                value={upiPaytm}
                onChange={(e) => setUpiPaytm(e.target.value)}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg text-white font-semibold bg-gradient-to-r from-blue-500 to-pink-500 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Details"}
              </button>
            </form>
          </div>
        )}

        {tab === "history" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    <th className="text-left px-4 py-3 text-slate-600">Type</th>
                    <th className="text-left px-4 py-3 text-slate-600">USDT</th>
                    <th className="text-left px-4 py-3 text-slate-600">INR</th>
                    <th className="text-left px-4 py-3 text-slate-600">Screenshot</th>
                    <th className="text-left px-4 py-3 text-slate-600">Status</th>
                    <th className="text-left px-4 py-3 text-slate-600">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {client.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        No transactions yet
                      </td>
                    </tr>
                  ) : (
                    client.transactions.map((t) => (
                      <tr key={t.id} className="border-b border-slate-50">
                        <td className="px-4 py-3">{typeLabel(t.type)}</td>
                        <td className="px-4 py-3">{t.usdtAmount?.toFixed(2) ?? "—"}</td>
                        <td className="px-4 py-3">{t.inrAmount ? `₹${t.inrAmount}` : "—"}</td>
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
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              t.status === "confirmed"
                                ? "bg-green-100 text-green-700"
                                : t.status === "rejected"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {new Date(t.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
