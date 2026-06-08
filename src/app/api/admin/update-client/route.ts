import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { clientId, password, inviteCode, mobile, inrBalance } = await req.json();
    if (!clientId) {
      return NextResponse.json({ error: "Client id is required" }, { status: 400 });
    }

    const data: {
      password?: string;
      inviteCode?: string | null;
      mobile?: string;
      inrBalance?: number;
    } = {};
    if (password !== undefined) data.password = String(password);
    if (inviteCode !== undefined) data.inviteCode = inviteCode || null;
    if (inrBalance !== undefined) data.inrBalance = Number(inrBalance) || 0;
    if (mobile !== undefined) {
      const clean = String(mobile).replace(/\D/g, "");
      if (clean.length !== 10) {
        return NextResponse.json({ error: "Invalid mobile number" }, { status: 400 });
      }
      data.mobile = clean;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    await prisma.client.update({ where: { id: clientId }, data });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update client error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
