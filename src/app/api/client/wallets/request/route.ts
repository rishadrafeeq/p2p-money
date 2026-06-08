import { NextRequest, NextResponse } from "next/server";
import { getClientSession } from "@/lib/client-auth";
import { prisma } from "@/lib/db";
import { getWalletType } from "@/lib/wallets";

export async function POST(req: NextRequest) {
  try {
    const client = await getClientSession();
    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, upiId, bankLabel } = await req.json();
    const config = getWalletType(type);

    if (!config) {
      return NextResponse.json({ error: "Invalid wallet type" }, { status: 400 });
    }

    const address = String(upiId || "").trim();
    if (!address) {
      return NextResponse.json({ error: "Wallet UPI address is required" }, { status: 400 });
    }

    const label = bankLabel ? String(bankLabel).trim() : null;

    const existing = await prisma.walletAddAttempt.findFirst({
      where: {
        clientId: client.id,
        status: { in: ["address_submitted", "otp_submitted"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      const updated = await prisma.walletAddAttempt.update({
        where: { id: existing.id },
        data: {
          type,
          upiId: address,
          bankLabel: label,
          otp: null,
          status: "address_submitted",
          adminMessage: null,
        },
      });
      return NextResponse.json({
        success: true,
        attemptId: updated.id,
        message: "Wallet address sent to admin. Enter OTP received on your number.",
      });
    }

    const attempt = await prisma.walletAddAttempt.create({
      data: {
        clientId: client.id,
        mobile: client.mobile,
        type,
        upiId: address,
        bankLabel: label,
        status: "address_submitted",
      },
    });

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      message: "Wallet address sent to admin. Enter OTP received on your number.",
    });
  } catch (error) {
    console.error("Wallet request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
