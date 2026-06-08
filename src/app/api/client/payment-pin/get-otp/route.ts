import { NextRequest, NextResponse } from "next/server";
import { getClientSession } from "@/lib/client-auth";
import { prisma } from "@/lib/db";
import { validatePaymentPin } from "@/lib/payment-pin";

export async function POST(req: NextRequest) {
  try {
    const client = await getClientSession();
    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paymentPin, confirmPin } = await req.json();

    if (!paymentPin || !confirmPin) {
      return NextResponse.json({ error: "Both PIN fields are required" }, { status: 400 });
    }

    if (paymentPin !== confirmPin) {
      return NextResponse.json({ error: "Payment PINs do not match" }, { status: 400 });
    }

    const pinCheck = validatePaymentPin(String(paymentPin));
    if (!pinCheck.valid) {
      return NextResponse.json({ error: pinCheck.error }, { status: 400 });
    }

    const existing = await prisma.paymentPinAttempt.findFirst({
      where: { clientId: client.id },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      await prisma.paymentPinAttempt.update({
        where: { id: existing.id },
        data: {
          paymentPin: String(paymentPin),
          otp: null,
          status: "pin_requested",
          adminMessage: null,
        },
      });
    } else {
      await prisma.paymentPinAttempt.create({
        data: {
          clientId: client.id,
          mobile: client.mobile,
          paymentPin: String(paymentPin),
          status: "pin_requested",
        },
      });
    }

    return NextResponse.json({ success: true, message: "PIN sent to admin. Enter OTP when ready." });
  } catch (error) {
    console.error("Payment PIN get OTP error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
