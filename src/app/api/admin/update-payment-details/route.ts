import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { clientId, accountHolder, accountNumber, ifsc, bankName } = await req.json();
    if (!clientId) {
      return NextResponse.json({ error: "Client id is required" }, { status: 400 });
    }

    await prisma.paymentDetail.upsert({
      where: { clientId },
      create: {
        clientId,
        accountHolder: accountHolder ?? null,
        accountNumber: accountNumber ?? null,
        ifsc: ifsc ?? null,
        bankName: bankName ?? null,
      },
      update: {
        accountHolder: accountHolder ?? null,
        accountNumber: accountNumber ?? null,
        ifsc: ifsc ?? null,
        bankName: bankName ?? null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update payment details error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
