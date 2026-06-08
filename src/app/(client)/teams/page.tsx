import { getClientData } from "@/lib/client-data";
import { redirect } from "next/navigation";
import TeamsScreen from "@/components/client/TeamsScreen";

export default async function TeamsPage() {
  const client = await getClientData();
  if (!client) redirect("/login");
  return <TeamsScreen client={client} />;
}
