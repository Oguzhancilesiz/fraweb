"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeLegacyRelativeUrl } from "@/lib/app-path-normalize";
import { resolvePostLoginDestination } from "@/lib/auth/paths";
import { routes } from "@/lib/site";

function safeReturnUrl(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  return normalizeLegacyRelativeUrl(raw) ?? raw;
}

export function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await login(email, password);
      if (!r.ok) {
        setError(r.message);
        return;
      }
      const ret = safeReturnUrl(sp.get("returnUrl"));
      const next = resolvePostLoginDestination(r.roles, ret);
      router.push(next);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      {error ? (
        <p className="pf-auth-alert rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200" role="alert">
          {error}
        </p>
      ) : null}
      <div>
        <label className="pf-auth-label text-xs font-bold text-pf-mist" htmlFor="l-email">
          E-posta
        </label>
        <input
          id="l-email"
          type="email"
          required
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          className="pf-auth-input mt-1 w-full rounded-xl border border-white/10 bg-pf-void px-3 py-2.5 text-sm text-white placeholder:text-zinc-500"
          autoComplete="username"
        />
      </div>
      <div>
        <label className="pf-auth-label text-xs font-bold text-pf-mist" htmlFor="l-pass">
          Parola
        </label>
        <input
          id="l-pass"
          type="password"
          required
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          className="pf-auth-input mt-1 w-full rounded-xl border border-white/10 bg-pf-void px-3 py-2.5 text-sm text-white placeholder:text-zinc-500"
          autoComplete="current-password"
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-pf-orange py-3 text-sm font-bold text-black disabled:opacity-60"
      >
        {busy ? "Giriş yapılıyor…" : "Giriş yap"}
      </button>
      <p className="text-center text-xs text-zinc-500">
        <Link href={routes.reset} className="pf-auth-forgot font-semibold text-pf-orange-bright underline-offset-2 hover:underline">
          Parolamı unuttum
        </Link>
      </p>
    </form>
  );
}
