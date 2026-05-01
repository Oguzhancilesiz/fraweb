import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { routes } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kayıt",
  description: "Öğrenci kaydı — PT Fraoula API.",
};

export default function RegisterPage() {
  return (
    <AuthShell
      sideEyebrow="Öğrenci"
      sideTitle="Hesabını oluştur."
      sideText="Kayıt sonrası e-posta doğrulaması zorunludur; ardından giriş yapabilirsin."
    >
      <h2 className="pf-auth-page-title font-display text-2xl font-bold text-white">Öğrenci kaydı</h2>
      <p className="pf-auth-page-lead mt-1 text-sm text-zinc-400">
        Zaten üye misin?{" "}
        <Link href={routes.login} className="font-bold text-pf-orange-bright">
          Giriş yap
        </Link>
        .
      </p>
      <RegisterForm />
    </AuthShell>
  );
}
