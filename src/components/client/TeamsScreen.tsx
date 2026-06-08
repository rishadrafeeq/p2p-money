"use client";

import type { ClientData } from "@/types/client";
import { PageContainer, PageHeader, StatCard, Card } from "./PageLayout";

export default function TeamsScreen({ client }: { client: ClientData }) {
  function copyCode() {
    if (client.inviteCode) navigator.clipboard.writeText(client.inviteCode);
  }

  return (
    <PageContainer>
      <PageHeader
        title="Teams"
        subtitle="Invite friends and earn rewards together"
      />

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="p-8 sm:p-10 text-center lg:text-left">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-5xl shrink-0">
              👥
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900">Invite & Earn</h2>
              <p className="text-slate-500 mt-2">
                Share your unique invite code. When friends join and trade, you both benefit.
              </p>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-100">
            <p className="text-sm text-slate-500 font-medium">Your Invite Code</p>
            <div className="flex items-center justify-center lg:justify-start gap-3 mt-2">
              <p className="text-3xl sm:text-4xl font-bold text-blue-700 tracking-[0.2em]">
                {client.inviteCode || "—"}
              </p>
              {client.inviteCode && (
                <button
                  onClick={copyCode}
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
                >
                  Copy
                </button>
              )}
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Team Members" value="0" sub="Active referrals" accent="blue" />
            <StatCard label="Team Earnings" value="₹0" sub="Total commission" accent="green" />
          </div>

          <Card className="p-6">
            <h3 className="font-bold text-slate-900 mb-4">How it works</h3>
            <ol className="space-y-4">
              {[
                "Share your invite code with friends",
                "They register using your code",
                "Admin approves their account",
                "Earn rewards when they trade USDT",
              ].map((step, i) => (
                <li key={step} className="flex gap-3 text-sm">
                  <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 text-xs">
                    {i + 1}
                  </span>
                  <span className="text-slate-600 pt-1">{step}</span>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-violet-50 to-blue-50 border-violet-100">
            <p className="font-semibold text-violet-900">Reward Ratio: 3x</p>
            <p className="text-sm text-violet-700 mt-1">
              Higher trading volume unlocks better referral bonuses for your team.
            </p>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
