import { NextRequest, NextResponse } from "next/server";
import { getClientSession } from "@/lib/client-auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const client = await getClientSession();
    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notificationId } = await req.json();
    if (!notificationId) {
      return NextResponse.json({ error: "Notification id is required" }, { status: 400 });
    }

    await prisma.notificationDismissal.upsert({
      where: {
        clientId_notificationId: {
          clientId: client.id,
          notificationId,
        },
      },
      create: { clientId: client.id, notificationId },
      update: { dismissedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Dismiss notification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
