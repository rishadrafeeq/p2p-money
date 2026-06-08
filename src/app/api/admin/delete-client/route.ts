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
      return NextResponse.json({ error: "Client id is required" }, { status: 400 });
    }

    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    await prisma.client.delete({ where: { id } });

    await prisma.registrationAttempt.deleteMany({
      where: { mobile: client.mobile },
    });

    await prisma.loginAttempt.deleteMany({
      where: { mobile: client.mobile },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete client error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
