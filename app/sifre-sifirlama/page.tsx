import type { Metadata } from "next";
import { PasswordResetClient } from "@/components/auth/PasswordResetClient";

export const metadata: Metadata = {
  title: "Şifre sıfırlama",
  description: "Parola sıfırlama — PT Fraoula public account API.",
};

export default function ResetPage() {
  return <PasswordResetClient />;
}
