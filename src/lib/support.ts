import { prisma } from "@/lib/db";

export type SupportSenderRole = "client" | "admin";

export interface SupportMessageData {
  id: string;
  senderRole: SupportSenderRole;
  body: string | null;
  attachmentUrl: string | null;
  attachmentType: string | null;
  readByAdmin: boolean;
  readByClient: boolean;
  createdAt: string;
}

export interface SupportThreadSummary {
  id: string;
  clientId: string;
  mobile: string;
  status: string;
  unreadCount: number;
  lastMessage: string | null;
  lastMessageAt: string | null;
  updatedAt: string;
}

export async function getOrCreateSupportThread(clientId: string) {
  let thread = await prisma.supportThread.findUnique({ where: { clientId } });
  if (!thread) {
    thread = await prisma.supportThread.create({ data: { clientId } });
  }
  return thread;
}

export function serializeMessage(message: {
  id: string;
  senderRole: string;
  body: string | null;
  attachmentUrl: string | null;
  attachmentType: string | null;
  readByAdmin: boolean;
  readByClient: boolean;
  createdAt: Date;
}): SupportMessageData {
  return {
    id: message.id,
    senderRole: message.senderRole as SupportSenderRole,
    body: message.body,
    attachmentUrl: message.attachmentUrl,
    attachmentType: message.attachmentType,
    readByAdmin: message.readByAdmin,
    readByClient: message.readByClient,
    createdAt: message.createdAt.toISOString(),
  };
}

export async function getSupportThreadsForAdmin(): Promise<SupportThreadSummary[]> {
  const threads = await prisma.supportThread.findMany({
    include: {
      client: { select: { mobile: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: {
          messages: {
            where: { senderRole: "client", readByAdmin: false },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return threads.map((thread) => {
    const last = thread.messages[0];
    let preview = last?.body || null;
    if (!preview && last?.attachmentType === "image") preview = "📷 Photo";
    if (!preview && last?.attachmentType === "video") preview = "🎥 Video";

    return {
      id: thread.id,
      clientId: thread.clientId,
      mobile: thread.client.mobile,
      status: thread.status,
      unreadCount: thread._count.messages,
      lastMessage: preview,
      lastMessageAt: last?.createdAt.toISOString() ?? null,
      updatedAt: thread.updatedAt.toISOString(),
    };
  });
}

export async function getAdminUnreadSupportCount(): Promise<number> {
  return prisma.supportMessage.count({
    where: { senderRole: "client", readByAdmin: false },
  });
}
