import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeUsdtTotals } from "@/lib/dedupe";

export async function POST(req: NextRequest) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transactionId } = await req.json();
    if (!transactionId) {
      return NextResponse.json({ error: "Transaction id is required" }, { status: 400 });
    }

    const existing = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!existing) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    await prisma.transaction.delete({ where: { id: transactionId } });

    const transactions = await prisma.transaction.findMany({
      where: { clientId: existing.clientId },
    });
    const { balance } = computeUsdtTotals(transactions);

    await prisma.client.update({
      where: { id: existing.clientId },
      data: { usdtBalance: balance },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete transaction error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
