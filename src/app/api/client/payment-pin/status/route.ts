import { NextResponse } from "next/server";
import { getClientSession } from "@/lib/client-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const client = await getClientSession();
  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const attempt = await prisma.paymentPinAttempt.findFirst({
    where: { clientId: client.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    hasPaymentPin: Boolean(client.paymentPin),
    status: attempt?.status || null,
    adminMessage: attempt?.adminMessage || null,
  });
}
