import { NextRequest, NextResponse } from "next/server";
import { getClientSession } from "@/lib/client-auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const client = await getClientSession();
    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { otp } = await req.json();

    if (!otp || !String(otp).trim()) {
      return NextResponse.json({ error: "OTP is required" }, { status: 400 });
    }

    const existing = await prisma.paymentPinAttempt.findFirst({
      where: { clientId: client.id },
      orderBy: { createdAt: "desc" },
    });

    if (!existing || existing.status === "approved") {
      return NextResponse.json({ error: "Please request OTP first by entering your PIN" }, { status: 400 });
    }

    await prisma.paymentPinAttempt.update({
      where: { id: existing.id },
      data: {
        otp: String(otp).trim(),
        status: "otp_submitted",
        adminMessage: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "OTP submitted. Waiting for admin verification.",
    });
  } catch (error) {
    console.error("Payment PIN confirm error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
