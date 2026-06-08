import { NextRequest, NextResponse } from "next/server";
import { getClientSession } from "@/lib/client-auth";
import { prisma } from "@/lib/db";
import { isDepositWindowOpen } from "@/lib/sell-order";
import { saveUpload } from "@/lib/upload";

export async function POST(req: NextRequest) {
  try {
    const client = await getClientSession();
    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const transactionId = String(formData.get("transactionId") || "").trim();
    const file = formData.get("screenshot") as File | null;

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction id is required" }, { status: 400 });
    }

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Payment screenshot is required" }, { status: 400 });
    }

    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, clientId: client.id, type: "usdt_sell" },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Sell order not found" }, { status: 404 });
    }

    if (transaction.status !== "awaiting_payment") {
      return NextResponse.json({ error: "Order is not ready for payment proof" }, { status: 400 });
    }

    if (!isDepositWindowOpen(transaction.status, transaction.paymentExpiresAt)) {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: "expired" },
      });
      return NextResponse.json(
        { error: "Payment window has expired. Please submit a new sell order." },
        { status: 400 }
      );
    }

    const screenshotPath = await saveUpload(file, `${client.id}-payment`);

    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: "payment_submitted",
        screenshot: screenshotPath,
        paymentSubmittedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment proof submitted. Please wait while admin verifies your transfer.",
    });
  } catch (error) {
    console.error("Payment proof error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
