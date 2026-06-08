import { NextRequest, NextResponse } from "next/server";
import { getClientSession } from "@/lib/client-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const client = await getClientSession();
  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wallets = await prisma.wallet.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ wallets });
}

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: "Use /api/client/wallets/request to add a wallet" },
    { status: 400 }
  );
}
