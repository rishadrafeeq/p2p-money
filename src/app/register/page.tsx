"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthCard from "@/components/AuthCard";
import PasswordInput from "@/components/PasswordInput";
import PasswordRules from "@/components/PasswordRules";
import GradientButton from "@/components/GradientButton";
import { validatePassword } from "@/lib/password";

export default function RegisterPage() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [inviteCode, setInviteCode] = useState("harz1jfe");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [adminMessage, setAdminMessage] = useState("");

  const cleanMobile = mobile.replace(/\D/g, "");

  useEffect(() => {
    if (cleanMobile.length !== 10) {
      setAdminMessage("");
      return;
    }

    async function checkStatus() {
      try {
        const res = await fetch(`/api/registration-status?mobile=${cleanMobile}`);
        const data = await res.json();

        if (data.status === "otp_rejected" && data.adminMessage) {
          setAdminMessage(data.adminMessage);
          setError(data.adminMessage);
          setMessage("");
        } else if (data.status === "registered") {
          setAdminMessage("");
          setMessage("Registration approved!");
          setError("");
        } else if (data.status === "otp_submitted") {
          setAdminMessage("");
          setMessage("OTP submitted. Waiting for admin verification...");
          setError("");
        }
      } catch {
        // ignore polling errors
      }
    }

    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [cleanMobile]);

  async function handleSendOtp() {
    setError("");
    setMessage("");
    setAdminMessage("");

    if (!mobile.trim() || !password.trim()) {
      setError("Please enter mobile number and password");
      return;
    }

    if (cleanMobile.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      setError(passwordCheck.error || "Invalid password");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: cleanMobile,
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
    setAdminMessage("");

    if (!mobile.trim() || !password.trim()) {
      setError("Please enter mobile number and password");
      return;
    }

    if (!otp.trim()) {
      setError("Please enter the OTP");
      return;
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      setError(passwordCheck.error || "Invalid password");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: cleanMobile,
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

      setMessage(data.message || "OTP submitted. Waiting for verification.");
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
        <PasswordRules password={password} />

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

        {adminMessage && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm mb-4 p-3 rounded-lg text-center">
            {adminMessage}
          </div>
        )}
        {error && !adminMessage && (
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
