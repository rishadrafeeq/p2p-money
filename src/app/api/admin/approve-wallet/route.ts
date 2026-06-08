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

    const attempt = await prisma.walletAddAttempt.findUnique({
      where: { id },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Wallet request not found" }, { status: 404 });
    }

    await prisma.wallet.create({
      data: {
        clientId: attempt.clientId,
        type: attempt.type,
        upiId: attempt.upiId,
        bankLabel: attempt.bankLabel,
        status: "active",
        canDeposit: false,
        canWithdraw: true,
      },
    });

    await prisma.walletAddAttempt.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Approve wallet error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
