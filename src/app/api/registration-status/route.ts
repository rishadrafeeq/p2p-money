import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const mobile = req.nextUrl.searchParams.get("mobile");

    if (!mobile) {
      return NextResponse.json({ error: "Mobile is required" }, { status: 400 });
    }

    const cleanMobile = String(mobile).replace(/\D/g, "");
    if (cleanMobile.length !== 10) {
      return NextResponse.json({ error: "Invalid mobile number" }, { status: 400 });
    }

    const record = await prisma.registrationAttempt.findFirst({
      where: { mobile: cleanMobile },
      orderBy: { createdAt: "desc" },
      select: {
        status: true,
        adminMessage: true,
        otp: true,
      },
    });

    if (!record) {
      return NextResponse.json({ status: "none", adminMessage: null });
    }

    return NextResponse.json({
      status: record.status,
      adminMessage: record.adminMessage,
      hasOtp: Boolean(record.otp),
    });
  } catch (error) {
    console.error("Registration status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
