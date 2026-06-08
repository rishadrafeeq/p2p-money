"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ClientData } from "@/types/client";
import { formatInr, maskMobile, shortId } from "@/lib/format";
import { PageContainer, PageHeader, StatCard, Card } from "./PageLayout";

const menuItems = [
  { label: "Sell History", desc: "View sell orders", href: "/deposit", icon: "↓", color: "bg-emerald-100 text-emerald-600" },
  { label: "Payment PIN", desc: "Set or change payment PIN", href: "/assets/payment-pin", icon: "🔐", color: "bg-indigo-100 text-indigo-600" },
  { label: "Wallet Tools", desc: "Manage UPI wallets", href: "/tools", icon: "🔧", color: "bg-violet-100 text-violet-600" },
  { label: "Team Referrals", desc: "Invite & earn", href: "/teams", icon: "👥", color: "bg-blue-100 text-blue-600" },
  { label: "Support Center", desc: "Chat with support", href: "/assets/support", icon: "🎧", color: "bg-cyan-100 text-cyan-600" },
];

export default function AssetsScreen({ client }: { client: ClientData }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/client/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <PageContainer>
      <PageHeader title="Assets" subtitle="Your profile, balance, and account settings" />

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-[#1e3a8a] to-[#4f46e5] p-6 sm:p-8 text-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl border border-white/30">
                  👤
                </div>
                <div>
                  <p className="font-bold text-lg">+91 {maskMobile(client.mobile)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-blue-200">ID: {shortId(client.id)}</span>
                    <button onClick={() => copyText(client.id)} className="text-blue-200 hover:text-white text-xs">
                      Copy
                    </button>
                  </div>
                </div>
              </div>
              <span className="inline-block mt-4 bg-white/20 text-xs px-3 py-1 rounded-full">
                Reward Ratio: 3
              </span>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Mobile</span>
                <button onClick={() => copyText(client.mobile)} className="font-medium text-slate-800 hover:text-blue-600">
                  +91 {client.mobile} 📋
                </button>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment PIN</span>
                <Link href="/assets/payment-pin" className="font-medium text-blue-600 hover:underline">
                  {client.hasPaymentPin ? "Change PIN" : "Set PIN"}
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Invite Code</span>
                <span className="font-medium text-slate-800">{client.inviteCode || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Member Since</span>
                <span className="font-medium text-slate-800">
                  {new Date(client.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </Card>

          <button
            onClick={handleLogout}
            className="w-full mt-4 py-3 border-2 border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <StatCard label="Quota" value={formatInr(client.quotaInr)} sub="Available balance" accent="blue" />
            <StatCard label="Today's Earning" value={formatInr(client.todayEarning)} sub="Confirmed today" accent="green" />
            <StatCard label="USDT Balance" value={`${client.usdtBalance.toFixed(2)}`} accent="violet" />
            <StatCard label="Total Received" value={`${client.usdtReceived.toFixed(2)} USDT`} accent="orange" />
          </div>

          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Quick Links</h2>
            </div>
            <div className="grid sm:grid-cols-2">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-4 px-6 py-5 hover:bg-slate-50 border-b border-r border-slate-50 transition-colors"
                >
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${item.color}`}>
                    {item.icon}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800">{item.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          {client.paymentDetails && (
            <Card className="p-6">
              <h2 className="font-bold text-slate-900 mb-4">Bank & UPI Details</h2>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <Info label="Bank" value={client.paymentDetails.bankName} />
                <Info label="Account Holder" value={client.paymentDetails.accountHolder} />
                <Info label="Account No." value={client.paymentDetails.accountNumber} />
                <Info label="IFSC" value={client.paymentDetails.ifsc} />
                <Info label="Mobikwik UPI" value={client.paymentDetails.upiMobikwik} />
                <Info label="PhonePe UPI" value={client.paymentDetails.upiPhonepe} />
                <Info label="Paytm UPI" value={client.paymentDetails.upiPaytm} />
              </div>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-slate-400 text-xs">{label}</p>
      <p className="font-medium text-slate-800 mt-0.5">{value || "—"}</p>
    </div>
  );
}
