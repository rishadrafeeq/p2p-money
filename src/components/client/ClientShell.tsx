"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import PushNotificationBanner from "./PushNotificationBanner";
import { clientNavItems, brand } from "./nav-config";
import { formatInr, maskMobile } from "@/lib/format";

interface ClientShellProps {
  children: React.ReactNode;
  mobile: string;
  usdtBalance: number;
  quotaInr: number;
}

export default function ClientShell({
  children,
  mobile,
  usdtBalance,
  quotaInr,
}: ClientShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 bg-[#0f172a] text-white">
        <div className="p-6 border-b border-white/10">
          <Link href="/home" className="block">
            <p className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              {brand.name}
            </p>
            <p className="text-xs text-slate-400 mt-1">{brand.tagline}</p>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {clientNavItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-xl px-4 py-3 transition-all ${
                  active
                    ? "bg-gradient-to-r from-blue-600 to-violet-600 shadow-lg shadow-blue-900/30"
                    : "hover:bg-white/5 text-slate-300"
                }`}
              >
                <p className={`font-semibold text-sm ${active ? "text-white" : ""}`}>{item.label}</p>
                <p className={`text-xs mt-0.5 ${active ? "text-blue-100" : "text-slate-500"}`}>
                  {item.desc}
                </p>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 m-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-xs text-slate-400">Your balance</p>
          <p className="text-xl font-bold text-white mt-1">{usdtBalance.toFixed(2)} USDT</p>
          <p className="text-sm text-slate-400">{formatInr(quotaInr)}</p>
          <p className="text-xs text-slate-500 mt-2">+91 {maskMobile(mobile)}</p>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <div className="lg:hidden">
              <Link href="/home" className="text-lg font-bold text-[#1e3a8a]">
                {brand.name}
              </Link>
            </div>
            <div className="hidden lg:block">
              <p className="text-sm text-slate-500">Welcome back</p>
              <p className="font-semibold text-slate-800">+91 {maskMobile(mobile)}</p>
            </div>

            <div className="flex items-center gap-3 sm:gap-6">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-500">Balance</p>
                <p className="font-bold text-[#1e3a8a]">{usdtBalance.toFixed(2)} USDT</p>
              </div>
              <div className="h-8 w-px bg-slate-200 hidden sm:block" />
              <div className="text-right hidden md:block">
                <p className="text-xs text-slate-500">Quota</p>
                <p className="font-semibold text-slate-800">{formatInr(quotaInr)}</p>
              </div>
              <Link
                href="/deposit"
                className="bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity shrink-0"
              >
                Sell USDT
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 pb-24 lg:pb-8">
          <PushNotificationBanner />
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] safe-bottom">
        <div className="flex items-center justify-around px-1 py-2 max-w-lg mx-auto">
          {clientNavItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 min-w-[56px] py-1 rounded-lg ${
                  active ? "text-blue-600" : "text-slate-400"
                }`}
              >
                <NavDot active={active} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function NavDot({ active }: { active: boolean }) {
  return (
    <span
      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
        active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
      }`}
    >
      {active ? "●" : "○"}
    </span>
  );
}
