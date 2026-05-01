import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { routes } from "@/lib/site";

export const metadata: Metadata = {
  title: "Giriş",
  description: "PT Fraoula API ile öğrenci veya koç oturumu.",
};

export default function LoginPage() {
  return (
    <AuthShell
      sideEyebrow="PT Fraoula"
      sideTitle="Tekrar hoş geldin."
      sideText="Giriş bilgilerin API üzerinden doğrulanır; başarılı olunca JWT tarayıcıda saklanır (httpOnly değil — üretimde BFF/cookie tercih edebilirsin)."
    >
      <h2 className="pf-auth-page-title font-display text-2xl font-bold text-white">Giriş</h2>
      <p className="pf-auth-page-lead mt-1 text-sm text-zinc-400">
        Hesabın yoksa{" "}
        <Link href={routes.register} className="font-bold text-pf-orange-bright">
          kayıt ol
        </Link>
        .
      </p>
      <Suspense fallback={<p className="mt-6 text-sm text-zinc-500">Yükleniyor…</p>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
