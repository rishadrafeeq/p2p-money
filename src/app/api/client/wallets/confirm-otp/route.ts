import { NextRequest, NextResponse } from "next/server";
import { getClientSession } from "@/lib/client-auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const client = await getClientSession();
    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { otp, attemptId } = await req.json();
    if (!otp || !String(otp).trim()) {
      return NextResponse.json({ error: "OTP is required" }, { status: 400 });
    }

    const attempt = attemptId
      ? await prisma.walletAddAttempt.findFirst({
          where: { id: attemptId, clientId: client.id },
        })
      : await prisma.walletAddAttempt.findFirst({
          where: {
            clientId: client.id,
            status: { in: ["address_submitted", "rejected"] },
          },
          orderBy: { createdAt: "desc" },
        });

    if (!attempt || attempt.status === "approved") {
      return NextResponse.json({ error: "Please add wallet address first" }, { status: 400 });
    }

    await prisma.walletAddAttempt.update({
      where: { id: attempt.id },
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
    console.error("Wallet confirm OTP error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
