"use client";

import Link from "next/link";
import type { ClientData } from "@/types/client";
import { getWalletType } from "@/lib/wallets";
import { PageContainer, PageHeader, StatCard, Card } from "./PageLayout";
import { formatInr, formatDateTime } from "@/lib/format";

const rewards = [
  ["95.1 USDT / ₹10,000", "₹100"],
  ["190.1 USDT / ₹20,000", "₹200"],
  ["475.1 USDT / ₹50,000", "₹500"],
  ["950.1 USDT / ₹1,00,000", "₹1,000"],
];

export default function HomeScreen({ client }: { client: ClientData }) {
  const limits = client.dailySellLimits;

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        subtitle="Your USDT balance stays in your account until you withdraw — sell anytime at live rates"
        action={
          <Link
            href="/deposit"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20"
          >
            Sell USDT
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Available Balance"
          value={formatInr(client.availableBalance)}
          sub={
            client.availableBalance > 0
              ? "Remaining amount available to withdraw"
              : "No balance available to withdraw"
          }
          accent="blue"
        />
        <StatCard
          label="Est. Value"
          value={formatInr(client.estValue)}
          sub="Balance + USDT at current rates"
          accent="green"
        />
        <StatCard
          label="Total Withdrawn"
          value={formatInr(client.totalWithdrawn)}
          sub="Completed sell orders"
          accent="violet"
        />
        <StatCard
          label="UPI Wallets"
          value={String(client.wallets.length)}
          sub={`₹${(limits.upiLimitPerWallet / 100000).toFixed(0)}L reference per UPI ID`}
          accent="orange"
        />
      </div>

      <Card className="p-6 mb-6 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
        <h2 className="font-bold text-slate-900 text-lg mb-2">UPI Withdrawals</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Each UPI ID has a reference limit of{" "}
          <strong>{formatInr(limits.upiLimitPerWallet)}</strong> per day. There is no hard block — if
          you need more capacity, add another UPI wallet in{" "}
          <Link href="/tools" className="text-blue-600 font-semibold hover:underline">
            Tools
          </Link>{" "}
          linked to a different bank, or update which bank your UPI is connected to. Any USDT you
          do not sell today remains in your balance and can be withdrawn at any time.
        </p>
        {limits.upiWallets.length > 0 ? (
          <div className="mt-4 space-y-2">
            {limits.upiWallets.map((w) => (
              <div
                key={w.walletId}
                className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-xl px-4 py-3 border border-blue-100 text-sm"
              >
                <div>
                  <span className="font-semibold text-slate-800">
                    {getWalletType(w.type)?.name || w.type}
                  </span>
                  <span className="text-slate-500 ml-2">{w.upiId || "UPI pending"}</span>
                  {w.bankLabel && (
                    <span className="text-slate-400 ml-2">· {w.bankLabel}</span>
                  )}
                </div>
                <span className="text-blue-700 font-medium">
                  {formatInr(w.remaining)} available today
                </span>
              </div>
            ))}
          </div>
        ) : (
          <Link
            href="/tools"
            className="inline-block mt-3 text-sm font-semibold text-blue-600 hover:underline"
          >
            Add your first UPI wallet →
          </Link>
        )}
      </Card>

      <Card className="p-6 mb-8 border-violet-100 bg-gradient-to-br from-violet-50 to-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="font-bold text-slate-900 text-lg">IMPS Withdrawals</h2>
            <p className="text-sm text-slate-600 mt-1">
              Each bank account has a daily reference limit of{" "}
              <strong>{formatInr(limits.impsLimitPerBank)}</strong>. Add multiple bank accounts in{" "}
              <Link href="/tools" className="text-violet-600 font-semibold hover:underline">
                Tools
              </Link>{" "}
              to increase your daily IMPS capacity. Limits reset at 12:00 AM.
            </p>
          </div>
          <p className="text-xs text-slate-400 shrink-0">
            Resets {formatDateTime(limits.resetsAt)}
          </p>
        </div>
        {limits.impsBanks.length > 0 ? (
          <div className="space-y-3">
            {limits.impsBanks.map((b) => (
              <div key={b.bankAccountId} className="bg-white rounded-xl px-4 py-3 border border-violet-100">
                <div className="flex flex-wrap justify-between gap-2 text-sm mb-2">
                  <div>
                    <p className="font-semibold text-slate-800">{b.accountHolder}</p>
                    <p className="text-slate-500 text-xs">
                      {b.accountNumber} · {b.ifsc}
                      {b.bankName ? ` · ${b.bankName}` : ""}
                    </p>
                  </div>
                  <p className="text-violet-700 font-semibold">{formatInr(b.remaining)} left today</p>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-600 rounded-full"
                    style={{ width: `${Math.min(100, (b.used / b.limit) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {formatInr(b.used)} used of {formatInr(b.limit)} today
                </p>
              </div>
            ))}
          </div>
        ) : (
          <Link
            href="/tools"
            className="inline-block text-sm font-semibold text-violet-600 hover:underline"
          >
            Add a bank account for IMPS →
          </Link>
        )}
      </Card>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <Link
              href="/deposit"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 to-blue-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5"
            >
              <p className="text-sm text-blue-200 font-medium">Sell via UPI</p>
              <p className="text-2xl font-bold mt-2">UPI Payout</p>
              <p className="text-sm text-blue-100 mt-2">
                1 USDT = ₹ {client.sellRates.upiSellRate.toFixed(2)}
              </p>
            </Link>
            <Link
              href="/deposit"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-700 to-violet-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5"
            >
              <p className="text-sm text-violet-200 font-medium">Sell via IMPS</p>
              <p className="text-2xl font-bold mt-2">IMPS Payout</p>
              <p className="text-sm text-violet-100 mt-2">
                1 USDT = ₹ {client.sellRates.impsSellRate.toFixed(2)}
              </p>
            </Link>
          </div>

          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
              <p className="text-white font-bold text-lg">Daily Challenge Rewards</p>
              <p className="text-amber-100 text-sm">Sell more USDT — unlock bonus rewards</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600">
                    <th className="text-left px-6 py-3 font-semibold">Sell Amount</th>
                    <th className="text-right px-6 py-3 font-semibold">Bonus</th>
                  </tr>
                </thead>
                <tbody>
                  {rewards.map(([amt, bonus]) => (
                    <tr key={amt} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-3 text-slate-700">{amt}</td>
                      <td className="px-6 py-3 text-right font-bold text-emerald-600">{bonus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
            <p className="text-slate-400 text-sm font-medium">Available Balance</p>
            <p className="text-3xl font-bold mt-2">{formatInr(client.availableBalance)}</p>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              Total withdrawn: {formatInr(client.totalWithdrawn)} · Est. portfolio value:{" "}
              {formatInr(client.estValue)}
            </p>
            <Link
              href="/deposit"
              className="inline-block mt-5 bg-white text-slate-900 font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-slate-100"
            >
              Withdraw Now
            </Link>
          </Card>

          <Card className="p-5">
            <p className="font-semibold text-slate-800 mb-3">Live Rates</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                <span className="font-medium text-blue-800">UPI</span>
                <span className="font-bold text-blue-600">₹{client.sellRates.upiSellRate.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-violet-50 rounded-xl">
                <span className="font-medium text-violet-800">IMPS</span>
                <span className="font-bold text-violet-600">₹{client.sellRates.impsSellRate.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
