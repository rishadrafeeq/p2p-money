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

    const { clientId, type, usdtAmount, inrAmount, note, status } = await req.json();

    if (!clientId || !type) {
      return NextResponse.json(
        { error: "Client id and transaction type are required" },
        { status: 400 }
      );
    }

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    await prisma.transaction.create({
      data: {
        clientId,
        type,
        usdtAmount: usdtAmount ? Number(usdtAmount) : null,
        inrAmount: inrAmount ? Number(inrAmount) : null,
        note: note || null,
        status: status || "confirmed",
      },
    });

    const transactions = await prisma.transaction.findMany({
      where: { clientId },
    });
    const { balance } = computeUsdtTotals(transactions);

    await prisma.client.update({
      where: { id: clientId },
      data: { usdtBalance: balance },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Add transaction error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
