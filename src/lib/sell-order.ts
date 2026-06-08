import { PAYMENT_WINDOW_MINUTES } from "@/lib/constants";

export { PAYMENT_WINDOW_MINUTES };

export type SellOrderStatus =
  | "pending"
  | "awaiting_payment"
  | "payment_submitted"
  | "pending_withdrawing"
  | "completed"
  | "expired"
  | "rejected"
  | "failed";

export const TERMINAL_SELL_STATUSES = ["completed", "rejected", "expired", "failed"] as const;

export const ALL_SELL_STATUSES: SellOrderStatus[] = [
  "pending",
  "awaiting_payment",
  "payment_submitted",
  "pending_withdrawing",
  "completed",
  "expired",
  "rejected",
  "failed",
];

export function isBlockingSellOrder(status: string) {
  return !TERMINAL_SELL_STATUSES.includes(status as (typeof TERMINAL_SELL_STATUSES)[number]);
}

export function isActiveSellStatus(status: string) {
  return isBlockingSellOrder(status);
}

export function isDepositWindowOpen(
  status: string,
  paymentExpiresAt: Date | string | null | undefined
) {
  if (status !== "awaiting_payment" || !paymentExpiresAt) return false;
  return new Date(paymentExpiresAt).getTime() > Date.now();
}

export function getPaymentSecondsLeft(paymentExpiresAt: Date | string | null | undefined) {
  if (!paymentExpiresAt) return 0;
  return Math.max(0, Math.floor((new Date(paymentExpiresAt).getTime() - Date.now()) / 1000));
}

export function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function getPayoutMessage(sellMethod: string | null | undefined) {
  if (sellMethod === "imps") {
    return "IMPS transfer is instant — your INR payout will reflect in your bank account shortly.";
  }
  return "Your INR payout via UPI will start processing within 10 minutes.";
}

export function getApprovalLabel(status: string): "Pending" | "Success" | "Failed" {
  if (status === "pending_withdrawing" || status === "completed") return "Success";
  if (status === "rejected" || status === "expired" || status === "failed") return "Failed";
  return "Pending";
}

export function getWithdrawLabel(status: string): string {
  if (status === "pending_withdrawing") return "Pending Withdrawing";
  if (status === "completed") return "Completed";
  if (status === "rejected" || status === "failed") return "Failed";
  if (status === "expired") return "Expired";
  return "—";
}

export function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Awaiting admin approval",
    awaiting_payment: "Send USDT now",
    payment_submitted: "Payment proof under review",
    pending_withdrawing: "Pending withdrawing",
    completed: "Completed",
    expired: "Payment window expired",
    rejected: "Rejected",
    failed: "Failed",
  };
  return labels[status] || status.replace(/_/g, " ");
}

export function computeTotalWithdrawn(
  transactions: { type: string; status: string; inrAmount: number | null }[]
) {
  return transactions
    .filter((t) => t.type === "usdt_sell" && t.status === "completed")
    .reduce((sum, t) => sum + (t.inrAmount ?? 0), 0);
}
