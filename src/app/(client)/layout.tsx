import { redirect } from "next/navigation";
import { getClientData } from "@/lib/client-data";
import ClientShell from "@/components/client/ClientShell";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const client = await getClientData();
  if (!client) {
    redirect("/login");
  }

  return (
    <ClientShell
      mobile={client.mobile}
      usdtBalance={client.usdtBalance}
      quotaInr={client.quotaInr}
    >
      {children}
    </ClientShell>
  );
}
