"use client";

import type { ReactNode, CSSProperties } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-slate-500 mt-1 text-sm sm:text-base">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">{children}</div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent = "blue",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "blue" | "green" | "orange" | "violet";
}) {
  const accents = {
    blue: "from-blue-500 to-blue-600",
    green: "from-emerald-500 to-emerald-600",
    orange: "from-orange-500 to-orange-600",
    violet: "from-violet-500 to-violet-600",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-sm text-slate-500 font-medium">{label}</p>
      <p
        className={`text-2xl sm:text-3xl font-bold mt-2 bg-gradient-to-r ${accents[accent]} bg-clip-text text-transparent`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export function Card({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 shadow-sm ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
