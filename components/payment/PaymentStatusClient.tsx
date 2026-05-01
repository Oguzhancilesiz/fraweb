"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getPublicApiBaseUrl } from "@/lib/api/config";
import { PageHeader } from "@/components/PageHeader";
import { routes } from "@/lib/site";

type StatusPayload = {
  success?: boolean;
  data?: {
    referenceCode?: string;
    intentStatus?: string;
    packageAssigned?: boolean;
    expiresAtUtc?: string | null;
  } | null;
  message?: string | null;
};

function Inner() {
  const sp = useSearchParams();
  const reference = sp.get("reference");
  const [state, setState] = useState<"loading" | "ok" | "err">("loading");
  const [detail, setDetail] = useState<string>("");

  useEffect(() => {
    if (!reference?.trim()) {
      setState("err");
      setDetail("Ödeme referansı (reference) URL’de yok.");
      return;
    }
    const base = getPublicApiBaseUrl();
    const url = `${base}/api/v1/public/payments/status?reference=${encodeURIComponent(reference)}`;
    (async () => {
      try {
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        const j = (await res.json()) as StatusPayload | { state?: string };
        if (!res.ok) {
          setState("err");
          setDetail("Durum alınamadı.");
          return;
        }
        if ("state" in j && j.state === "pending") {
          setState("ok");
          setDetail("Referans bekleniyor veya henüz işlenmedi.");
          return;
        }
        const p = j as StatusPayload;
        const st = p.data?.intentStatus ?? "—";
        const pkg = p.data?.packageAssigned ? "Paket hesaba işlendi." : "Paket henüz işlenmedi veya beklemede.";
        setState("ok");
        setDetail(`Durum: ${st}. ${pkg}${p.message ? ` ${p.message}` : ""}`);
      } catch (e) {
        setState("err");
        setDetail(e instanceof Error ? e.message : "Ağ hatası");
      }
    })();
  }, [reference]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 text-center lg:px-6">
      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-pf-green/50 text-2xl text-pf-green-bright">
        ✓
      </div>
      <PageHeader eyebrow="Ödeme" title="Ödeme durumu" lead="Bilgi API’den okunur (public/payments/status)." />
      {state === "loading" ? <p className="text-sm text-zinc-500">Yükleniyor…</p> : null}
      {state !== "loading" ? (
        <p className={`text-sm ${state === "err" ? "text-red-300" : "text-zinc-300"}`}>{detail}</p>
      ) : null}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href={routes.login} className="rounded-full bg-pf-orange px-5 py-2 text-sm font-bold text-black">
          Giriş
        </Link>
        <Link href={routes.student} className="rounded-full border border-white/20 px-5 py-2 text-sm font-bold">
          Öğrenci alanı
        </Link>
        <Link href={routes.contact} className="rounded-full border border-white/20 px-5 py-2 text-sm font-bold">
          Destek
        </Link>
      </div>
    </div>
  );
}

export function PaymentStatusClient() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-zinc-500">Yükleniyor…</div>}>
      <Inner />
    </Suspense>
  );
}
