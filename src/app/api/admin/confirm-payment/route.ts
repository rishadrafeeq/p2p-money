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

    const { transactionId, status } = await req.json();

    if (!transactionId || !status) {
      return NextResponse.json(
        { error: "Transaction id and status are required" },
        { status: 400 }
      );
    }

    if (!["pending_withdrawing", "completed", "rejected", "failed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const existing = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!existing) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (
      existing.type === "usdt_sell" &&
      status === "pending_withdrawing" &&
      existing.status !== "payment_submitted"
    ) {
      return NextResponse.json(
        { error: "Sell order must have payment proof submitted before approval" },
        { status: 400 }
      );
    }

    if (
      existing.type === "usdt_sell" &&
      status === "completed" &&
      existing.status !== "pending_withdrawing"
    ) {
      return NextResponse.json(
        { error: "Order must be pending withdrawing before marking completed" },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status,
        confirmedAt: status === "completed" ? new Date() : existing.confirmedAt,
      },
    });

    const transactions = await prisma.transaction.findMany({
      where: { clientId: transaction.clientId },
    });
    const { balance } = computeUsdtTotals(transactions);

    await prisma.client.update({
      where: { id: transaction.clientId },
      data: { usdtBalance: balance },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Confirm payment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
