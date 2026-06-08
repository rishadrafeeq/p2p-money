import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const CLIENT_COOKIE = "p2p_client_session";

export async function getClientSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get(CLIENT_COOKIE);
  if (!session?.value) return null;

  const client = await prisma.client.findUnique({
    where: { id: session.value },
    include: {
      paymentDetails: true,
      bankAccounts: { orderBy: { createdAt: "desc" } },
      transactions: { orderBy: { createdAt: "desc" } },
    },
  });

  return client;
}

export async function isClientAuthenticated(): Promise<boolean> {
  const client = await getClientSession();
  return Boolean(client);
}
