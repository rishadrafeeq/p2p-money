import { prisma } from "@/lib/db";

export async function expireStaleSellOrders(clientId?: string) {
  const now = new Date();
  await prisma.transaction.updateMany({
    where: {
      type: "usdt_sell",
      status: "awaiting_payment",
      paymentExpiresAt: { lt: now },
      ...(clientId ? { clientId } : {}),
    },
    data: { status: "expired" },
  });
}
