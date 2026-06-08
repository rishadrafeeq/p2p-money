import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { walletId, upiId, status } = await req.json();
    if (!walletId) {
      return NextResponse.json({ error: "Wallet id is required" }, { status: 400 });
    }

    const data: { upiId?: string | null; status?: string; canWithdraw?: boolean } = {};
    if (upiId !== undefined) data.upiId = upiId || null;
    if (status !== undefined) {
      data.status = status;
      data.canWithdraw = status === "active";
    }

    await prisma.wallet.update({ where: { id: walletId }, data });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update wallet error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
