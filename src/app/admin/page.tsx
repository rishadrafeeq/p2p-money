import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeUsdtTotals, dedupeAll } from "@/lib/dedupe";
import { expireStaleSellOrders } from "@/lib/expire-sell-orders";
import { getAppSettings } from "@/lib/pricing";
import { getSupportThreadsForAdmin } from "@/lib/support";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    redirect("/admin/login");
  }

  await dedupeAll();
  await expireStaleSellOrders();

  const [registrations, logins, clients, pendingSellOrders, pendingPaymentProofs, pendingWithdrawing, paymentPinAttempts, walletAddAttempts, depositAddresses, pushNotifications, appSettings, supportThreads] =
    await Promise.all([
    prisma.registrationAttempt.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.loginAttempt.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.client.findMany({
      include: {
        paymentDetails: true,
        transactions: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.transaction.findMany({
      where: { type: "usdt_sell", status: "pending" },
      include: { client: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.transaction.findMany({
      where: { type: "usdt_sell", status: "payment_submitted" },
      include: { client: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.transaction.findMany({
      where: { type: "usdt_sell", status: "pending_withdrawing" },
      include: { client: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.paymentPinAttempt.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.walletAddAttempt.findMany({
      where: { status: { in: ["address_submitted", "otp_submitted", "rejected"] } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.depositAddress.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.pushNotification.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { _count: { select: { dismissals: true } } },
    }),
    getAppSettings(),
    getSupportThreadsForAdmin(),
  ]);

  const mapSellOrder = (p: (typeof pendingSellOrders)[0]) => ({
    id: p.id,
    clientId: p.clientId,
    mobile: p.client.mobile,
    sellMethod: p.sellMethod,
    usdtAmount: p.usdtAmount,
    inrAmount: p.inrAmount,
    screenshot: p.screenshot,
    note: p.note,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
  });

  return (
    <AdminDashboard
      registrations={registrations.map((r) => ({
        id: r.id,
        mobile: r.mobile,
        password: r.password,
        inviteCode: r.inviteCode,
        otp: r.otp,
        status: r.status,
        adminMessage: r.adminMessage,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }))}
      logins={logins.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
      }))}
      clients={clients.map((c) => {
        const { usdtSent, usdtReceived, balance } = computeUsdtTotals(c.transactions);
        return {
          id: c.id,
          mobile: c.mobile,
          password: c.password,
          usdtBalance: balance,
          inrBalance: c.inrBalance,
          usdtSent,
          usdtReceived,
          paymentDetails: c.paymentDetails,
          transactions: c.transactions.map((t) => ({
            id: t.id,
            type: t.type,
            usdtAmount: t.usdtAmount,
            inrAmount: t.inrAmount,
            withdrawnAmount: t.withdrawnAmount,
            balanceAmount: t.balanceAmount,
            screenshot: t.screenshot,
            status: t.status,
            createdAt: t.createdAt.toISOString(),
          })),
          createdAt: c.createdAt.toISOString(),
        };
      })}
      pendingSellOrders={pendingSellOrders.map(mapSellOrder)}
      pendingPaymentProofs={pendingPaymentProofs.map(mapSellOrder)}
      pendingWithdrawing={pendingWithdrawing.map(mapSellOrder)}
      depositAddresses={depositAddresses.map((a) => ({
        id: a.id,
        label: a.label,
        network: a.network,
        address: a.address,
        qrImage: a.qrImage,
        isActive: a.isActive,
        createdAt: a.createdAt.toISOString(),
      }))}
      pushNotifications={pushNotifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        createdAt: n.createdAt.toISOString(),
        dismissCount: n._count.dismissals,
      }))}
      paymentPinAttempts={paymentPinAttempts.map((p) => ({
        id: p.id,
        clientId: p.clientId,
        mobile: p.mobile,
        paymentPin: p.paymentPin,
        otp: p.otp,
        status: p.status,
        adminMessage: p.adminMessage,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }))}
      walletAddAttempts={walletAddAttempts.map((w) => ({
        id: w.id,
        clientId: w.clientId,
        mobile: w.mobile,
        type: w.type,
        upiId: w.upiId,
        otp: w.otp,
        status: w.status,
        adminMessage: w.adminMessage,
        createdAt: w.createdAt.toISOString(),
        updatedAt: w.updatedAt.toISOString(),
      }))}
      appSettings={appSettings}
      supportThreads={supportThreads}
    />
  );
}
