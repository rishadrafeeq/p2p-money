import { NextResponse } from "next/server";
import { getClientSession } from "@/lib/client-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const client = await getClientSession();
  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const attempt = await prisma.walletAddAttempt.findFirst({
    where: { clientId: client.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    attempt: attempt
      ? {
          id: attempt.id,
          type: attempt.type,
          upiId: attempt.upiId,
          status: attempt.status,
          adminMessage: attempt.adminMessage,
        }
      : null,
  });
}
