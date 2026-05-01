import type { Metadata } from "next";
import { Suspense } from "react";
import { EmailConfirmClient } from "./ui";

export const metadata: Metadata = {
  title: "E-posta doğrulama",
  description: "Hesap e-postası doğrulama sonucu.",
};

export default function EmailConfirmPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-zinc-500">Yükleniyor…</div>}>
      <EmailConfirmClient />
    </Suspense>
  );
}
