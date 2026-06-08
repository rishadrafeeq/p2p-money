import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Attempt id is required" }, { status: 400 });
    }

    const attempt = await prisma.paymentPinAttempt.update({
      where: { id },
      data: {
        status: "approved",
        adminMessage: null,
      },
    });

    await prisma.client.update({
      where: { id: attempt.clientId },
      data: { paymentPin: attempt.paymentPin },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Approve payment PIN error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
