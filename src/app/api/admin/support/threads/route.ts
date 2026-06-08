import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSupportThreadsForAdmin } from "@/lib/support";

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const threads = await getSupportThreadsForAdmin();
    const totalUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0);

    return NextResponse.json({ threads, totalUnread });
  } catch (error) {
    console.error("Get admin support threads error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { clientId } = await req.json();
    if (!clientId) {
      return NextResponse.json({ error: "Client id is required" }, { status: 400 });
    }

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    let thread = await prisma.supportThread.findUnique({ where: { clientId } });
    if (!thread) {
      thread = await prisma.supportThread.create({ data: { clientId } });
    }

    return NextResponse.json({ success: true, threadId: thread.id });
  } catch (error) {
    console.error("Create admin support thread error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
