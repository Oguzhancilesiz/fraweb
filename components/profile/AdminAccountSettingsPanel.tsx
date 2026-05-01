"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";
import { AccountSecurityCard } from "@/components/profile/AccountSecurityCard";
import { PageHeader } from "@/components/PageHeader";
import { Badge, SectionCard } from "@/components/dashboard/DashboardUI";
import { routes } from "@/lib/site";

export type AdminProfileGet = {
  role: "admin";
  settings: {
    email: string;
    fullName: string;
    phoneNumber?: string | null;
  };
  emailConfirmed: boolean;
  hasPassword: boolean;
};

type Props = {
  accessToken: string;
  initial: AdminProfileGet;
  onUpdated: () => Promise<void>;
};

export function AdminAccountSettingsPanel({ accessToken, initial, onUpdated }: Props) {
  const [meta, setMeta] = useState({ emailConfirmed: initial.emailConfirmed, hasPassword: initial.hasPassword });
  const [phone, setPhone] = useState(initial.settings.phoneNumber ?? "");
  const [savingPhone, setSavingPhone] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setMeta({ emailConfirmed: initial.emailConfirmed, hasPassword: initial.hasPassword });
    setPhone(initial.settings.phoneNumber ?? "");
  }, [initial]);

  async function savePhone() {
    setSavingPhone(true);
    setErr(null);
    setMsg(null);
    const r = await apiFetch<{ message?: string }>("/api/v1/profile/phone", {
      method: "POST",
      accessToken,
      body: JSON.stringify({ phoneNumber: phone.trim() || null }),
    });
    setSavingPhone(false);
    if (!r.ok) {
      setErr(r.message);
      return;
    }
    setMsg(r.data.message ?? "Telefon numaran güncellendi.");
    await onUpdated();
  }

  const s = initial.settings;

  return (
    <div className="py-2 lg:py-4">
      <PageHeader
        eyebrow="Hesap"
        title="Profil ve güvenlik"
        lead="Yönetici hesabının parolasını ve iletişim bilgilerini buradan güncelleyebilirsin. Rol atamaları kullanıcı yönetiminden yapılır."
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Badge tone="orange">Yönetici</Badge>
      </div>

      {msg ? (
        <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100">{msg}</p>
      ) : null}
      {err ? <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">{err}</p> : null}

      <SectionCard title="Özet" className="mt-6 bg-pf-card/40">
        <dl className="grid gap-3 text-sm text-zinc-400 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase text-zinc-500">E-posta</dt>
            <dd className="text-white">{s.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-zinc-500">E-posta doğrulandı</dt>
            <dd>{meta.emailConfirmed ? "Evet" : "Hayır"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase text-zinc-500">Ad soyad</dt>
            <dd className="text-white">{s.fullName.trim() || "—"}</dd>
          </div>
          <div className="text-xs text-zinc-500 sm:col-span-2">
            Ad güncellemesi için kullanıcı yönetimi veya destek sürecinden ilerlenebilir; burada görüntü amaçlıdır.
          </div>
        </dl>
      </SectionCard>

      <SectionCard title="İletişim" className="mt-6 bg-pf-card/40">
        <div className="mt-4 flex max-w-md flex-col gap-3 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1 text-sm">
            <span className="text-zinc-400">Telefon</span>
            <input
              type="tel"
              className="mt-1 w-full rounded-lg border border-white/15 bg-pf-void/80 px-3 py-2 text-white"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05xx…"
            />
          </label>
          <button
            type="button"
            disabled={savingPhone}
            onClick={() => void savePhone()}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/5 disabled:opacity-50"
          >
            {savingPhone ? "…" : "Kaydet"}
          </button>
        </div>
      </SectionCard>

      <div className="mt-8">
        <AccountSecurityCard
          accessToken={accessToken}
          hasPassword={meta.hasPassword}
          onUpdated={async () => {
            await onUpdated();
          }}
        />
      </div>

      <p className="mt-8 text-center text-sm text-zinc-500">
        Çıkışlı şifre sıfırlama:{" "}
        <Link href={routes.reset} className="text-pf-orange-bright hover:underline">
          şifre sıfırlama
        </Link>
      </p>
    </div>
  );
}
