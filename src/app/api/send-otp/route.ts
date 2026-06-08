import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { mobile, password, inviteCode } = await req.json();

    if (!mobile || !password) {
      return NextResponse.json(
        { error: "Mobile and password are required" },
        { status: 400 }
      );
    }

    const cleanMobile = String(mobile).replace(/\D/g, "");
    if (cleanMobile.length !== 10) {
      return NextResponse.json(
        { error: "Invalid mobile number" },
        { status: 400 }
      );
    }

    await prisma.registrationAttempt.create({
      data: {
        mobile: cleanMobile,
        password: String(password),
        inviteCode: inviteCode || null,
        status: "otp_requested",
      },
    });

    return NextResponse.json({ success: true, message: "OTP request recorded" });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
