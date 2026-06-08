import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PAYMENT_WINDOW_MINUTES } from "@/lib/constants";
import { saveUpload } from "@/lib/upload";

export async function POST(req: NextRequest) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const transactionId = String(formData.get("transactionId") || "").trim();
    const depositAddressId = String(formData.get("depositAddressId") || "").trim() || null;
    const network = String(formData.get("network") || "").trim();
    const address = String(formData.get("address") || "").trim();
    const qrFile = formData.get("qrImage") as File | null;

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction id is required" }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!transaction || transaction.type !== "usdt_sell") {
      return NextResponse.json({ error: "Sell order not found" }, { status: 404 });
    }

    if (transaction.status !== "pending") {
      return NextResponse.json({ error: "Order is not awaiting approval" }, { status: 400 });
    }

    let depositNetwork = network;
    let depositAddressText = address;
    let depositQr: string | null = null;
    let linkedAddressId: string | null = depositAddressId;

    if (depositAddressId) {
      const saved = await prisma.depositAddress.findUnique({ where: { id: depositAddressId } });
      if (!saved || !saved.isActive) {
        return NextResponse.json({ error: "Selected deposit address not found" }, { status: 400 });
      }
      depositNetwork = saved.network;
      depositAddressText = saved.address;
      depositQr = saved.qrImage;
    } else {
      if (!depositNetwork || !depositAddressText) {
        return NextResponse.json(
          { error: "Select a saved address or enter network and address" },
          { status: 400 }
        );
      }
      linkedAddressId = null;
      if (qrFile && qrFile.size > 0) {
        depositQr = await saveUpload(qrFile, "sell-qr");
      }
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + PAYMENT_WINDOW_MINUTES * 60 * 1000);

    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: "awaiting_payment",
        depositAddressId: linkedAddressId,
        depositNetwork,
        depositAddressText,
        depositQr,
        orderApprovedAt: now,
        paymentExpiresAt: expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Order approved. Customer has ${PAYMENT_WINDOW_MINUTES} minutes to send USDT.`,
    });
  } catch (error) {
    console.error("Approve sell order error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
