import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifications = await prisma.pushNotification.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { _count: { select: { dismissals: true } } },
    });

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        createdAt: n.createdAt.toISOString(),
        dismissCount: n._count.dismissals,
      })),
    });
  } catch (error) {
    console.error("Get push notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, message } = await req.json();
    const cleanTitle = String(title || "").trim();
    const cleanMessage = String(message || "").trim();

    if (!cleanTitle || !cleanMessage) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    const notification = await prisma.pushNotification.create({
      data: { title: cleanTitle, message: cleanMessage },
    });

    const clientCount = await prisma.client.count();

    return NextResponse.json({
      success: true,
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        createdAt: notification.createdAt.toISOString(),
      },
      clientCount,
      message: `Push notification sent to ${clientCount} client(s).`,
    });
  } catch (error) {
    console.error("Send push notification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
