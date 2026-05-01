"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import { routes } from "@/lib/site";
import {
  DashboardShell,
  ErrorState,
  LoadingState,
  PageHeader,
  SectionCard,
} from "@/components/dashboard/DashboardUI";

/** API `CoachingPackageAdminEditDto` alanları (camelCase JSON). */
type FormState = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  featureHighlights: string;
  durationDays: number;
  isActive: boolean;
  sortOrder: number;
  displayPriceText: string;
  priceAmount: number;
  currency: string;
  shopierProductCode: string;
  externalProductCode: string;
  maxProgramsActive: number;
  allowsMonthlyAssessment: boolean;
  maxAssessmentsPerMonth: number;
  notes: string;
  includesLiveCoachChat: boolean;
  liveChatStudentMessageQuota: number;
  liveChatStudentImageQuota: number;
};

function emptyForm(): FormState {
  return {
    name: "",
    slug: "",
    tagline: "",
    description: "",
    featureHighlights: "",
    durationDays: 30,
    isActive: true,
    sortOrder: 0,
    displayPriceText: "",
    priceAmount: 0,
    currency: "TRY",
    shopierProductCode: "",
    externalProductCode: "",
    maxProgramsActive: 1,
    allowsMonthlyAssessment: true,
    maxAssessmentsPerMonth: 1,
    notes: "",
    includesLiveCoachChat: false,
    liveChatStudentMessageQuota: 0,
    liveChatStudentImageQuota: 0,
  };
}

function mapLoaded(j: Partial<FormState>): FormState {
  const d = emptyForm();
  return {
    ...d,
    ...(j as FormState),
    name: (j.name as string) ?? "",
    slug: (j.slug as string) ?? "",
    tagline: (j.tagline as string) ?? "",
    description: (j.description as string) ?? "",
    featureHighlights: (j.featureHighlights as string) ?? "",
    durationDays: Number(j.durationDays ?? d.durationDays),
    isActive: Boolean(j.isActive ?? d.isActive),
    sortOrder: Number(j.sortOrder ?? d.sortOrder),
    displayPriceText: (j.displayPriceText as string) ?? "",
    priceAmount: Number(j.priceAmount ?? 0),
    currency: (j.currency as string) ?? "TRY",
    shopierProductCode: (j.shopierProductCode as string) ?? "",
    externalProductCode: (j.externalProductCode as string) ?? "",
    maxProgramsActive: Number(j.maxProgramsActive ?? d.maxProgramsActive),
    allowsMonthlyAssessment: Boolean(j.allowsMonthlyAssessment ?? d.allowsMonthlyAssessment),
    maxAssessmentsPerMonth: Number(j.maxAssessmentsPerMonth ?? d.maxAssessmentsPerMonth),
    notes: (j.notes as string) ?? "",
    includesLiveCoachChat: Boolean(j.includesLiveCoachChat ?? false),
    liveChatStudentMessageQuota: Number(j.liveChatStudentMessageQuota ?? 0),
    liveChatStudentImageQuota: Number(j.liveChatStudentImageQuota ?? 0),
  };
}

export function AdminPackageEditorClient(props: { mode: "create" } | { mode: "edit"; packageId: number }) {
  const router = useRouter();
  const { ready, token } = useAuth();
  const [loading, setLoading] = useState(props.mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (props.mode !== "edit" || !ready || !token) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const r = await apiFetch<Record<string, unknown>>(`/api/v1/admin/packages/${props.packageId}`, {
        accessToken: token,
      });
      if (cancelled) return;
      if (!r.ok) {
        setError(r.message);
      } else {
        setForm(mapLoaded(r.data as Partial<FormState>));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [props, ready, token]);

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    if (!token) return;
    const body = { ...form };
    setSaving(true);
    setError(null);

    if (props.mode === "create") {
      const r = await apiFetch<{ id: number }>("/api/v1/admin/packages", {
        method: "POST",
        accessToken: token,
        body: JSON.stringify(body),
      });
      setSaving(false);
      if (!r.ok) {
        setError(r.message);
        return;
      }
      const nid = typeof r.data === "object" && r.data && typeof (r.data as { id?: number }).id === "number" ? (r.data as { id: number }).id : null;
      if (nid != null) router.replace(routes.adminPackage(nid));
      else router.replace(routes.adminPackages);
      return;
    }

    const r = await apiFetch(`/api/v1/admin/packages/${props.packageId}`, {
      method: "PUT",
      accessToken: token,
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!r.ok) setError(r.message);
    else router.refresh();
  }

  if (!ready) return <LoadingState label="Hazırlanıyor..." />;
  if (props.mode === "edit" && !token) return <ErrorState message="Oturum gerekli" />;
  if (props.mode === "edit" && loading) return <LoadingState label="Paket yükleniyor..." />;
  if (error && props.mode === "edit" && !form.slug) return <ErrorState message={error} />;

  return (
    <DashboardShell>
      <PageHeader
        eyebrow="Yönetim"
        title={props.mode === "create" ? "Yeni paket" : `Paketi düzenle #${props.mode === "edit" ? props.packageId : ""}`}
        lead="Tüm alanlar API doğrulamasına tabidir."
        actions={
          <Link href={routes.adminPackages} className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/5">
            ← Liste
          </Link>
        }
      />
      {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}

      <SectionCard title="Genel">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Ad*
            <input
              value={form.name}
              onChange={(e) => patch("name", e.target.value)}
              className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Slug*
            <input
              value={form.slug}
              onChange={(e) =>
                patch("slug", e.target.value.trim().replace(/\s+/g, "-").toLowerCase())
              }
              className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 font-mono text-sm text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400 md:col-span-2">
            Tagline
            <input value={form.tagline} onChange={(e) => patch("tagline", e.target.value)} className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400 md:col-span-2">
            Açıklama
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => patch("description", e.target.value)}
              className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400 md:col-span-2">
            Öne çıkan özellikler (metin/HTML)
            <textarea
              rows={4}
              value={form.featureHighlights}
              onChange={(e) => patch("featureHighlights", e.target.value)}
              className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 font-mono text-sm text-zinc-100"
            />
          </label>
        </div>
      </SectionCard>

      <SectionCard title="Ücret ve görünüm">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Süre (gün)
            <input
              type="number"
              min={1}
              value={form.durationDays}
              onChange={(e) => patch("durationDays", Number(e.target.value))}
              className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Fiyat tutarı*
            <input
              type="number"
              step="0.01"
              min={0}
              value={form.priceAmount}
              onChange={(e) => patch("priceAmount", Number(e.target.value))}
              className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Para birimi
            <input
              value={form.currency}
              onChange={(e) => patch("currency", e.target.value.toUpperCase())}
              className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 font-mono text-sm text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400 md:col-span-2">
            Fiyat görünüm metni
            <input
              value={form.displayPriceText}
              onChange={(e) => patch("displayPriceText", e.target.value)}
              className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Sıra
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => patch("sortOrder", Number(e.target.value))}
              className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-zinc-300 md:col-span-2">
            <input type="checkbox" checked={form.isActive} onChange={(e) => patch("isActive", e.target.checked)} /> Katalogda
            aktif
          </label>
        </div>
      </SectionCard>

      <SectionCard title="Koçluğa özel kurallar">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Maks. aynı anda program
            <input
              type="number"
              min={0}
              value={form.maxProgramsActive}
              onChange={(e) => patch("maxProgramsActive", Number(e.target.value))}
              className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100"
            />
          </label>
          <label className="flex items-center gap-2 pt-6 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={form.allowsMonthlyAssessment}
              onChange={(e) => patch("allowsMonthlyAssessment", e.target.checked)}
            />{" "}
            Aylık değerlendirme dahil
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Ay içi değerlendirme üst sınırı
            <input
              type="number"
              min={0}
              value={form.maxAssessmentsPerMonth}
              onChange={(e) => patch("maxAssessmentsPerMonth", Number(e.target.value))}
              className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400 md:col-span-2">
            Notlar
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => patch("notes", e.target.value)}
              className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100"
            />
          </label>
        </div>
      </SectionCard>

      <SectionCard title="Ödeme & entegrasyon">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Shopier ürün kodu
            <input
              value={form.shopierProductCode}
              onChange={(e) => patch("shopierProductCode", e.target.value)}
              className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 font-mono text-sm text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Harici ürün kodu
            <input
              value={form.externalProductCode}
              onChange={(e) => patch("externalProductCode", e.target.value)}
              className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 font-mono text-sm text-zinc-100"
            />
          </label>
        </div>
      </SectionCard>

      <SectionCard title="Canlı koç sohbeti">
        <label className="flex items-center gap-2 text-xs text-zinc-300">
          <input
            type="checkbox"
            checked={form.includesLiveCoachChat}
            onChange={(e) => patch("includesLiveCoachChat", e.target.checked)}
          />{" "}
          Pakete canlı koç mesajları dahildir
        </label>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Öğrenci metin kota (-1 = sınırsız)
            <input
              type="number"
              value={form.liveChatStudentMessageQuota}
              onChange={(e) => patch("liveChatStudentMessageQuota", Number(e.target.value))}
              className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Öğrenci görsel kota
            <input
              type="number"
              min={0}
              value={form.liveChatStudentImageQuota}
              onChange={(e) => patch("liveChatStudentImageQuota", Number(e.target.value))}
              className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100"
            />
          </label>
        </div>
      </SectionCard>

      <button
        type="button"
        disabled={saving}
        onClick={() => void submit()}
        className="w-full rounded-2xl bg-pf-orange py-4 text-base font-black text-black disabled:opacity-50"
      >
        {props.mode === "create" ? "Oluştur" : "Kaydet"}
      </button>
    </DashboardShell>
  );
}
