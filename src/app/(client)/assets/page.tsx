import { getClientData } from "@/lib/client-data";
import { redirect } from "next/navigation";
import AssetsScreen from "@/components/client/AssetsScreen";

export default async function AssetsPage() {
  const client = await getClientData();
  if (!client) redirect("/login");
  return <AssetsScreen client={client} />;
}
