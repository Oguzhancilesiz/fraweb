"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import { canAccessCoachArea, primaryDashboardPath } from "@/lib/auth/paths";
import { PageHeader } from "@/components/PageHeader";
import { routes } from "@/lib/site";
import { resolveMediaUrl } from "@/lib/media";

type Item = {
  id: number;
  name: string;
  categoryName?: string | null;
  muscleGroup?: string | null;
  bodyRegion: number;
  movementKind: number;
  isActive: boolean;
  thumbnailPath?: string | null;
};

type ListJson = {
  items: Item[];
  activeExerciseCount: number;
  passiveExerciseCount: number;
  filters: { categoryId?: number | null; bodyRegion?: number | null; movementKind?: number | null; q?: string; includeInactive: boolean };
};

type CategoryOption = {
  id: number;
  displayName: string;
  sortOrder: number;
};

type ExerciseDetail = {
  id: number;
  categoryId: number;
  name: string;
  description?: string | null;
  detailedDescription?: string | null;
  coachInternalNote?: string | null;
  muscleGroup?: string | null;
  equipment?: string | null;
  difficultyLevel?: string | null;
  videoUrl?: string | null;
  imagePath?: string | null;
  bodyRegion: number;
  movementKind: number;
  isActive: boolean;
};

type SavePayload = {
  categoryId: number;
  name: string;
  description?: string | null;
  detailedDescription?: string | null;
  coachInternalNote?: string | null;
  muscleGroup?: string | null;
  equipment?: string | null;
  difficultyLevel?: string | null;
  videoUrl?: string | null;
  bodyRegion: number;
  movementKind: number;
  isActive: boolean;
};

type FormState = {
  categoryId: string;
  name: string;
  description: string;
  detailedDescription: string;
  coachInternalNote: string;
  muscleGroup: string;
  equipment: string;
  difficultyLevel: string;
  videoUrl: string;
  bodyRegion: string;
  movementKind: string;
  isActive: boolean;
};

const BODY_REGION_OPTIONS = [
  { value: 0, label: "Seçilmedi" },
  { value: 1, label: "Göğüs" },
  { value: 2, label: "Sırt" },
  { value: 3, label: "Omuz" },
  { value: 4, label: "Kol" },
  { value: 5, label: "Bacak" },
  { value: 6, label: "Kalça / glute" },
  { value: 7, label: "Core / karın" },
  { value: 8, label: "Tüm vücut" },
  { value: 9, label: "Kardiyo" },
] as const;

const MOVEMENT_KIND_OPTIONS = [
  { value: 0, label: "Seçilmedi" },
  { value: 1, label: "Bileşik" },
  { value: 2, label: "İzolasyon" },
  { value: 3, label: "Esneme / mobilite" },
  { value: 4, label: "Pliometrik" },
  { value: 5, label: "Kardiyo / kondisyon" },
  { value: 6, label: "Isınma" },
] as const;

const EMPTY_FORM: FormState = {
  categoryId: "",
  name: "",
  description: "",
  detailedDescription: "",
  coachInternalNote: "",
  muscleGroup: "",
  equipment: "",
  difficultyLevel: "",
  videoUrl: "",
  bodyRegion: "0",
  movementKind: "0",
  isActive: true,
};

export function CoachExerciseLibraryClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const { token, ready, user } = useAuth();
  const [data, setData] = useState<ListJson | null>(null);
  const [cats, setCats] = useState<CategoryOption[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const qStr = (() => {
    const p = new URLSearchParams();
    const q = sp.get("q")?.trim();
    const cid = sp.get("categoryId");
    const br = sp.get("bodyRegion");
    const mk = sp.get("movementKind");
    const inc = sp.get("includeInactive") === "1";
    if (q) p.set("q", q);
    if (cid) p.set("categoryId", cid);
    if (br) p.set("bodyRegion", br);
    if (mk) p.set("movementKind", mk);
    if (inc) p.set("includeInactive", "true");
    return p.toString();
  })();

  const load = useCallback(async () => {
    if (!token) return;
    const path = qStr ? `/api/v1/coach/exercise-library?${qStr}` : "/api/v1/coach/exercise-library";
    const [listRes, catRes] = await Promise.all([
      apiFetch<ListJson>(path, { accessToken: token }),
      apiFetch<CategoryOption[]>("/api/v1/coach/exercise-library/categories", { accessToken: token }),
    ]);
    if (!listRes.ok) {
      setErr(listRes.message);
      setData(null);
      return;
    }
    if (!catRes.ok) {
      setErr(catRes.message);
      setData(null);
      return;
    }
    setErr(null);
    setData(listRes.data);
    setCats(catRes.data ?? []);
  }, [token, qStr]);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace(`${routes.login}?returnUrl=${encodeURIComponent(routes.coachExercises)}`);
      return;
    }
    if (!canAccessCoachArea(user?.roles)) {
      router.replace(primaryDashboardPath(user?.roles ?? []) ?? routes.home);
      return;
    }
    let c = false;
    void (async () => {
      setLoading(true);
      await load();
      if (!c) setLoading(false);
    })();
    return () => {
      c = true;
    };
  }, [ready, token, user, router, load]);

  const apply = (patch: Record<string, string | null>) => {
    const n = new URLSearchParams(sp.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (v == null || v === "") n.delete(k);
      else n.set(k, v);
    });
    router.push(n.toString() ? `${routes.coachExercises}?${n}` : routes.coachExercises);
  };

  const resetForm = useCallback(() => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview(null);
  }, []);

  const openCreate = () => {
    resetForm();
    if (cats[0]) setForm((f) => ({ ...f, categoryId: String(cats[0].id) }));
    setPanelOpen(true);
  };

  const openEdit = async (id: number) => {
    if (!token) return;
    setBusy(true);
    const r = await apiFetch<ExerciseDetail>(`/api/v1/coach/exercise-library/${id}`, { accessToken: token });
    setBusy(false);
    if (!r.ok) {
      setErr(r.message);
      return;
    }
    const d = r.data;
    setEditingId(id);
    setForm({
      categoryId: String(d.categoryId),
      name: d.name ?? "",
      description: d.description ?? "",
      detailedDescription: d.detailedDescription ?? "",
      coachInternalNote: d.coachInternalNote ?? "",
      muscleGroup: d.muscleGroup ?? "",
      equipment: d.equipment ?? "",
      difficultyLevel: d.difficultyLevel ?? "",
      videoUrl: d.videoUrl ?? "",
      bodyRegion: String(d.bodyRegion ?? 0),
      movementKind: String(d.movementKind ?? 0),
      isActive: !!d.isActive,
    });
    setImageFile(null);
    setImagePreview(resolveMediaUrl(d.imagePath));
    setPanelOpen(true);
  };

  const toPayload = (): SavePayload => ({
    categoryId: Number(form.categoryId || 0),
    name: form.name.trim(),
    description: form.description.trim() || null,
    detailedDescription: form.detailedDescription.trim() || null,
    coachInternalNote: form.coachInternalNote.trim() || null,
    muscleGroup: form.muscleGroup.trim() || null,
    equipment: form.equipment.trim() || null,
    difficultyLevel: form.difficultyLevel.trim() || null,
    videoUrl: form.videoUrl.trim() || null,
    bodyRegion: Number(form.bodyRegion || 0),
    movementKind: Number(form.movementKind || 0),
    isActive: form.isActive,
  });

  const save = async () => {
    if (!token) return;
    if (!form.name.trim()) {
      setErr("Egzersiz adı zorunlu.");
      return;
    }
    if (!form.categoryId) {
      setErr("Kategori zorunlu.");
      return;
    }
    setBusy(true);
    const payload = toPayload();
    const req =
      editingId == null
        ? apiFetch<{ id: number }>("/api/v1/coach/exercise-library", {
            method: "POST",
            body: JSON.stringify(payload),
            accessToken: token,
          })
        : apiFetch<{ id: number }>(`/api/v1/coach/exercise-library/${editingId}`, {
            method: "PUT",
            body: JSON.stringify(payload),
            accessToken: token,
          });
    const r = await req;
    if (!r.ok) {
      setBusy(false);
      setErr(r.message);
      return;
    }
    const id = editingId ?? r.data.id;
    if (imageFile && id) {
      const fd = new FormData();
      fd.append("image", imageFile);
      const up = await apiFetch<{ id: number; imagePath?: string | null }>(`/api/v1/coach/exercise-library/${id}/image`, {
        method: "POST",
        body: fd,
        accessToken: token,
      });
      if (!up.ok) {
        setBusy(false);
        setErr(up.message);
        return;
      }
    }
    setBusy(false);
    setPanelOpen(false);
    resetForm();
    await load();
  };

  const removeExercise = async (id: number) => {
    if (!token) return;
    const ok = window.confirm("Egzersiz silinsin mi? Bu işlem geri alınamaz.");
    if (!ok) return;
    setBusy(true);
    const r = await apiFetch<{ id: number }>(`/api/v1/coach/exercise-library/${id}`, { method: "DELETE", accessToken: token });
    setBusy(false);
    if (!r.ok) {
      setErr(r.message);
      return;
    }
    await load();
  };

  const removeImage = async () => {
    if (!token || !editingId) return;
    setBusy(true);
    const r = await apiFetch<{ id: number }>(`/api/v1/coach/exercise-library/${editingId}/image`, { method: "DELETE", accessToken: token });
    setBusy(false);
    if (!r.ok) {
      setErr(r.message);
      return;
    }
    setImageFile(null);
    setImagePreview(null);
    await load();
  };

  const bodyRegionLabel = useMemo(() => Object.fromEntries(BODY_REGION_OPTIONS.map((x) => [x.value, x.label])) as Record<number, string>, []);
  const movementKindLabel = useMemo(() => Object.fromEntries(MOVEMENT_KIND_OPTIONS.map((x) => [x.value, x.label])) as Record<number, string>, []);

  if (!ready || loading) {
    return <div className="py-16 text-center text-sm text-zinc-500">Yükleniyor…</div>;
  }

  if (err || !data) {
    return (
      <div className="py-10">
        <p className="text-sm text-red-300">{err ?? "Yüklenemedi."}</p>
      </div>
    );
  }

  const items = data.items ?? [];

  return (
    <div className="py-2 lg:py-4">
      <PageHeader
        eyebrow="Operasyon"
        title="Egzersiz kütüphanesi"
        lead="MuscleWiki senkronu İngilizce isim ve adımlar getirir; Türkçe göstermek için burada adı ve açıklamaları düzenleyin. Görseller ve video bağlantıları veritabanında URL olarak saklanır — her açılışta API’ye istek atılmaz, yalnızca yönetici yenileme / TTL ile güncellenir."
      />
      <p className="text-sm text-zinc-500">
        Aktif: <span className="text-pf-green-bright">{data.activeExerciseCount}</span> · Pasif:{" "}
        <span className="text-zinc-400">{data.passiveExerciseCount}</span>
      </p>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-pf-void/40 p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          className="min-w-[200px] flex-1 rounded-lg border border-white/15 bg-pf-void px-3 py-2 text-sm text-white"
          placeholder="Ara…"
          defaultValue={sp.get("q") ?? ""}
          onBlur={(e) => apply({ q: e.target.value.trim() || null })}
        />
        <select
          className="rounded-lg border border-white/15 bg-pf-void px-3 py-2 text-sm text-white"
          value={sp.get("categoryId") ?? ""}
          onChange={(e) => apply({ categoryId: e.target.value || null })}
        >
          <option value="">Tüm kategoriler</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.displayName}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border border-white/15 bg-pf-void px-3 py-2 text-sm text-white"
          value={sp.get("bodyRegion") ?? ""}
          onChange={(e) => apply({ bodyRegion: e.target.value || null })}
        >
          <option value="">Tüm bölgeler</option>
          {BODY_REGION_OPTIONS.map((x) => (
            <option key={x.value} value={x.value}>
              {x.label}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border border-white/15 bg-pf-void px-3 py-2 text-sm text-white"
          value={sp.get("movementKind") ?? ""}
          onChange={(e) => apply({ movementKind: e.target.value || null })}
        >
          <option value="">Tüm hareket türleri</option>
          {MOVEMENT_KIND_OPTIONS.map((x) => (
            <option key={x.value} value={x.value}>
              {x.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input type="checkbox" checked={sp.get("includeInactive") === "1"} onChange={(e) => apply({ includeInactive: e.target.checked ? "1" : null })} />
          Pasifleri göster
        </label>
        <button className="rounded-lg bg-pf-orange-bright px-4 py-2 text-sm font-semibold text-black" onClick={openCreate} disabled={busy}>
          Yeni egzersiz
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-pf-void/80 text-xs font-bold uppercase text-pf-mist">
              <th className="p-3">Ad</th>
              <th className="p-3">Kategori</th>
              <th className="p-3">Kas / bölge</th>
              <th className="p-3">Durum</th>
              <th className="p-3">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-zinc-500">
                  Sonuç yok.
                </td>
              </tr>
            ) : (
              items.map((x) => (
                <tr key={x.id} className="border-b border-white/5">
                  <td className="p-3 font-medium text-white">{x.name}</td>
                  <td className="p-3 text-zinc-400">{x.categoryName ?? "—"}</td>
                  <td className="p-3 text-xs text-zinc-500">
                    {x.muscleGroup ?? "—"} · {bodyRegionLabel[x.bodyRegion] ?? "—"} · {movementKindLabel[x.movementKind] ?? "—"}
                  </td>
                  <td className="p-3">{x.isActive ? <span className="text-pf-green-bright">Aktif</span> : <span className="text-zinc-500">Pasif</span>}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button className="rounded border border-white/15 px-2 py-1 text-xs text-zinc-200" onClick={() => void openEdit(x.id)} disabled={busy}>
                        Düzenle
                      </button>
                      <button className="rounded border border-red-400/40 px-2 py-1 text-xs text-red-300" onClick={() => void removeExercise(x.id)} disabled={busy}>
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {panelOpen ? (
        <div className="fixed inset-0 z-50 bg-black/70 p-4 backdrop-blur-sm">
          <div className="mx-auto max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/15 bg-pf-card p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{editingId ? "Egzersiz düzenle" : "Yeni egzersiz"}</h2>
              <button className="rounded border border-white/15 px-2 py-1 text-xs text-zinc-300" onClick={() => setPanelOpen(false)}>
                Kapat
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input className="rounded-lg border border-white/15 bg-pf-void px-3 py-2 text-sm text-white" placeholder="Ad *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              <select className="rounded-lg border border-white/15 bg-pf-void px-3 py-2 text-sm text-white" value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
                <option value="">Kategori seç</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName}
                  </option>
                ))}
              </select>
              <select className="rounded-lg border border-white/15 bg-pf-void px-3 py-2 text-sm text-white" value={form.bodyRegion} onChange={(e) => setForm((f) => ({ ...f, bodyRegion: e.target.value }))}>
                {BODY_REGION_OPTIONS.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </select>
              <select className="rounded-lg border border-white/15 bg-pf-void px-3 py-2 text-sm text-white" value={form.movementKind} onChange={(e) => setForm((f) => ({ ...f, movementKind: e.target.value }))}>
                {MOVEMENT_KIND_OPTIONS.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </select>
              <input className="rounded-lg border border-white/15 bg-pf-void px-3 py-2 text-sm text-white" placeholder="Kas grubu" value={form.muscleGroup} onChange={(e) => setForm((f) => ({ ...f, muscleGroup: e.target.value }))} />
              <input className="rounded-lg border border-white/15 bg-pf-void px-3 py-2 text-sm text-white" placeholder="Ekipman" value={form.equipment} onChange={(e) => setForm((f) => ({ ...f, equipment: e.target.value }))} />
              <input className="rounded-lg border border-white/15 bg-pf-void px-3 py-2 text-sm text-white" placeholder="Zorluk seviyesi" value={form.difficultyLevel} onChange={(e) => setForm((f) => ({ ...f, difficultyLevel: e.target.value }))} />
              <input className="rounded-lg border border-white/15 bg-pf-void px-3 py-2 text-sm text-white" placeholder="Video URL (YouTube veya https)" value={form.videoUrl} onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))} />
              <label className="col-span-1 flex items-center gap-2 text-sm text-zinc-300 sm:col-span-2">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
                Aktif
              </label>
              <textarea className="col-span-1 min-h-[90px] rounded-lg border border-white/15 bg-pf-void px-3 py-2 text-sm text-white sm:col-span-2" placeholder="Kısa açıklama" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              <textarea className="col-span-1 min-h-[110px] rounded-lg border border-white/15 bg-pf-void px-3 py-2 text-sm text-white sm:col-span-2" placeholder="Detaylı açıklama" value={form.detailedDescription} onChange={(e) => setForm((f) => ({ ...f, detailedDescription: e.target.value }))} />
              <textarea className="col-span-1 min-h-[90px] rounded-lg border border-white/15 bg-pf-void px-3 py-2 text-sm text-white sm:col-span-2" placeholder="Koç notu" value={form.coachInternalNote} onChange={(e) => setForm((f) => ({ ...f, coachInternalNote: e.target.value }))} />

              <div className="col-span-1 sm:col-span-2">
                <p className="mb-2 text-xs text-zinc-400">Görsel</p>
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreview} alt="" className="mb-2 h-28 w-28 rounded-lg border border-white/15 object-cover" />
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setImageFile(f);
                      setImagePreview(f ? URL.createObjectURL(f) : imagePreview);
                    }}
                    className="text-xs text-zinc-300"
                  />
                  {editingId && imagePreview ? (
                    <button className="rounded border border-red-400/40 px-2 py-1 text-xs text-red-300" onClick={() => void removeImage()} disabled={busy}>
                      Görseli sil
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button className="rounded border border-white/15 px-3 py-2 text-sm text-zinc-200" onClick={() => setPanelOpen(false)}>
                Vazgeç
              </button>
              <button className="rounded bg-pf-orange-bright px-4 py-2 text-sm font-semibold text-black disabled:opacity-60" onClick={() => void save()} disabled={busy}>
                {busy ? "Kaydediliyor..." : editingId ? "Güncelle" : "Oluştur"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
