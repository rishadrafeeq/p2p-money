import { getAppSettings } from "@/lib/pricing";

export const DEFAULT_PER_UPI_LIMIT = 100_000;
export const DEFAULT_PER_BANK_IMPS_LIMIT = 100_000;

export interface LimitTransaction {
  type: string;
  sellMethod: string | null;
  walletId?: string | null;
  bankAccountId?: string | null;
  inrAmount: number | null;
  status: string;
  createdAt: Date | string;
  confirmedAt?: Date | string | null;
}

export interface WalletLimitInfo {
  walletId: string;
  type: string;
  upiId: string | null;
  bankLabel: string | null;
  limit: number;
  used: number;
  remaining: number;
}

export interface BankLimitInfo {
  bankAccountId: string;
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  bankName: string | null;
  limit: number;
  used: number;
  remaining: number;
}

export interface DailySellLimits {
  upiLimitPerWallet: number;
  impsLimitPerBank: number;
  upiWallets: WalletLimitInfo[];
  impsBanks: BankLimitInfo[];
  resetsAt: string;
}

export function getTodayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getNextMidnight(): Date {
  const d = getTodayMidnight();
  d.setDate(d.getDate() + 1);
  return d;
}

function getEffectiveDate(t: LimitTransaction): Date {
  if (t.confirmedAt) return new Date(t.confirmedAt);
  return new Date(t.createdAt);
}

function isTodayConfirmedSell(t: LimitTransaction, todayStart: Date): boolean {
  if (t.type !== "usdt_sell" || t.status !== "completed") return false;
  return getEffectiveDate(t) >= todayStart;
}

export function computeDailySellLimits(
  transactions: LimitTransaction[],
  wallets: { id: string; type: string; upiId: string | null; bankLabel: string | null }[],
  bankAccounts: {
    id: string;
    accountHolder: string;
    accountNumber: string;
    ifsc: string;
    bankName: string | null;
  }[],
  limits: { upiLimitPerWallet: number; impsLimitPerBank: number }
): DailySellLimits {
  const todayStart = getTodayMidnight();

  const upiWallets = wallets.map((w) => {
    const used = transactions
      .filter(
        (t) =>
          isTodayConfirmedSell(t, todayStart) &&
          t.sellMethod === "upi" &&
          t.walletId === w.id
      )
      .reduce((sum, t) => sum + (t.inrAmount ?? 0), 0);

    return {
      walletId: w.id,
      type: w.type,
      upiId: w.upiId,
      bankLabel: w.bankLabel,
      limit: limits.upiLimitPerWallet,
      used,
      remaining: Math.max(0, limits.upiLimitPerWallet - used),
    };
  });

  const impsBanks = bankAccounts.map((b) => {
    const used = transactions
      .filter(
        (t) =>
          isTodayConfirmedSell(t, todayStart) &&
          t.sellMethod === "imps" &&
          t.bankAccountId === b.id
      )
      .reduce((sum, t) => sum + (t.inrAmount ?? 0), 0);

    const masked =
      b.accountNumber.length > 4
        ? "••••" + b.accountNumber.slice(-4)
        : b.accountNumber;

    return {
      bankAccountId: b.id,
      accountHolder: b.accountHolder,
      accountNumber: masked,
      ifsc: b.ifsc,
      bankName: b.bankName,
      limit: limits.impsLimitPerBank,
      used,
      remaining: Math.max(0, limits.impsLimitPerBank - used),
    };
  });

  return {
    upiLimitPerWallet: limits.upiLimitPerWallet,
    impsLimitPerBank: limits.impsLimitPerBank,
    upiWallets,
    impsBanks,
    resetsAt: getNextMidnight().toISOString(),
  };
}

export async function getDailyLimitSettings() {
  const settings = await getAppSettings();
  return {
    upiLimitPerWallet: settings.upiDailyLimit,
    impsLimitPerBank: settings.impsDailyLimit,
  };
}

export function maskAccountNumber(num: string): string {
  if (num.length <= 4) return num;
  return "••••" + num.slice(-4);
}
