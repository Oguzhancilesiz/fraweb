"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { apiFetch } from "@/lib/api/client";
import { routes } from "@/lib/site";

function Inner() {
  const sp = useSearchParams();
  const userId = sp.get("userId");
  const token = sp.get("token");
  const resetMode = Boolean(userId && token);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function forgot(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      const r = await apiFetch<{ message?: string }>("/api/v1/public/account/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!r.ok) {
        setErr(r.message);
        return;
      }
      setMsg(r.data?.message ?? "İstek alındı.");
    } finally {
      setBusy(false);
    }
  }

  async function reset(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (!userId || !token) return;
    setBusy(true);
    try {
      const r = await apiFetch<{ message?: string }>("/api/v1/public/account/reset-password", {
        method: "POST",
        body: JSON.stringify({
          userId,
          token,
          password,
          confirmPassword: confirm,
        }),
      });
      if (!r.ok) {
        setErr(r.message);
        return;
      }
      setMsg(r.data?.message ?? "Parola güncellendi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      sideEyebrow="Güvenlik"
      sideTitle="Hesabını geri al"
      sideText={
        resetMode
          ? "Bağlantıdaki parametrelerle yeni parolanı belirle."
          : "E-posta adresine tek kullanımlık sıfırlama bağlantısı gönderilir. Bağlantının hedefi API yapılandırmasındaki PublicBaseUrl ile uyumlu olmalıdır."
      }
    >
      <h2 className="font-display text-2xl font-bold">{resetMode ? "Yeni parola" : "Parolamı unuttum"}</h2>
      <p className="mt-1 text-sm text-zinc-500">
        <Link href={routes.login} className="font-bold text-pf-orange-bright">
          Girişe dön
        </Link>
      </p>
      {msg ? (
        <p className="mt-4 rounded-xl border border-pf-green/30 bg-pf-green/5 px-3 py-2 text-sm text-pf-green-bright">{msg}</p>
      ) : null}
      {err ? (
        <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200" role="alert">
          {err}
        </p>
      ) : null}
      {resetMode ? (
        <form className="mt-6 space-y-4" onSubmit={reset}>
          <div>
            <label className="text-xs font-bold text-pf-mist" htmlFor="np">
              Yeni parola
            </label>
            <input
              id="np"
              type="password"
              required
              minLength={12}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-pf-void px-3 py-2.5 text-sm"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-pf-mist" htmlFor="npc">
              Yeni parola (tekrar)
            </label>
            <input
              id="npc"
              type="password"
              required
              minLength={12}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-pf-void px-3 py-2.5 text-sm"
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-pf-void py-3 text-sm font-bold text-pf-orange-bright ring-1 ring-pf-orange/40 disabled:opacity-60"
          >
            {busy ? "Kaydediliyor…" : "Parolayı güncelle"}
          </button>
        </form>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={forgot}>
          <div>
            <label className="text-xs font-bold text-pf-mist" htmlFor="f-email">
              E-posta
            </label>
            <input
              id="f-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-pf-void px-3 py-2.5 text-sm"
              autoComplete="email"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-pf-void py-3 text-sm font-bold text-pf-orange-bright ring-1 ring-pf-orange/40 disabled:opacity-60"
          >
            {busy ? "Gönderiliyor…" : "Sıfırlama linki iste"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

export function PasswordResetClient() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-zinc-500">Yükleniyor…</div>
      }
    >
      <Inner />
    </Suspense>
  );
}
