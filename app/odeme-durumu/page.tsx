import type { Metadata } from "next";
import { PaymentStatusClient } from "@/components/payment/PaymentStatusClient";

export const metadata: Metadata = {
  title: "Ödeme durumu",
  description: "Shopier / simülasyon sonrası ödeme özeti — API.",
};

export default function PaymentStatusPage() {
  return <PaymentStatusClient />;
}
