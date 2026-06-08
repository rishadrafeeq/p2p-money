import { getClientSession } from "@/lib/client-auth";
import { computeDailySellLimits, getDailyLimitSettings } from "@/lib/daily-limits";
import { computeUsdtTotals } from "@/lib/dedupe";
import { expireStaleSellOrders } from "@/lib/expire-sell-orders";
import { computeTotalWithdrawn } from "@/lib/sell-order";
import { computeAvailableBalance, computeTotalWithdrawnFromOrders } from "@/lib/transaction-balance";
import { getSellRates } from "@/lib/pricing";
import { prisma } from "@/lib/db";
import type { ClientData } from "@/types/client";

export type { ClientData };

export async function getClientData() {
  const client = await getClientSession();
  if (!client) return null;

  await expireStaleSellOrders(client.id);

  const [wallets, sellRates, limitSettings, pendingAttempt] = await Promise.all([
    prisma.wallet.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: "desc" },
    }),
    getSellRates(),
    getDailyLimitSettings(),
    prisma.walletAddAttempt.findFirst({
      where: {
        clientId: client.id,
        status: { in: ["address_submitted", "otp_submitted", "rejected"] },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const { usdtSent, usdtReceived, balance } = computeUsdtTotals(client.transactions);
  const avgRate = (sellRates.upiSellRate + sellRates.impsSellRate) / 2;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEarning = client.transactions
    .filter(
      (t) =>
        t.status === "completed" &&
        new Date(t.createdAt) >= todayStart &&
        (t.type === "usdt_received" || t.type === "payment" || t.type === "usdt_sell")
    )
    .reduce((sum, t) => sum + (t.inrAmount ?? (t.usdtAmount ?? 0) * avgRate), 0);

  const quotaInr = balance * avgRate;
  const accountInrBalance = client.inrBalance ?? 0;
  const availableBalance = computeAvailableBalance(accountInrBalance, client.transactions);
  const totalWithdrawn = Math.max(
    computeTotalWithdrawn(client.transactions),
    computeTotalWithdrawnFromOrders(client.transactions)
  );
  const estValue = availableBalance + quotaInr;
  const dailySellLimits = computeDailySellLimits(
    client.transactions.map((t) => ({
      type: t.type,
      sellMethod: t.sellMethod,
      walletId: t.walletId,
      bankAccountId: t.bankAccountId,
      inrAmount: t.inrAmount,
      status: t.status,
      createdAt: t.createdAt,
      confirmedAt: t.confirmedAt,
    })),
    wallets.map((w) => ({
      id: w.id,
      type: w.type,
      upiId: w.upiId,
      bankLabel: w.bankLabel,
    })),
    client.bankAccounts.map((b) => ({
      id: b.id,
      accountHolder: b.accountHolder,
      accountNumber: b.accountNumber,
      ifsc: b.ifsc,
      bankName: b.bankName,
    })),
    limitSettings
  );

  return {
    id: client.id,
    mobile: client.mobile,
    inviteCode: client.inviteCode,
    usdtBalance: balance,
    inrBalance: availableBalance,
    accountInrBalance,
    availableBalance,
    totalWithdrawn,
    estValue,
    usdtSent,
    usdtReceived,
    quotaInr,
    todayEarning,
    sellRates,
    dailySellLimits,
    hasPaymentPin: Boolean(client.paymentPin),
    createdAt: client.createdAt.toISOString(),
    paymentDetails: client.paymentDetails,
    bankAccounts: client.bankAccounts.map((b) => ({
      id: b.id,
      accountHolder: b.accountHolder,
      accountNumber: b.accountNumber,
      ifsc: b.ifsc,
      bankName: b.bankName,
      createdAt: b.createdAt.toISOString(),
    })),
    transactions: client.transactions.map((t) => ({
      id: t.id,
      type: t.type,
      sellMethod: t.sellMethod,
      walletId: t.walletId,
      bankAccountId: t.bankAccountId,
      usdtAmount: t.usdtAmount,
      inrAmount: t.inrAmount,
      withdrawnAmount: t.withdrawnAmount,
      balanceAmount: t.balanceAmount,
      screenshot: t.screenshot,
      note: t.note,
      status: t.status,
      depositNetwork: t.depositNetwork,
      depositAddressText: t.depositAddressText,
      depositQr: t.depositQr,
      orderApprovedAt: t.orderApprovedAt?.toISOString() ?? null,
      paymentExpiresAt: t.paymentExpiresAt?.toISOString() ?? null,
      paymentSubmittedAt: t.paymentSubmittedAt?.toISOString() ?? null,
      confirmedAt: t.confirmedAt?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
    })),
    wallets: wallets.map((w) => ({
      id: w.id,
      type: w.type,
      upiId: w.upiId,
      bankLabel: w.bankLabel,
      status: w.status,
      canDeposit: w.canDeposit,
      canWithdraw: w.canWithdraw,
      createdAt: w.createdAt.toISOString(),
    })),
    pendingWalletAdd: pendingAttempt
      ? {
          id: pendingAttempt.id,
          type: pendingAttempt.type,
          upiId: pendingAttempt.upiId,
          status: pendingAttempt.status,
          adminMessage: pendingAttempt.adminMessage,
        }
      : null,
  };
}
