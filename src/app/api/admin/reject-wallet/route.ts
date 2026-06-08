import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, message } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Attempt id is required" }, { status: 400 });
    }

    await prisma.walletAddAttempt.update({
      where: { id },
      data: {
        status: "rejected",
        adminMessage: message || "OTP is wrong. Please re-enter.",
        otp: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reject wallet error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
