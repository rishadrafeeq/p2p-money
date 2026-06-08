import { NextRequest, NextResponse } from "next/server";
import { getClientSession } from "@/lib/client-auth";
import { prisma } from "@/lib/db";
import { getOrCreateSupportThread, serializeMessage } from "@/lib/support";
import { saveMediaUpload } from "@/lib/upload";

export async function GET() {
  try {
    const client = await getClientSession();
    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const thread = await getOrCreateSupportThread(client.id);
    const messages = await prisma.supportMessage.findMany({
      where: { threadId: thread.id },
      orderBy: { createdAt: "asc" },
    });

    await prisma.supportMessage.updateMany({
      where: { threadId: thread.id, senderRole: "admin", readByClient: false },
      data: { readByClient: true },
    });

    const unreadCount = await prisma.supportMessage.count({
      where: { threadId: thread.id, senderRole: "admin", readByClient: false },
    });

    return NextResponse.json({
      threadId: thread.id,
      messages: messages.map(serializeMessage),
      unreadCount,
    });
  } catch (error) {
    console.error("Get client support messages error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const client = await getClientSession();
    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const body = String(formData.get("body") || "").trim();
    const file = formData.get("attachment") as File | null;

    if (!body && (!file || file.size === 0)) {
      return NextResponse.json({ error: "Message or attachment is required" }, { status: 400 });
    }

    const thread = await getOrCreateSupportThread(client.id);

    let attachmentUrl: string | null = null;
    let attachmentType: string | null = null;

    if (file && file.size > 0) {
      try {
        const saved = await saveMediaUpload(file, `support-${client.id}`);
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
        threadId: thread.id,
        senderRole: "client",
        body: body || null,
        attachmentUrl,
        attachmentType,
        readByClient: true,
        readByAdmin: false,
      },
    });

    await prisma.supportThread.update({
      where: { id: thread.id },
      data: { updatedAt: new Date(), status: "open" },
    });

    return NextResponse.json({ success: true, message: serializeMessage(message) });
  } catch (error) {
    console.error("Send client support message error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
