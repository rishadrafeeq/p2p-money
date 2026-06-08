import { getClientData } from "@/lib/client-data";
import { redirect } from "next/navigation";
import DepositScreen from "@/components/client/DepositScreen";

export default async function DepositPage() {
  const client = await getClientData();
  if (!client) redirect("/login");
  return <DepositScreen client={client} />;
}
