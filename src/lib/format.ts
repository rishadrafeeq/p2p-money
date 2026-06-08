export function maskMobile(mobile: string): string {
  if (mobile.length < 6) return mobile;
  return `${mobile.slice(0, 3)}****${mobile.slice(-3)}`;
}

export function formatInr(amount: number): string {
  return `₹ ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Stable SSR/client datetime — avoids hydration mismatch from default locale */
export function formatDateTime(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

export function shortId(id: string): string {
  const num = parseInt(id.replace(/\D/g, "").slice(-6) || "0", 10);
  return String(num || id.slice(-6));
}
