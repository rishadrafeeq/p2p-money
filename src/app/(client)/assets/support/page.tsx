import { getClientData } from "@/lib/client-data";
import { redirect } from "next/navigation";
import SupportScreen from "@/components/client/SupportScreen";

export default async function SupportPage() {
  const client = await getClientData();
  if (!client) redirect("/login");
  return <SupportScreen />;
}
