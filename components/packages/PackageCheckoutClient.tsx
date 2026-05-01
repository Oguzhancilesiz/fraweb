"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import { getPublicApiBaseUrl } from "@/lib/api/config";
import { routes } from "@/lib/site";

type CoachRow = { id: string; displayName: string };

type SimulatedResponse = { simulated: true; reference: string; pollPath: string };
type ShopierResponse = { paymentPageUrl: string; formFields: Record<string, string>; reference: string };
type StartCheckoutResponse = SimulatedResponse | ShopierResponse;

function isSimulated(r: StartCheckoutResponse): r is SimulatedResponse {
  return "simulated" in r && r.simulated === true;
}

function postToExternalPayment(action: string, fields: Record<string, string>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  for (const [k, v] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = k;
    input.value = v;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

async function pollUntilResolved(reference: string): Promise<boolean> {
  const base = getPublicApiBaseUrl();
  for (let i = 0; i < 40; i++) {
    const url = `${base}/api/v1/public/payments/poll?reference=${encodeURIComponent(reference)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      await new Promise((r) => setTimeout(r, 800));
      continue;
    }
    const j = (await res.json()) as { packageAssigned?: boolean };
    if (j.packageAssigned) return true;
    await new Promise((r) => setTimeout(r, 800));
  }
  return false;
}

type Props = {
  packageId: number;
  slug: string;
  packageName: string;
  isPurchasable: boolean;
  coaches: CoachRow[];
};

export function PackageCheckoutClient({
  packageId,
  slug,
  packageName,
  isPurchasable,
  coaches,
}: Props) {
  const router = useRouter();
  const { token, user, ready } = useAuth();
  const [coachId, setCoachId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const returnUrl = `/paketler/${slug}`;
  const isLoggedIn = !!token && !!user;

  if (!isPurchasable) return null;

  async function onCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      setErr("Satın alma için önce giriş yapmalısın.");
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      const body: Record<string, unknown> = { packageId, slug };
      if (coachId) body.selectedCoachUserId = coachId;
      const r = await apiFetch<StartCheckoutResponse>("/api/v1/public/packages/start-checkout", {
        method: "POST",
        body: JSON.stringify(body),
        accessToken: token ?? undefined,
      });
      if (!r.ok) {
        setErr(r.message);
        return;
      }
      if (isSimulated(r.data)) {
        const ok = await pollUntilResolved(r.data.reference);
        router.push(`${routes.payment}?reference=${encodeURIComponent(r.data.reference)}${ok ? "&sim=1" : ""}`);
        return;
      }
      if (r.data.paymentPageUrl && r.data.formFields) {
        postToExternalPayment(r.data.paymentPageUrl, r.data.formFields);
        return;
      }
      setErr("Ödeme yanıtı beklenmedik biçimde.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 rounded-2xl border border-pf-orange/30 bg-pf-void/60 p-5">
      <h2 className="font-display text-lg font-bold text-white">Satın al — {packageName}</h2>
      <p className="mt-1 text-xs text-zinc-500">Ödeme Shopier üzerinden ilerler.</p>

      {!ready ? (
        <p className="mt-2 text-sm text-zinc-500">Oturum bilgisi kontrol ediliyor…</p>
      ) : !isLoggedIn ? (
        <div className="mt-3 rounded-xl border border-white/10 bg-pf-card/40 p-4">
          <p className="text-sm text-zinc-300">
            Bu paket sadece giriş yapmış kullanıcı hesabına tanımlanır. Devam etmek için önce giriş yap veya kayıt ol.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`${routes.login}?returnUrl=${encodeURIComponent(returnUrl)}`}
              className="rounded-full bg-pf-orange px-4 py-2 text-xs font-bold text-black"
            >
              Giriş yap
            </Link>
            <Link
              href={`${routes.register}?returnUrl=${encodeURIComponent(returnUrl)}`}
              className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold text-zinc-200 hover:bg-white/5"
            >
              Kayıt ol
            </Link>
          </div>
        </div>
      ) : null}

      {isLoggedIn ? (
        <p className="mt-2 text-sm text-zinc-400">
          Oturum: <span className="font-semibold text-white">{user.email}</span> (hesabına tanımlanacak)
        </p>
      ) : null}

      <form className="mt-4 space-y-3" onSubmit={onCheckout}>
        {err ? <p className="text-sm text-red-300">{err}</p> : null}
        {isLoggedIn && coaches.length > 0 ? (
          <div>
            <label className="text-xs font-bold text-pf-mist" htmlFor="coach">
              Antrenör tercihi
            </label>
            <select
              id="coach"
              value={coachId}
              onChange={(ev) => setCoachId(ev.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-pf-void px-3 py-2 text-sm"
            >
              <option value="">Varsayılan / fark etmez</option>
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayName}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <button
          type="submit"
          disabled={busy || !isLoggedIn}
          className="w-full rounded-full bg-pf-green py-3 text-sm font-bold text-black disabled:opacity-60"
        >
          {!isLoggedIn ? "Önce giriş yap" : busy ? "Hazırlanıyor…" : "Ödemeye geç"}
        </button>
      </form>
    </div>
  );
}
