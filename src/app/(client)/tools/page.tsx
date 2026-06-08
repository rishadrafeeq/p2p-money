import { getClientData } from "@/lib/client-data";
import { redirect } from "next/navigation";
import ToolsScreen from "@/components/client/ToolsScreen";

export default async function ToolsPage() {
  const client = await getClientData();
  if (!client) redirect("/login");
  return <ToolsScreen client={client} />;
}
