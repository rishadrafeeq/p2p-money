"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface PinFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  helpText?: string;
}

function PinField({ label, value, onChange, placeholder, helpText }: PinFieldProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="mb-5">
      <label className="block font-bold text-slate-800 mb-2">{label}</label>
      <div className="flex items-center border-2 border-[#1e3a8a] rounded-xl px-4 py-3 bg-white">
        <input
          type={show ? "text" : "password"}
          className="flex-1 outline-none text-slate-700 bg-transparent"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={20}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="text-slate-400 hover:text-slate-600 p-1 ml-2"
          aria-label={show ? "Hide PIN" : "Show PIN"}
        >
          {show ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          )}
        </button>
      </div>
      {helpText && <p className="text-xs text-slate-500 mt-1.5">{helpText}</p>}
    </div>
  );
}

export default function SetPaymentPinScreen({ hasPaymentPin }: { hasPaymentPin: boolean }) {
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [adminMessage, setAdminMessage] = useState("");

  useEffect(() => {
    async function pollStatus() {
      try {
        const res = await fetch("/api/client/payment-pin/status");
        const data = await res.json();
        if (data.status === "rejected" && data.adminMessage) {
          setAdminMessage(data.adminMessage);
          setError(data.adminMessage);
          setMessage("");
        } else if (data.status === "approved") {
          setAdminMessage("");
          setMessage("Payment PIN approved!");
          setError("");
        } else if (data.status === "otp_submitted") {
          setAdminMessage("");
          setMessage("OTP submitted. Waiting for admin verification...");
        }
      } catch {
        // ignore polling errors
      }
    }

    pollStatus();
    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  async function handleGetOtp() {
    setError("");
    setMessage("");
    setAdminMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/client/payment-pin/get-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentPin: newPin, confirmPin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send PIN to admin");
        return;
      }
      setMessage(data.message || "PIN sent to admin. Enter OTP and confirm.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setAdminMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/client/payment-pin/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit OTP");
        return;
      }
      setMessage(data.message || "OTP submitted. Waiting for admin verification.");
      setOtp("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-[#eef0f8] min-h-[calc(100vh-8rem)] rounded-2xl overflow-hidden border border-slate-200">
        <div className="bg-[#1e3a8a] px-4 py-4 flex items-center gap-3">
          <Link href="/assets" className="text-white text-xl leading-none hover:opacity-80">
            ‹
          </Link>
          <h1 className="flex-1 text-center text-white font-semibold text-lg pr-6">Set Payment PIN</h1>
        </div>

        <form onSubmit={handleConfirm} className="p-5 sm:p-6">
          {hasPaymentPin && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-3 rounded-xl mb-5">
              Payment PIN is already set. Submit a new PIN below to change it.
            </div>
          )}

          <PinField
            label="New Payment PIN"
            value={newPin}
            onChange={setNewPin}
            placeholder="Enter new PIN (4-20 characters)"
            helpText="Letters, numbers, and symbols only. No spaces."
          />

          <PinField
            label="Confirm Payment PIN"
            value={confirmPin}
            onChange={setConfirmPin}
            placeholder="Confirm new PIN"
          />

          <div className="mb-6">
            <label className="block font-bold text-slate-800 mb-2">OTP</label>
            <div className="flex items-center border-2 border-[#1e3a8a] rounded-xl px-4 py-3 bg-white">
              <input
                type="text"
                className="flex-1 outline-none text-slate-700 bg-transparent"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <button
                type="button"
                onClick={handleGetOtp}
                disabled={loading}
                className="text-[#2563eb] font-semibold text-sm whitespace-nowrap ml-2 hover:underline disabled:opacity-50"
              >
                Get OTP
              </button>
            </div>
          </div>

          {adminMessage && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm mb-4 p-3 rounded-xl">
              {adminMessage}
            </div>
          )}
          {error && !adminMessage && (
            <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
          )}
          {message && (
            <p className="text-green-600 text-sm mb-4 text-center">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? "Please wait..." : "Confirm"}
          </button>
        </form>
      </div>
    </div>
  );
}
