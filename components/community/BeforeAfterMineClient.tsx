"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import { getPublicApiBaseUrl } from "@/lib/api/config";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/components/dashboard/DashboardUI";
import { usePanelTheme } from "@/contexts/PanelThemeContext";
import { routes } from "@/lib/site";

const MAX_HEADING = 200;
const MAX_PERIOD = 80;
const MAX_BODY = 4000;
const MAX_IMAGES_PER_SIDE = 4;

const DURATION_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Süre seçin (isteğe bağlı)" },
  { value: "2 hafta", label: "2 hafta" },
  { value: "4 hafta", label: "4 hafta" },
  { value: "6 hafta", label: "6 hafta" },
  { value: "8 hafta", label: "8 hafta" },
  { value: "12 hafta", label: "12 hafta" },
  { value: "16 hafta", label: "16 hafta" },
  { value: "24 hafta", label: "24 hafta" },
  { value: "6 ay", label: "6 ay" },
  { value: "12 ay", label: "12 ay" },
];

function fmtDateDMY(isoYmd: string): string {
  const p = isoYmd.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p)) return p;
  const [y, m, d] = p.split("-").map(Number);
  if (!y || !m || !d) return p;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** API’ye gidecek tek satır (≤80); tarih + süre + ek metin birleşimi veya yalnızca ek metin. */
function computePeriodLabel(dateFrom: string, dateTo: string, durationValue: string, extra: string): string {
  const ex = extra.trim();
  let df = dateFrom.trim();
  let dt = dateTo.trim();
  if (df && dt && df > dt) [df, dt] = [dt, df];
  const hasRange = Boolean(df && dt);
  const hasDur = Boolean(durationValue);
  let s = "";
  if (hasRange) s = `${fmtDateDMY(df)} – ${fmtDateDMY(dt)}`;
  if (hasDur) s = s ? `${s} · ${durationValue}` : durationValue;
  if (ex) s = s ? `${s} · ${ex}` : ex;
  return s.replace(/\s+/g, " ").trim().slice(0, MAX_PERIOD);
}

function useFileObjectUrls(files: File[]) {
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    const next = files.map((f) => URL.createObjectURL(f));
    setUrls(next);
    return () => {
      for (const u of next) URL.revokeObjectURL(u);
    };
  }, [files]);
  return urls;
}

function ImagePickColumn({
  title,
  required,
  files,
  setFiles,
}: {
  title: string;
  required?: boolean;
  files: File[];
  setFiles: (f: File[]) => void;
}) {
  const urls = useFileObjectUrls(files);
  const pick = (list: FileList | null) => {
    if (!list?.length) return;
    const next = [...files];
    for (let i = 0; i < list.length && next.length < MAX_IMAGES_PER_SIDE; i++) next.push(list[i]!);
    setFiles(next);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-3">
      <label className="mb-2 block text-xs font-medium text-zinc-300">
        {title}
        {required ? <span className="text-pf-orange-bright"> *</span> : null}
      </label>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="block w-full text-xs text-zinc-400 file:mr-2 file:rounded-lg file:border-0 file:bg-pf-orange/20 file:px-2 file:py-1.5 file:text-zinc-200"
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = "";
        }}
      />
      {files.length > 0 ? (
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}-${urls[i] ?? ""}`} className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-black/40">
              {urls[i] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={urls[i]} alt={f.name} title={f.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center p-2 text-center text-[10px] text-zinc-500">{f.name}</div>
              )}
              <button
                type="button"
                title="Kaldır"
                onClick={() => setFiles(files.filter((_, j) => j !== i))}
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-sm text-white opacity-90 ring-1 ring-white/20 hover:bg-red-900/80"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[11px] text-zinc-600">Henüz dosya seçilmedi.</p>
      )}
    </div>
  );
}

type FeedAttachment = { url: string; contentType: string };

type FeedMedia = {
  hasMedia?: boolean;
  isBeforeAfterSplitLayout?: boolean;
  beforeGallery?: FeedAttachment[];
  afterGallery?: FeedAttachment[];
};

type MinePost = {
  publicId: string;
  heading?: string | null;
  body: string;
  periodLabel?: string | null;
  moderationStatus?: number | string;
  moderationNote?: string | null;
  createdAtUtc: string;
  showOnPublicHomeSpotlight?: boolean;
  showInMainCommunityFeed?: boolean;
  media?: FeedMedia;
};

type BeforeAfterEditDto = {
  postPublicId: string;
  heading: string;
  periodLabel: string;
  body: string;
  showOnPublicHomeSpotlight: boolean;
  showInMainCommunityFeed: boolean;
  beforeImageCount: number;
  existingBeforeUrls: string[];
  existingAfterUrls: string[];
};

function resolveMediaUrl(url: string): string {
  const u = url.trim();
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  const base = getPublicApiBaseUrl();
  return `${base}${u.startsWith("/") ? u : `/${u}`}`;
}

function moderationLabel(s: unknown): string {
  if (s === 0 || s === "0" || s === "Pending") return "Onay bekliyor";
  if (s === 1 || s === "1" || s === "Approved") return "Onaylandı";
  if (s === 2 || s === "2" || s === "Rejected") return "Reddedildi";
  return "—";
}

async function multipartJson(
  path: string,
  method: "POST" | "PUT",
  form: FormData,
  token: string,
): Promise<{ ok: true; message?: string } | { ok: false; message: string }> {
  const base = getPublicApiBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  try {
    const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: form });
    const text = await res.text();
    if (!res.ok) {
      let msg = res.statusText || "İstek başarısız";
      try {
        const j = JSON.parse(text) as Record<string, unknown>;
        if (typeof j.message === "string" && j.message.trim()) msg = j.message.trim();
        else if (typeof j.detail === "string" && j.detail.trim()) msg = j.detail.trim();
        else if (j.errors && typeof j.errors === "object") {
          const lines = Object.values(j.errors as Record<string, string[]>)
            .flat()
            .filter((x): x is string => typeof x === "string" && x.length > 0);
          if (lines.length) msg = lines.join(" ");
        }
      } catch {
        if (text.trim()) msg = text.slice(0, 400);
      }
      return { ok: false, message: msg };
    }
    try {
      const j = text ? (JSON.parse(text) as { message?: string }) : {};
      return { ok: true, message: typeof j.message === "string" ? j.message : undefined };
    } catch {
      return { ok: true };
    }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Ağ hatası" };
  }
}

function BeforeAfterFormFields({
  heading,
  setHeading,
  periodDateFrom,
  setPeriodDateFrom,
  periodDateTo,
  setPeriodDateTo,
  periodDurationValue,
  setPeriodDurationValue,
  periodExtra,
  setPeriodExtra,
  periodPreview,
  body,
  setBody,
  showSpotlight,
  setShowSpotlight,
  showInFeed,
  setShowInFeed,
  beforeFiles,
  setBeforeFiles,
  afterFiles,
  setAfterFiles,
  existingBeforeUrls,
  existingAfterUrls,
  replaceHint,
}: {
  heading: string;
  setHeading: (v: string) => void;
  periodDateFrom: string;
  setPeriodDateFrom: (v: string) => void;
  periodDateTo: string;
  setPeriodDateTo: (v: string) => void;
  periodDurationValue: string;
  setPeriodDurationValue: (v: string) => void;
  periodExtra: string;
  setPeriodExtra: (v: string) => void;
  periodPreview: string;
  body: string;
  setBody: (v: string) => void;
  showSpotlight: boolean;
  setShowSpotlight: (v: boolean) => void;
  showInFeed: boolean;
  setShowInFeed: (v: boolean) => void;
  beforeFiles: File[];
  setBeforeFiles: (files: File[]) => void;
  afterFiles: File[];
  setAfterFiles: (files: File[]) => void;
  existingBeforeUrls?: string[];
  existingAfterUrls?: string[];
  replaceHint?: boolean;
}) {
  const dateHint =
    (periodDateFrom && !periodDateTo) || (!periodDateFrom && periodDateTo)
      ? "Başlangıç ve bitiş tarihlerini birlikte seçin."
      : periodDateFrom && periodDateTo && periodDateFrom > periodDateTo
        ? "Bitiş, başlangıçtan önce görünüyor; kayıtta sıra otomatik düzeltilir."
        : null;

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-400">Başlık *</label>
        <input
          value={heading}
          onChange={(e) => setHeading(e.target.value.slice(0, MAX_HEADING))}
          maxLength={MAX_HEADING}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600"
          placeholder="Örn. 12 haftada güç ve form"
        />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <p className="mb-3 text-xs font-semibold text-zinc-200">Dönem ve süre *</p>
        <p className="mb-3 text-[11px] leading-relaxed text-zinc-500">
          Tarih aralığı ve/veya süre seçin; istersen kısa ek not ekle. Aşağıdaki özet sunucuya tek satır olarak gider (en fazla {MAX_PERIOD} karakter).
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-zinc-400">Başlangıç tarihi</label>
            <input
              type="date"
              value={periodDateFrom}
              onChange={(e) => setPeriodDateFrom(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-zinc-400">Bitiş tarihi</label>
            <input
              type="date"
              value={periodDateTo}
              onChange={(e) => setPeriodDateTo(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white [color-scheme:dark]"
            />
          </div>
        </div>
        {dateHint ? <p className="mt-2 text-[11px] text-amber-200/90">{dateHint}</p> : null}

        <div className="mt-3">
          <label className="mb-1 block text-[11px] font-medium text-zinc-400">Program süresi</label>
          <select
            value={periodDurationValue}
            onChange={(e) => setPeriodDurationValue(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-zinc-100 px-3 py-2.5 text-sm text-zinc-900"
          >
            {DURATION_OPTIONS.map((o) => (
              <option key={o.label + o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3">
          <label className="mb-1 block text-[11px] font-medium text-zinc-400">Ek not (isteğe bağlı)</label>
          <input
            value={periodExtra}
            onChange={(e) => setPeriodExtra(e.target.value.slice(0, MAX_PERIOD))}
            maxLength={MAX_PERIOD}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
            placeholder="Örn. ilk kamp · evde ekipmansız"
          />
        </div>

        <div className="mt-3 rounded-lg border border-pf-orange/20 bg-pf-orange/5 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-pf-orange-bright">Önizleme</p>
          <p className="mt-1 break-words text-sm text-zinc-100">{periodPreview || "— Henüz dönem bilgisi yok —"}</p>
          <p className="mt-1 text-[10px] text-zinc-500">{periodPreview.length}/{MAX_PERIOD} karakter</p>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-400">Hikâye (isteğe bağlı)</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, MAX_BODY))}
          maxLength={MAX_BODY}
          rows={5}
          className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
          placeholder="İstersen kısa bir metin; görseller ana mesajın."
        />
        <p className="mt-1 text-[11px] text-zinc-600">{body.length}/{MAX_BODY}</p>
      </div>

      <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-xs font-medium text-zinc-300">Görünürlük (onay sonrası)</p>
        <label className="flex cursor-pointer items-start gap-2 text-sm text-zinc-300">
          <input type="checkbox" checked={showSpotlight} onChange={(e) => setShowSpotlight(e.target.checked)} className="mt-1" />
          <span>Ana sayfa dönüşüm vitrininde yer almayı kabul ediyorum (yönetici onayı gerekir).</span>
        </label>
        <label className="flex cursor-pointer items-start gap-2 text-sm text-zinc-300">
          <input type="checkbox" checked={showInFeed} onChange={(e) => setShowInFeed(e.target.checked)} className="mt-1" />
          <span>Topluluk ana akışında da gösterilsin (yönetici onayı gerekir).</span>
        </label>
      </div>

      {existingBeforeUrls?.length || existingAfterUrls?.length ? (
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="mb-2 text-xs font-medium text-zinc-400">Mevcut görseller</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-[11px] uppercase tracking-wide text-zinc-500">Başlangıç</p>
              <div className="flex flex-wrap gap-2">
                {(existingBeforeUrls ?? []).map((u, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={resolveMediaUrl(u)} alt="" className="h-20 w-20 rounded-lg border border-white/10 object-cover" />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-[11px] uppercase tracking-wide text-zinc-500">Güncel</p>
              <div className="flex flex-wrap gap-2">
                {(existingAfterUrls ?? []).map((u, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={resolveMediaUrl(u)} alt="" className="h-20 w-20 rounded-lg border border-white/10 object-cover" />
                ))}
              </div>
            </div>
          </div>
          {replaceHint ? (
            <p className="mt-2 text-[11px] leading-relaxed text-amber-200/90">
              Görselleri değiştirmek için aşağıdan <strong>her iki gruba da</strong> yeni dosya seçmelisin (en az 1 başlangıç + 1 güncel). Boş
              bırakırsan mevcut görseller korunur, yalnızca metin ve görünürlük güncellenir.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <ImagePickColumn title="Başlangıç görselleri" required files={beforeFiles} setFiles={setBeforeFiles} />
        <ImagePickColumn title="Güncel görselleri" required files={afterFiles} setFiles={setAfterFiles} />
      </div>
      <p className="text-[11px] text-zinc-600">Her grupta en az 1, en fazla {MAX_IMAGES_PER_SIDE} görsel (JPEG/PNG/WebP, dosya başına en fazla ~5 MB).</p>
    </div>
  );
}

export function BeforeAfterMineClient() {
  const router = useRouter();
  const { theme, enabled } = usePanelTheme();
  const L = enabled && theme === "light";
  const { token, ready } = useAuth();
  const [posts, setPosts] = useState<MinePost[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const [showComposer, setShowComposer] = useState(false);
  const [heading, setHeading] = useState("");
  const [periodDateFrom, setPeriodDateFrom] = useState("");
  const [periodDateTo, setPeriodDateTo] = useState("");
  const [periodDurationValue, setPeriodDurationValue] = useState("");
  const [periodExtra, setPeriodExtra] = useState("");
  const [body, setBody] = useState("");
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [showInFeed, setShowInFeed] = useState(false);
  const [beforeFiles, setBeforeFiles] = useState<File[]>([]);
  const [afterFiles, setAfterFiles] = useState<File[]>([]);

  const periodPreview = useMemo(
    () => computePeriodLabel(periodDateFrom, periodDateTo, periodDurationValue, periodExtra),
    [periodDateFrom, periodDateTo, periodDurationValue, periodExtra],
  );

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDto, setEditDto] = useState<BeforeAfterEditDto | null>(null);
  const [editLoadErr, setEditLoadErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    const r = await apiFetch<MinePost[]>("/api/v1/community/before-after/mine?take=60", { accessToken: token });
    if (!r.ok) {
      setErr(r.message);
      setPosts([]);
      return;
    }
    setErr(null);
    setPosts(Array.isArray(r.data) ? r.data : []);
  }, [token]);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace(`${routes.login}?returnUrl=${encodeURIComponent(routes.beforeAfterMine)}`);
      return;
    }
    void load();
  }, [ready, token, router, load]);

  const clearDraftFields = () => {
    setHeading("");
    setPeriodDateFrom("");
    setPeriodDateTo("");
    setPeriodDurationValue("");
    setPeriodExtra("");
    setBody("");
    setShowSpotlight(false);
    setShowInFeed(false);
    setBeforeFiles([]);
    setAfterFiles([]);
  };

  const openEdit = async (publicId: string) => {
    if (!token) return;
    setFormErr(null);
    setEditLoadErr(null);
    setEditId(publicId);
    setEditOpen(true);
    setBusy(true);
    const r = await apiFetch<BeforeAfterEditDto>(`/api/v1/community/before-after/${publicId}`, { accessToken: token });
    setBusy(false);
    if (!r.ok) {
      setEditDto(null);
      setEditLoadErr(r.message);
      return;
    }
    const d = r.data;
    setEditDto(d);
    setHeading(d.heading);
    setPeriodDateFrom("");
    setPeriodDateTo("");
    setPeriodDurationValue("");
    setPeriodExtra(d.periodLabel ?? "");
    setBody(d.body);
    setShowSpotlight(d.showOnPublicHomeSpotlight);
    setShowInFeed(d.showInMainCommunityFeed);
    setBeforeFiles([]);
    setAfterFiles([]);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditId(null);
    setEditDto(null);
    setEditLoadErr(null);
    setFormErr(null);
    clearDraftFields();
  };

  const submitCreate = async () => {
    if (!token) return;
    setFormErr(null);
    const h = heading.trim();
    const p = periodPreview.trim();
    if (!h || !p) {
      setFormErr("Başlık ve dönem bilgisi zorunludur. Tarih (ikisi birden), süre veya ek nottan en az birini doldurun.");
      return;
    }
    if (beforeFiles.length < 1 || afterFiles.length < 1) {
      setFormErr("Başlangıç ve güncel için en az birer görsel yüklemelisin.");
      return;
    }
    const fd = new FormData();
    fd.append("Heading", h);
    fd.append("PeriodLabel", p);
    fd.append("Body", body.trim());
    fd.append("ShowOnPublicHomeSpotlight", showSpotlight ? "true" : "false");
    fd.append("ShowInMainCommunityFeed", showInFeed ? "true" : "false");
    for (const f of beforeFiles) fd.append("beforeImages", f);
    for (const f of afterFiles) fd.append("afterImages", f);

    setBusy(true);
    const r = await multipartJson("/api/v1/community/before-after", "POST", fd, token);
    setBusy(false);
    if (!r.ok) {
      setFormErr(r.message);
      return;
    }
    setBanner({ kind: "ok", text: r.message ?? "Paylaşım kaydedildi. Yönetici onayından sonra yayınlanabilir." });
    clearDraftFields();
    setShowComposer(false);
    await load();
  };

  const submitUpdate = async () => {
    if (!token || !editDto) return;
    setFormErr(null);
    const h = heading.trim();
    const p = periodPreview.trim();
    if (!h || !p) {
      setFormErr("Başlık ve dönem bilgisi zorunludur. Tarih (ikisi birden), süre veya ek nottan en az birini doldurun.");
      return;
    }
    const replacing = beforeFiles.length > 0 || afterFiles.length > 0;
    if (replacing && (beforeFiles.length < 1 || afterFiles.length < 1)) {
      setFormErr("Görselleri yenilemek için her iki gruba da en az birer dosya seçmelisin.");
      return;
    }

    const fd = new FormData();
    fd.append("PostPublicId", editDto.postPublicId);
    fd.append("Heading", h);
    fd.append("PeriodLabel", p);
    fd.append("Body", body.trim());
    fd.append("ShowOnPublicHomeSpotlight", showSpotlight ? "true" : "false");
    fd.append("ShowInMainCommunityFeed", showInFeed ? "true" : "false");
    if (replacing) {
      for (const f of beforeFiles) fd.append("beforeImages", f);
      for (const f of afterFiles) fd.append("afterImages", f);
    }

    setBusy(true);
    const r = await multipartJson(`/api/v1/community/before-after/${editDto.postPublicId}`, "PUT", fd, token);
    setBusy(false);
    if (!r.ok) {
      setFormErr(r.message);
      return;
    }
    setBanner({ kind: "ok", text: r.message ?? "Güncellendi. İçerik yeniden yönetici onayına gönderildi." });
    closeEdit();
    await load();
  };

  const deletePost = async (publicId: string) => {
    if (!token) return;
    if (!window.confirm("Bu paylaşımı silmek istediğine emin misin? Bu işlem geri alınamaz.")) return;
    setBusy(true);
    const r = await apiFetch<{ message?: string }>(`/api/v1/community/before-after/${publicId}`, {
      method: "DELETE",
      accessToken: token,
    });
    setBusy(false);
    if (!r.ok) {
      setBanner({ kind: "err", text: r.message });
      return;
    }
    setBanner({ kind: "ok", text: "Paylaşım silindi." });
    await load();
  };

  if (!ready || !token) {
    return (
      <div className={cn("py-16 text-center text-sm", L ? "text-stone-600" : "text-zinc-500")}>Yükleniyor…</div>
    );
  }

  return (
    <div className="py-2 lg:py-4">
      <PageHeader
        eyebrow="Topluluk"
        title="Değişimim"
        lead="Öncesi ve sonrası görsellerini yükleyerek paylaşım oluşturabilir, düzenleyebilir veya silebilirsin. Yayın, yönetici onayına bağlıdır."
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setShowComposer((v) => !v);
            setFormErr(null);
            if (showComposer) clearDraftFields();
          }}
          className="rounded-xl bg-pf-orange-bright px-4 py-2.5 text-sm font-bold text-black hover:opacity-95 disabled:opacity-50"
        >
          {showComposer ? "Formu kapat" : "Yeni paylaşım"}
        </button>
        <Link
          href={routes.beforeAfterExplore}
          className={cn("text-sm hover:underline", L ? "font-semibold text-orange-950" : "text-pf-orange-bright")}
        >
          Keşfet — öncesi-sonrası
        </Link>
      </div>

      {showComposer ? (
        <section
          className={cn(
            "mt-6 rounded-2xl border p-4 sm:p-6",
            L ? "border-orange-200/90 bg-orange-50/93 shadow-[0_12px_40px_-18px_rgba(249,115,22,0.16)]" : "border-pf-orange/25 bg-pf-card/30",
          )}
        >
          <h2 className={cn("font-display text-lg font-bold", L ? "text-stone-900" : "text-white")}>Yeni değişim paylaşımı</h2>
          {formErr ? <p className={cn("mt-2 text-sm", L ? "text-red-800" : "text-red-300")}>{formErr}</p> : null}
          <div className="mt-4">
            <BeforeAfterFormFields
              heading={heading}
              setHeading={setHeading}
              periodDateFrom={periodDateFrom}
              setPeriodDateFrom={setPeriodDateFrom}
              periodDateTo={periodDateTo}
              setPeriodDateTo={setPeriodDateTo}
              periodDurationValue={periodDurationValue}
              setPeriodDurationValue={setPeriodDurationValue}
              periodExtra={periodExtra}
              setPeriodExtra={setPeriodExtra}
              periodPreview={periodPreview}
              body={body}
              setBody={setBody}
              showSpotlight={showSpotlight}
              setShowSpotlight={setShowSpotlight}
              showInFeed={showInFeed}
              setShowInFeed={setShowInFeed}
              beforeFiles={beforeFiles}
              setBeforeFiles={setBeforeFiles}
              afterFiles={afterFiles}
              setAfterFiles={setAfterFiles}
            />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void submitCreate()}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-50"
            >
              Paylaşımı gönder
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                clearDraftFields();
                setFormErr(null);
              }}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm",
                L ? "border-orange-950/24 text-stone-700 hover:bg-white" : "border-white/15 text-zinc-300 hover:bg-white/5",
              )}
            >
              Temizle
            </button>
          </div>
        </section>
      ) : null}

      {banner ? (
        <div
          className={cn(
            "mt-4 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm",
            banner.kind === "ok"
              ? L
                ? "border-emerald-800/53 bg-emerald-50 text-emerald-950"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
              : L
                ? "border-red-500/73 bg-red-50 text-red-900"
                : "border-red-500/40 bg-red-500/10 text-red-200",
          )}
        >
          <span>{banner.text}</span>
          <button type="button" className="shrink-0 text-xs underline opacity-80 hover:opacity-100" onClick={() => setBanner(null)}>
            Kapat
          </button>
        </div>
      ) : null}

      {err ? <p className={cn("mt-6 text-sm", L ? "text-red-800" : "text-red-300")}>{err}</p> : null}

      <ul className="mt-8 space-y-4">
        {posts.length === 0 && !err ? (
          <li className={cn("text-sm", L ? "text-stone-600" : "text-zinc-500")}>Henüz paylaşım yok. Yukarıdan yeni paylaşım ekleyebilirsin.</li>
        ) : null}
        {posts.map((p) => {
          const before = p.media?.beforeGallery ?? [];
          const after = p.media?.afterGallery ?? [];
          return (
            <li
              key={p.publicId}
              className={cn(
                "rounded-2xl border p-4 sm:p-5",
                L ? "border-orange-200/92 bg-white/98 shadow-[0_10px_36px_-20px_rgba(249,115,22,0.14)]" : "border-white/10 bg-pf-card/40",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className={cn("text-xs font-bold", L ? "text-orange-900" : "text-pf-orange-bright")}>{p.periodLabel ?? "—"}</p>
                  <h2 className={cn("font-display text-lg font-bold", L ? "text-stone-900" : "text-white")}>{p.heading || "Paylaşım"}</h2>
                  <p className={cn("text-xs", L ? "text-stone-600" : "text-zinc-500")}>{new Date(p.createdAtUtc).toLocaleString("tr-TR")}</p>
                  <p className={cn("mt-1 text-xs", L ? "text-stone-700" : "text-zinc-400")}>
                    Durum: <span className={cn("font-medium", L ? "text-stone-900" : "text-zinc-200")}>{moderationLabel(p.moderationStatus)}</span>
                    {p.moderationNote ? (
                      <span className={cn("block", L ? "text-stone-600" : "text-zinc-500")}>Not: {p.moderationNote}</span>
                    ) : null}
                  </p>
                  <p className={cn("mt-2 text-xs", L ? "text-stone-600" : "text-zinc-500")}>
                    Ana vitrin: {p.showOnPublicHomeSpotlight ? "Evet" : "Hayır"} · Topluluk akışı: {p.showInMainCommunityFeed ? "Evet" : "Hayır"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void openEdit(p.publicId)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50",
                      L
                        ? "border-orange-950/28 text-stone-900 hover:bg-orange-50"
                        : "border-white/15 text-white hover:bg-white/10",
                    )}
                  >
                    Düzenle
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void deletePost(p.publicId)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50",
                      L ? "border-red-700/55 text-red-800 hover:bg-red-50" : "border-red-500/40 text-red-300 hover:bg-red-500/10",
                    )}
                  >
                    Sil
                  </button>
                </div>
              </div>
              {(before.length > 0 || after.length > 0) && (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500">Başlangıç</p>
                    <div className="flex flex-wrap gap-1">
                      {before.slice(0, 4).map((a, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={resolveMediaUrl(a.url)} alt="" className="h-16 w-16 rounded-lg border border-white/10 object-cover sm:h-20 sm:w-20" />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500">Güncel</p>
                    <div className="flex flex-wrap gap-1">
                      {after.slice(0, 4).map((a, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={resolveMediaUrl(a.url)} alt="" className="h-16 w-16 rounded-lg border border-white/10 object-cover sm:h-20 sm:w-20" />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {p.body?.trim() ? <p className={cn("mt-3 whitespace-pre-wrap text-sm", L ? "text-stone-700" : "text-zinc-300")}>{p.body}</p> : null}
            </li>
          );
        })}
      </ul>

      {editOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="ba-edit-title">
          <div
            className={cn(
              "max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border p-4 shadow-2xl sm:rounded-2xl sm:p-6",
              L ? "border-orange-200/90 bg-orange-50/98" : "border-white/10 bg-[#101010]",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 id="ba-edit-title" className={cn("font-display text-lg font-bold", L ? "text-stone-900" : "text-white")}>Paylaşımı düzenle</h2>
              <button
                type="button"
                onClick={() => closeEdit()}
                className={cn(
                  "rounded-lg px-2 py-1 text-sm",
                  L ? "text-stone-600 hover:bg-white hover:text-orange-950" : "text-zinc-400 hover:bg-white/10 hover:text-white",
                )}
              >
                Kapat
              </button>
            </div>
            {editLoadErr ? (
              <p className={cn("mt-3 text-sm", L ? "text-red-800" : "text-red-300")}>{editLoadErr}</p>
            ) : null}
            {editDto ? (
              <>
                {formErr ? <p className={cn("mt-3 text-sm", L ? "text-red-800" : "text-red-300")}>{formErr}</p> : null}
                <div className="mt-4">
                  <BeforeAfterFormFields
                    heading={heading}
                    setHeading={setHeading}
                    periodDateFrom={periodDateFrom}
                    setPeriodDateFrom={setPeriodDateFrom}
                    periodDateTo={periodDateTo}
                    setPeriodDateTo={setPeriodDateTo}
                    periodDurationValue={periodDurationValue}
                    setPeriodDurationValue={setPeriodDurationValue}
                    periodExtra={periodExtra}
                    setPeriodExtra={setPeriodExtra}
                    periodPreview={periodPreview}
                    body={body}
                    setBody={setBody}
                    showSpotlight={showSpotlight}
                    setShowSpotlight={setShowSpotlight}
                    showInFeed={showInFeed}
                    setShowInFeed={setShowInFeed}
                    beforeFiles={beforeFiles}
                    setBeforeFiles={setBeforeFiles}
                    afterFiles={afterFiles}
                    setAfterFiles={setAfterFiles}
                    existingBeforeUrls={editDto.existingBeforeUrls}
                    existingAfterUrls={editDto.existingAfterUrls}
                    replaceHint
                  />
                </div>
                <div className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-4">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void submitUpdate()}
                    className="rounded-xl bg-pf-orange-bright px-4 py-2 text-sm font-bold text-black hover:opacity-95 disabled:opacity-50"
                  >
                    Kaydet
                  </button>
                  <button type="button" disabled={busy} onClick={() => closeEdit()} className="rounded-xl border border-white/15 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5">
                    Vazgeç
                  </button>
                </div>
              </>
            ) : !editLoadErr ? (
              <p className="mt-4 text-sm text-zinc-500">Yükleniyor…</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
