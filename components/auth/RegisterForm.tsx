"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";
import { routes } from "@/lib/site";

type RegisterBody = {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string | null;
};

export function RegisterForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const body: RegisterBody = {
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phoneNumber: phone.trim() || null,
      };
      const r = await apiFetch<unknown>("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        setError(r.message);
        return;
      }
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="pf-auth-done-banner mt-6 space-y-4 rounded-xl border border-pf-green/30 bg-pf-green/5 p-4 text-sm text-zinc-300">
        <p>
          Kayıt isteği alındı. E-posta adresine doğrulama bağlantısı gönderildi; hesabını onayladıktan sonra{" "}
          <Link href={routes.login} className="font-bold text-pf-orange-bright">
            giriş yapabilirsin
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      {error ? (
        <p className="pf-auth-alert rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200" role="alert">
          {error}
        </p>
      ) : null}
      <div>
        <label className="pf-auth-label text-xs font-bold text-pf-mist" htmlFor="r-name">
          Ad soyad
        </label>
        <input
          id="r-name"
          required
          value={fullName}
          onChange={(ev) => setFullName(ev.target.value)}
          className="pf-auth-input mt-1 w-full rounded-xl border border-white/10 bg-pf-void px-3 py-2.5 text-sm text-white placeholder:text-zinc-500"
          autoComplete="name"
        />
      </div>
      <div>
        <label className="pf-auth-label text-xs font-bold text-pf-mist" htmlFor="r-email">
          E-posta
        </label>
        <input
          id="r-email"
          type="email"
          required
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          className="pf-auth-input mt-1 w-full rounded-xl border border-white/10 bg-pf-void px-3 py-2.5 text-sm text-white placeholder:text-zinc-500"
          autoComplete="email"
        />
      </div>
      <div>
        <label className="pf-auth-label text-xs font-bold text-pf-mist" htmlFor="r-pass">
          Parola
        </label>
        <input
          id="r-pass"
          type="password"
          required
          minLength={12}
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          className="pf-auth-input mt-1 w-full rounded-xl border border-white/10 bg-pf-void px-3 py-2.5 text-sm text-white placeholder:text-zinc-500"
          autoComplete="new-password"
        />
        <p className="pf-auth-hint mt-1 text-xs text-zinc-500">
          En az 12 karakter; büyük/küçük harf, rakam ve özel karakter (API kuralları).
        </p>
      </div>
      <div>
        <label className="pf-auth-label text-xs font-bold text-pf-mist" htmlFor="r-phone">
          Telefon <span className="font-normal text-zinc-500">(isteğe bağlı)</span>
        </label>
        <input
          id="r-phone"
          value={phone}
          onChange={(ev) => setPhone(ev.target.value)}
          className="pf-auth-input mt-1 w-full rounded-xl border border-white/10 bg-pf-void px-3 py-2.5 text-sm text-white placeholder:text-zinc-500"
          autoComplete="tel"
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-gradient-to-r from-pf-orange to-pink-500 py-3 text-sm font-bold text-black shadow-md shadow-orange-950/25 disabled:opacity-60"
      >
        {busy ? "Kaydediliyor…" : "Kayıt ol"}
      </button>
    </form>
  );
}
