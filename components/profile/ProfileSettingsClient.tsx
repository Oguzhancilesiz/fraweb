"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import { resolveMediaUrl } from "@/lib/media";
import { PageHeader } from "@/components/PageHeader";
import { routes } from "@/lib/site";
import { AdminAccountSettingsPanel, type AdminProfileGet } from "@/components/profile/AdminAccountSettingsPanel";
import { StudentProfileSettingsPanel, type StudentProfileGet } from "@/components/profile/StudentProfileSettingsPanel";

type CoachSettings = {
  email: string;
  fullName: string;
  displayName: string;
  phoneNumber?: string | null;
  profilePhotoUrl?: string | null;
  bio?: string | null;
  specialties?: string | null;
  isAvailable: boolean;
  social?: Record<string, string | null>;
};

type CoachProfileGet = {
  role: "coach";
  settings: CoachSettings;
  emailConfirmed: boolean;
  hasPassword: boolean;
};

type ProfileGet = CoachProfileGet | StudentProfileGet | AdminProfileGet;

export function ProfileSettingsClient() {
  const router = useRouter();
  const { token, ready, refreshUser } = useAuth();
  const [data, setData] = useState<ProfileGet | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const r = await apiFetch<ProfileGet>("/api/v1/profile", { accessToken: token });
    if (!r.ok) {
      setErr(r.message);
      setData(null);
    } else {
      setErr(null);
      setData(r.data);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace(`${routes.login}?returnUrl=${encodeURIComponent(routes.profileSettings)}`);
      return;
    }
    let c = false;
    void (async () => {
      await loadProfile();
      if (c) return;
    })();
    return () => {
      c = true;
    };
  }, [ready, token, router, loadProfile]);

  if (!ready || loading) {
    return <div className="py-16 text-center text-sm text-zinc-500">Yükleniyor…</div>;
  }

  if (err || !data) {
    return (
      <div className="py-10">
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{err ?? "Profil yüklenemedi."}</p>
        <p className="mt-4 text-sm text-zinc-500">Bu hesap türü için profil özeti kullanılamıyor olabilir.</p>
        <Link href={routes.home} className="mt-4 inline-block text-sm text-pf-orange-bright">
          Ana siteye dön
        </Link>
      </div>
    );
  }

  if (data.role === "student" && token) {
    return (
      <div className="py-2 lg:py-4">
        <PageHeader
          eyebrow="Hesap"
          title="Profil ayarları"
          lead="Profil sekmesinde bilgilerini seçerek veya kısaca yazarak güncelle; aylık değerlendirme formlarında öneri olarak kullanılır. Parola ve e-posta için Güvenlik sekmesine geç."
        />
        <StudentProfileSettingsPanel
          accessToken={token}
          initial={data}
          onProfileUpdated={async () => {
            await refreshUser();
            await loadProfile();
          }}
        />
      </div>
    );
  }

  if (data.role === "admin" && token) {
    return (
      <AdminAccountSettingsPanel
        accessToken={token}
        initial={data}
        onUpdated={async () => {
          await refreshUser();
          await loadProfile();
        }}
      />
    );
  }

  if (data.role !== "coach") {
    return (
      <div className="py-10">
        <p className="text-sm text-zinc-500">Bu hesap için profil görünümü tanımlı değil.</p>
        <Link href={routes.home} className="mt-4 inline-block text-sm text-pf-orange-bright">
          Ana siteye dön
        </Link>
      </div>
    );
  }

  const s = data.settings;
  const photo = resolveMediaUrl(s.profilePhotoUrl);

  return (
    <div className="py-2 lg:py-4">
      <PageHeader
        eyebrow="Hesap"
        title="Profil ayarları"
        lead="Koç profili şu an bu sayfada salt okunur özet. Düzenleme için Web koç panelini veya ileride buraya form eklenebilir."
      />

      <div className="mt-6 flex flex-wrap items-start gap-6">
        <div className="shrink-0">
          {photo ? (
            <img src={photo} alt="" className="h-24 w-24 rounded-2xl border border-white/10 object-cover" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-white/10 bg-pf-orange/10 font-display text-2xl font-bold text-pf-orange-bright">
              {(s.fullName || s.email).slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-pf-card/40 p-4">
            <h2 className="text-sm font-bold text-white">Kimlik</h2>
            <dl className="mt-3 space-y-2 text-sm text-zinc-400">
              <div>
                <dt className="text-xs uppercase text-zinc-500">E-posta</dt>
                <dd className="text-white">{s.email}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-zinc-500">E-posta doğrulandı</dt>
                <dd>{data.emailConfirmed ? "Evet" : "Hayır"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-zinc-500">Şifre tanımlı</dt>
                <dd>{data.hasPassword ? "Evet" : "Hayır (sosyal / davet akışı)"}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-white/10 bg-pf-card/40 p-4">
            <h2 className="text-sm font-bold text-white">Koç profili</h2>
            <dl className="mt-3 space-y-2 text-sm text-zinc-400">
              <div>
                <dt className="text-xs uppercase text-zinc-500">Ad soyad</dt>
                <dd className="text-white">{(s as CoachSettings).fullName}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-zinc-500">Görünen ad</dt>
                <dd className="text-white">{(s as CoachSettings).displayName}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-zinc-500">Telefon</dt>
                <dd>{(s as CoachSettings).phoneNumber || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-zinc-500">Müsait</dt>
                <dd>{(s as CoachSettings).isAvailable ? "Evet" : "Hayır"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-zinc-500">Bio</dt>
                <dd className="whitespace-pre-wrap">{(s as CoachSettings).bio || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-zinc-500">Uzmanlıklar</dt>
                <dd className="whitespace-pre-wrap">{(s as CoachSettings).specialties || "—"}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-zinc-500">
        Şifre sıfırlama bağlantısı için{" "}
        <Link href={routes.reset} className="text-pf-orange-bright">
          şifre sıfırlama
        </Link>{" "}
        sayfasını kullanın (çıkışlı).
      </p>
    </div>
  );
}
