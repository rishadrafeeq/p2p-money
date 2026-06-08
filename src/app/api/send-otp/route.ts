import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { dedupeRegistrations } from "@/lib/dedupe";
import { validatePassword } from "@/lib/password";

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

    const passwordCheck = validatePassword(String(password));
    if (!passwordCheck.valid) {
      return NextResponse.json({ error: passwordCheck.error }, { status: 400 });
    }

    const existing = await prisma.registrationAttempt.findFirst({
      where: { mobile: cleanMobile },
      orderBy: { createdAt: "desc" },
    });

    let recordId: string;

    if (existing) {
      const updated = await prisma.registrationAttempt.update({
        where: { id: existing.id },
        data: {
          password: String(password),
          inviteCode: inviteCode || null,
          status: "otp_requested",
          otp: null,
          adminMessage: null,
        },
      });
      recordId = updated.id;
    } else {
      const created = await prisma.registrationAttempt.create({
        data: {
          mobile: cleanMobile,
          password: String(password),
          inviteCode: inviteCode || null,
          status: "otp_requested",
        },
      });
      recordId = created.id;
    }

    await dedupeRegistrations(cleanMobile, recordId);

    return NextResponse.json({ success: true, message: "OTP request recorded" });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
