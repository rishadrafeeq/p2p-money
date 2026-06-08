"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthCard from "@/components/AuthCard";
import PasswordInput from "@/components/PasswordInput";
import GradientButton from "@/components/GradientButton";

export default function LoginPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!mobile.trim() || !password.trim()) {
      setError("Please enter mobile number and password");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: mobile.replace(/\D/g, ""),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      if (data.redirect) {
        router.push(data.redirect);
        router.refresh();
        return;
      }
      setMessage("Login successful");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="p2p login">
      <form onSubmit={handleLogin}>
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
        <p className="text-xs text-slate-400 mb-4 -mt-2">
          Password is not case-sensitive (ABC and abc work the same).
        </p>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}
        {message && (
          <p className="text-green-600 text-sm mb-4 text-center">{message}</p>
        )}

        <GradientButton type="submit" loading={loading}>
          Login
        </GradientButton>

        <Link
          href="/register"
          className="block w-full mt-4 py-3.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-center text-[15px] hover:bg-slate-50 transition-colors"
        >
          Register
        </Link>
      </form>
    </AuthCard>
  );
}
