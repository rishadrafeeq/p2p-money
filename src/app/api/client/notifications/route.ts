import { NextResponse } from "next/server";
import { getClientSession } from "@/lib/client-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const client = await getClientSession();
    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dismissed = await prisma.notificationDismissal.findMany({
      where: { clientId: client.id },
      select: { notificationId: true },
    });
    const dismissedIds = dismissed.map((d) => d.notificationId);

    const notifications = await prisma.pushNotification.findMany({
      where: { id: { notIn: dismissedIds } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        createdAt: n.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Client notifications GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
