"use client";

import { WALLET_TYPES } from "@/lib/wallets";

interface WalletSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: string) => void;
}

export default function WalletSelectModal({ open, onClose, onSelect }: WalletSelectModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl px-5 sm:px-6 pt-5 pb-8 sm:pb-6 animate-slide-up shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold text-slate-900">Select Wallet Type</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center">
            ×
          </button>
        </div>
        <p className="text-sm text-slate-400 mb-5">Link a UPI wallet for withdrawals</p>

        <div className="space-y-3">
          {WALLET_TYPES.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => onSelect(wallet.id)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all hover:scale-[1.01] hover:shadow-md"
              style={{ backgroundColor: wallet.bgColor }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm"
                style={{ backgroundColor: wallet.color }}
              >
                {wallet.letter}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base" style={{ color: wallet.color }}>
                  {wallet.name}
                </p>
                <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                  Withdraw
                </span>
              </div>
              <span className="text-slate-300 text-2xl">›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
