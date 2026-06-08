import { redirect, notFound } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeUsdtTotals } from "@/lib/dedupe";
import ClientAdminView from "@/components/ClientAdminView";

export default async function AdminClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    redirect("/admin/login");
  }

  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      paymentDetails: true,
      transactions: { orderBy: { createdAt: "desc" } },
      wallets: { orderBy: { createdAt: "desc" } },
      walletAddAttempts: {
        where: { status: { in: ["address_submitted", "otp_submitted", "rejected"] } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!client) {
    notFound();
  }

  const { usdtSent, usdtReceived, balance } = computeUsdtTotals(client.transactions);

  return (
    <ClientAdminView
      client={{
        id: client.id,
        mobile: client.mobile,
        password: client.password,
        inviteCode: client.inviteCode,
        inrBalance: client.inrBalance,
        usdtBalance: balance,
        usdtSent,
        usdtReceived,
        paymentDetails: client.paymentDetails,
        wallets: client.wallets.map((w) => ({
          id: w.id,
          type: w.type,
          upiId: w.upiId,
          status: w.status,
          createdAt: w.createdAt.toISOString(),
        })),
        walletAddAttempts: client.walletAddAttempts.map((a) => ({
          id: a.id,
          type: a.type,
          upiId: a.upiId,
          otp: a.otp,
          status: a.status,
          adminMessage: a.adminMessage,
          updatedAt: a.updatedAt.toISOString(),
        })),
        transactions: client.transactions.map((t) => ({
          id: t.id,
          type: t.type,
          sellMethod: t.sellMethod,
          usdtAmount: t.usdtAmount,
          inrAmount: t.inrAmount,
          withdrawnAmount: t.withdrawnAmount,
          balanceAmount: t.balanceAmount,
          screenshot: t.screenshot,
          note: t.note,
          status: t.status,
          createdAt: t.createdAt.toISOString(),
        })),
        createdAt: client.createdAt.toISOString(),
      }}
    />
  );
}
