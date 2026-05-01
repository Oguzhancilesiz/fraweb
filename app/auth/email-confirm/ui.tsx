"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getPublicApiBaseUrl } from "@/lib/api/config";
import { routes } from "@/lib/site";

export function EmailConfirmClient() {
  const sp = useSearchParams();
  const t = sp.get("t");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!t?.trim()) {
      setErr("Doğrulama parametresi eksik.");
      return;
    }
    const base = getPublicApiBaseUrl();
    const url = `${base}/api/v1/auth/confirm-email?t=${encodeURIComponent(t)}`;
    (async () => {
      try {
        const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
        const text = await res.text();
        let message = res.ok ? "E-posta doğrulandı." : "Doğrulama başarısız.";
        try {
          const j = JSON.parse(text) as { message?: string };
          if (typeof j.message === "string" && j.message.trim()) message = j.message.trim();
        } catch {
          /* ignore */
        }
        if (!res.ok) setErr(message);
        else setMsg(message);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Ağ hatası");
      }
    })();
  }, [t]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="font-display text-2xl font-bold text-white">E-posta doğrulama</h1>
      {msg ? <p className="mt-6 text-sm text-pf-green-bright">{msg}</p> : null}
      {err ? <p className="mt-6 text-sm text-red-300">{err}</p> : null}
      {!msg && !err ? <p className="mt-6 text-sm text-zinc-500">İşleniyor…</p> : null}
      <p className="mt-8 text-sm">
        <Link href={routes.login} className="font-bold text-pf-orange-bright">
          Giriş yap
        </Link>
      </p>
    </div>
  );
}
