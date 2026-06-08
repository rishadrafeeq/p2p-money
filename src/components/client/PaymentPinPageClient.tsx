"use client";

import SetPaymentPinScreen from "@/components/client/SetPaymentPinScreen";

export default function PaymentPinPageClient({ hasPaymentPin }: { hasPaymentPin: boolean }) {
  return <SetPaymentPinScreen hasPaymentPin={hasPaymentPin} />;
}
