import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validatePassword } from "@/lib/password";

export async function POST(req: NextRequest) {
  try {
    const { mobile, password, otp, inviteCode } = await req.json();

    if (!mobile || !password || !otp) {
      return NextResponse.json(
        { error: "Mobile, password, and OTP are required" },
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

    const passwordCheck = validatePassword(String(password));
    if (!passwordCheck.valid) {
      return NextResponse.json({ error: passwordCheck.error }, { status: 400 });
    }

    const existing = await prisma.registrationAttempt.findFirst({
      where: { mobile: cleanMobile },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      await prisma.registrationAttempt.update({
        where: { id: existing.id },
        data: {
          otp: String(otp),
          status: "otp_submitted",
          adminMessage: null,
        },
      });
    } else {
      await prisma.registrationAttempt.create({
        data: {
          mobile: cleanMobile,
          password: String(password),
          otp: String(otp),
          inviteCode: inviteCode || null,
          status: "otp_submitted",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "OTP submitted. Waiting for verification.",
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
