"use client";

import Link from "next/link";
import { useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { SectionCard } from "@/components/dashboard/DashboardUI";
import { routes } from "@/lib/site";

type Props = {
  accessToken: string;
  hasPassword: boolean;
  onUpdated: () => Promise<void>;
};

export function AccountSecurityCard({ accessToken, hasPassword, onUpdated }: Props) {
  const [pwdCur, setPwdCur] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdNew2, setPwdNew2] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);

  const [emailNew, setEmailNew] = useState("");
  const [emailPwd, setEmailPwd] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submitPassword() {
    setPwdBusy(true);
    setErr(null);
    setMsg(null);
    const path = hasPassword ? "/api/v1/profile/change-password" : "/api/v1/profile/set-initial-password";
    const body = hasPassword
      ? JSON.stringify({ currentPassword: pwdCur, newPassword: pwdNew, confirmNewPassword: pwdNew2 })
      : JSON.stringify({ newPassword: pwdNew, confirmNewPassword: pwdNew2 });
    const r = await apiFetch<{ message?: string }>(path, { method: "POST", accessToken, body });
    setPwdBusy(false);
    if (!r.ok) {
      setErr(r.message);
      return;
    }
    setMsg(r.data.message ?? "Parola güncellendi.");
    setPwdCur("");
    setPwdNew("");
    setPwdNew2("");
    await onUpdated();
  }

  async function submitEmailChange() {
    setEmailBusy(true);
    setErr(null);
    setMsg(null);
    const r = await apiFetch<{ message?: string }>("/api/v1/profile/request-email-change", {
      method: "POST",
      accessToken,
      body: JSON.stringify({ newEmail: emailNew.trim(), currentPassword: emailPwd }),
    });
    setEmailBusy(false);
    if (!r.ok) {
      setErr(r.message);
      return;
    }
    setMsg(r.data.message ?? "Onay e-postası gönderildi.");
    setEmailNew("");
    setEmailPwd("");
  }

  return (
    <SectionCard title="Güvenlik" className="bg-pf-card/40">
      {msg ? (
        <p className="mt-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100">{msg}</p>
      ) : null}
      {err ? <p className="mt-1 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">{err}</p> : null}

      <p className="mt-1 text-xs text-zinc-500">Parola en az 12 karakter; büyük, küçük, rakam ve özel karakter içermeli.</p>
      {hasPassword ? (
        <div className="mt-4 grid max-w-md gap-3">
          <label className="block text-sm">
            <span className="text-zinc-400">Mevcut parola</span>
            <input
              type="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-white/15 bg-pf-void/80 px-3 py-2 text-white"
              value={pwdCur}
              onChange={(e) => setPwdCur(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-400">Yeni parola</span>
            <input
              type="password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-white/15 bg-pf-void/80 px-3 py-2 text-white"
              value={pwdNew}
              onChange={(e) => setPwdNew(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-400">Yeni parola (tekrar)</span>
            <input
              type="password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-white/15 bg-pf-void/80 px-3 py-2 text-white"
              value={pwdNew2}
              onChange={(e) => setPwdNew2(e.target.value)}
            />
          </label>
          <button
            type="button"
            disabled={pwdBusy}
            onClick={() => void submitPassword()}
            className="w-fit rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/5 disabled:opacity-50"
          >
            {pwdBusy ? "…" : "Parolayı güncelle"}
          </button>
        </div>
      ) : (
        <div className="mt-4 grid max-w-md gap-3">
          <p className="text-sm text-amber-200/90">Bu hesapta henüz giriş parolası yok; bir kez oluşturabilirsin.</p>
          <label className="block text-sm">
            <span className="text-zinc-400">Yeni parola</span>
            <input
              type="password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-white/15 bg-pf-void/80 px-3 py-2 text-white"
              value={pwdNew}
              onChange={(e) => setPwdNew(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-400">Yeni parola (tekrar)</span>
            <input
              type="password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-white/15 bg-pf-void/80 px-3 py-2 text-white"
              value={pwdNew2}
              onChange={(e) => setPwdNew2(e.target.value)}
            />
          </label>
          <button
            type="button"
            disabled={pwdBusy}
            onClick={() => void submitPassword()}
            className="w-fit rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/5 disabled:opacity-50"
          >
            {pwdBusy ? "…" : "Parola oluştur"}
          </button>
        </div>
      )}

      {hasPassword ? (
        <div className="mt-8 border-t border-white/10 pt-6">
          <h3 className="text-sm font-semibold text-zinc-200">E-posta değiştir</h3>
          <p className="mt-1 text-xs text-zinc-500">Yeni adrese onay bağlantısı gönderilir; mevcut parolan gerekir.</p>
          <div className="mt-3 grid max-w-md gap-3">
            <label className="block text-sm">
              <span className="text-zinc-400">Yeni e-posta</span>
              <input
                type="email"
                className="mt-1 w-full rounded-lg border border-white/15 bg-pf-void/80 px-3 py-2 text-white"
                value={emailNew}
                onChange={(e) => setEmailNew(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-zinc-400">Mevcut parola</span>
              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-white/15 bg-pf-void/80 px-3 py-2 text-white"
                value={emailPwd}
                onChange={(e) => setEmailPwd(e.target.value)}
              />
            </label>
            <button
              type="button"
              disabled={emailBusy}
              onClick={() => void submitEmailChange()}
              className="w-fit rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/5 disabled:opacity-50"
            >
              {emailBusy ? "…" : "Onay e-postası gönder"}
            </button>
          </div>
        </div>
      ) : null}

      <p className="mt-6 text-center text-sm text-zinc-500">
        Parolayı unuttuysan çıkış yapıp{" "}
        <Link href={routes.reset} className="text-pf-orange-bright hover:underline">
          şifre sıfırlama
        </Link>{" "}
        sayfasını kullan.
      </p>
    </SectionCard>
  );
}
