import { getClientSession } from "@/lib/client-auth";
import { redirect } from "next/navigation";
import PaymentPinPageClient from "@/components/client/PaymentPinPageClient";

export default async function PaymentPinPage() {
  const client = await getClientSession();
  if (!client) redirect("/login");

  return <PaymentPinPageClient hasPaymentPin={Boolean(client.paymentPin)} />;
}
