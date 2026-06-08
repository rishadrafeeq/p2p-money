"use client";

import { useState } from "react";
import Link from "next/link";
import AuthCard from "@/components/AuthCard";
import PasswordInput from "@/components/PasswordInput";
import GradientButton from "@/components/GradientButton";

export default function RegisterPage() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [inviteCode, setInviteCode] = useState("harz1jfe");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSendOtp() {
    setError("");
    setMessage("");

    if (!mobile.trim() || !password.trim()) {
      setError("Please enter mobile number and password");
      return;
    }

    if (mobile.replace(/\D/g, "").length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: mobile.replace(/\D/g, ""),
          password,
          inviteCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send OTP");
        return;
      }

      setMessage("OTP sent successfully");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!mobile.trim() || !password.trim()) {
      setError("Please enter mobile number and password");
      return;
    }

    if (!otp.trim()) {
      setError("Please enter the OTP");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: mobile.replace(/\D/g, ""),
          password,
          otp,
          inviteCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      setMessage("Registration successful!");
      setOtp("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="p2p register">
      <form onSubmit={handleRegister}>
        <div className="border-b border-slate-300 flex items-center gap-2 py-3 mb-5">
          <span className="font-bold text-[#2d3748] text-[15px]">+91</span>
          <input
            type="tel"
            className="flex-1 outline-none placeholder:text-slate-400 uppercase text-slate-700 bg-transparent"
            placeholder="MOBILE"
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
            maxLength={10}
          />
        </div>

        <PasswordInput value={password} onChange={setPassword} />

        <div className="border-b border-slate-300 flex items-center gap-2 py-3 mb-5">
          <input
            type="text"
            className="flex-1 outline-none placeholder:text-slate-400 uppercase text-slate-700 bg-transparent"
            placeholder="OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6}
          />
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={loading}
            className="bg-[#7dd3fc] hover:bg-[#38bdf8] text-white text-xs font-medium px-4 py-2 rounded-md transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            Send OTP
          </button>
        </div>

        <input
          type="text"
          className="w-full bg-slate-100 rounded px-3 py-3 mb-6 outline-none text-slate-700 text-[15px]"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
        />

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}
        {message && (
          <p className="text-green-600 text-sm mb-4 text-center">{message}</p>
        )}

        <GradientButton type="submit" loading={loading}>
          Register
        </GradientButton>

        <Link
          href="/login"
          className="block w-full mt-4 py-3.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-center text-[15px] hover:bg-slate-50 transition-colors"
        >
          Login
        </Link>
      </form>
    </AuthCard>
  );
}
