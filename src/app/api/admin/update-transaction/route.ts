import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeUsdtTotals } from "@/lib/dedupe";
import { ALL_SELL_STATUSES } from "@/lib/sell-order";

export async function POST(req: NextRequest) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transactionId, status, usdtAmount, inrAmount, withdrawnAmount, balanceAmount, sellMethod, note } =
      await req.json();
    if (!transactionId) {
      return NextResponse.json({ error: "Transaction id is required" }, { status: 400 });
    }

    const existing = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!existing) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const data: {
      status?: string;
      usdtAmount?: number | null;
      inrAmount?: number | null;
      withdrawnAmount?: number;
      balanceAmount?: number | null;
      sellMethod?: string | null;
      note?: string | null;
      confirmedAt?: Date | null;
    } = {};

    if (status !== undefined) {
      if (existing.type === "usdt_sell" && !ALL_SELL_STATUSES.includes(status)) {
        return NextResponse.json({ error: "Invalid sell order status" }, { status: 400 });
      }
      data.status = status;
      data.confirmedAt = status === "completed" ? new Date() : null;
    }
    if (usdtAmount !== undefined) data.usdtAmount = usdtAmount ? Number(usdtAmount) : null;
    if (inrAmount !== undefined) data.inrAmount = inrAmount ? Number(inrAmount) : null;
    if (withdrawnAmount !== undefined) data.withdrawnAmount = Number(withdrawnAmount) || 0;
    if (balanceAmount !== undefined) {
      data.balanceAmount =
        balanceAmount === "" || balanceAmount === null ? null : Number(balanceAmount);
    }
    if (sellMethod !== undefined) data.sellMethod = sellMethod || null;
    if (note !== undefined) data.note = note || null;

    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data,
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
    console.error("Update transaction error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
