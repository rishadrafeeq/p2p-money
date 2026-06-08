import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { serializeMessage } from "@/lib/support";
import { saveMediaUpload } from "@/lib/upload";

export async function GET(req: NextRequest) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const threadId = req.nextUrl.searchParams.get("threadId");
    if (!threadId) {
      return NextResponse.json({ error: "Thread id is required" }, { status: 400 });
    }

    const thread = await prisma.supportThread.findUnique({
      where: { id: threadId },
      include: { client: { select: { mobile: true } } },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const messages = await prisma.supportMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
    });

    await prisma.supportMessage.updateMany({
      where: { threadId, senderRole: "client", readByAdmin: false },
      data: { readByAdmin: true },
    });

    return NextResponse.json({
      thread: {
        id: thread.id,
        clientId: thread.clientId,
        mobile: thread.client.mobile,
        status: thread.status,
      },
      messages: messages.map(serializeMessage),
    });
  } catch (error) {
    console.error("Get admin support messages error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const threadId = String(formData.get("threadId") || "").trim();
    const body = String(formData.get("body") || "").trim();
    const file = formData.get("attachment") as File | null;

    if (!threadId) {
      return NextResponse.json({ error: "Thread id is required" }, { status: 400 });
    }

    if (!body && (!file || file.size === 0)) {
      return NextResponse.json({ error: "Message or attachment is required" }, { status: 400 });
    }

    const thread = await prisma.supportThread.findUnique({ where: { id: threadId } });
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    let attachmentUrl: string | null = null;
    let attachmentType: string | null = null;

    if (file && file.size > 0) {
      try {
        const saved = await saveMediaUpload(file, `support-admin-${thread.clientId}`);
        attachmentUrl = saved.url;
        attachmentType = saved.type;
      } catch (err) {
        return NextResponse.json(
          { error: err instanceof Error ? err.message : "Invalid attachment" },
          { status: 400 }
        );
      }
    }

    const message = await prisma.supportMessage.create({
      data: {
        threadId,
        senderRole: "admin",
        body: body || null,
        attachmentUrl,
        attachmentType,
        readByAdmin: true,
        readByClient: false,
      },
    });

    await prisma.supportThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: serializeMessage(message) });
  } catch (error) {
    console.error("Send admin support message error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
