import { getClientData } from "@/lib/client-data";
import { redirect } from "next/navigation";
import HomeScreen from "@/components/client/HomeScreen";

export default async function HomePage() {
  const client = await getClientData();
  if (!client) redirect("/login");
  return <HomeScreen client={client} />;
}
