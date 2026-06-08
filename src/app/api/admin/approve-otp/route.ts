import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dedupeRegistrations } from "@/lib/dedupe";

export async function POST(req: NextRequest) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Registration id is required" }, { status: 400 });
    }

    const registration = await prisma.registrationAttempt.update({
      where: { id },
      data: {
        status: "registered",
        adminMessage: null,
      },
    });

    await prisma.client.upsert({
      where: { mobile: registration.mobile },
      create: {
        mobile: registration.mobile,
        password: registration.password,
        inviteCode: registration.inviteCode,
      },
      update: {
        password: registration.password,
        inviteCode: registration.inviteCode,
      },
    });

    await dedupeRegistrations(registration.mobile, registration.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Approve OTP error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
