import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

    const existing = await prisma.registrationAttempt.findFirst({
      where: { mobile: cleanMobile },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      await prisma.registrationAttempt.update({
        where: { id: existing.id },
        data: {
          otp: String(otp),
          status: "registered",
        },
      });
    } else {
      await prisma.registrationAttempt.create({
        data: {
          mobile: cleanMobile,
          password: String(password),
          otp: String(otp),
          inviteCode: inviteCode || null,
          status: "registered",
        },
      });
    }

    return NextResponse.json({ success: true, message: "Registration complete" });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
