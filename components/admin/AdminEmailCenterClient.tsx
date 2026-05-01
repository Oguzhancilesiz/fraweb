"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import { routes } from "@/lib/site";
import {
  DashboardShell,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SectionCard,
} from "@/components/dashboard/DashboardUI";
import { AdminPager } from "./AdminPager";
import { fmtDate } from "./AdminShared";

type TemplateItem = {
  key: string;
  displayName: string;
  category: string;
  isActive: boolean;
  updatedAtUtc: string;
};

type AutomationPrefs = {
  packageExpiryReminderDaysBefore: number;
  monthlyDraftReminderFromDayOfMonth: number;
  enablePackageExpiryReminders: boolean;
  enableMonthlyDraftReminders: boolean;
};

type Overview = { templates: TemplateItem[]; automation: AutomationPrefs };

export function AdminEmailCenterClient() {
  const { ready, token } = useAuth();
  const [tab, setTab] = useState<"overview" | "broadcast" | "log">("overview");

  /** Genel yükleme / otomasyon / şablonlar */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [autoDraft, setAutoDraft] = useState<AutomationPrefs | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  /** Şablon seçimi — tam düzenleme */
  const [tplKeyEditing, setTplKeyEditing] = useState<string | null>(null);
  const [tplBody, setTplBody] = useState<Record<string, string> | null>(null);
  const [tplLoading, setTplLoading] = useState(false);

  /** Yayın formu */
  const [broadcastAudience, setBroadcastAudience] = useState("0");
  const [broadcastEmails, setBroadcastEmails] = useState("");
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastHtml, setBroadcastHtml] = useState("");
  const [busyBroadcast, setBusyBroadcast] = useState(false);

  /** Gönderim günlüğü */
  const [logPage, setLogPage] = useState(1);
  const [logLoading, setLogLoading] = useState(false);
  const [logData, setLogData] = useState<{ totalCount: number; items: Array<Record<string, unknown>> } | null>(null);

  async function loadOverview() {
    if (!token) return;
    setLoading(true);
    const r = await apiFetch<Overview>("/api/v1/admin/email-center/overview", { accessToken: token });
    setLoading(false);
    if (!r.ok) {
      setError(r.message);
      setOverview(null);
    } else {
      setError(null);
      setOverview(r.data ?? null);
      if (r.data?.automation) setAutoDraft(r.data.automation);
    }
  }

  useEffect(() => {
    if (!ready || !token) return;
    void loadOverview();
  }, [ready, token]);

  useEffect(() => {
    if (!ready || !token || tab !== "log") return;
    let cancelled = false;
    void (async () => {
      setLogLoading(true);
      const qs = new URLSearchParams({
        page: String(logPage),
        pageSize: "25",
      });
      const r = await apiFetch<{ totalCount: number; items: Array<Record<string, unknown>> }>(
        `/api/v1/admin/email-center/send-log?${qs}`,
        { accessToken: token },
      );
      if (cancelled) return;
      if (!r.ok) setLogData(null);
      else setLogData(r.data ?? null);
      setLogLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, token, tab, logPage]);

  async function saveAutomation() {
    if (!token || !autoDraft) return;
    const r = await apiFetch("/api/v1/admin/email-center/automation", {
      method: "PUT",
      accessToken: token,
      body: JSON.stringify(autoDraft),
    });
    if (!r.ok) alert(r.message);
    else {
      setToast("Otomasyon kaydedildi.");
      await loadOverview();
    }
  }

  async function openTemplateEditor(key: string) {
    if (!token) return;
    setTplLoading(true);
    setTplKeyEditing(key);
    const r = await apiFetch<Record<string, unknown>>(`/api/v1/admin/email-center/templates/${encodeURIComponent(key)}`, {
      accessToken: token,
    });
    setTplLoading(false);
    if (!r.ok) {
      alert(r.message);
      setTplBody(null);
    } else {
      const row = r.data!;
      setTplBody({
        key: String(row.key ?? key),
        displayName: String(row.displayName ?? ""),
        category: String(row.category ?? ""),
        subject: String(row.subject ?? ""),
        bodyHtml: String(row.bodyHtml ?? ""),
      });
    }
  }

  async function saveTemplate() {
    if (!token || !tplBody?.key) return;
    const r = await apiFetch(`/api/v1/admin/email-center/templates/${encodeURIComponent(tplBody.key)}`, {
      method: "PUT",
      accessToken: token,
      body: JSON.stringify({
        key: tplBody.key,
        displayName: tplBody.displayName,
        category: tplBody.category,
        subject: tplBody.subject,
        bodyHtml: tplBody.bodyHtml,
        isActive: true,
      }),
    });
    if (!r.ok) alert(r.message);
    else {
      setTplKeyEditing(null);
      setTplBody(null);
      await loadOverview();
      setToast("Şablon kaydedildi.");
    }
  }

  async function sendBroadcast() {
    if (!token) return;
    setBusyBroadcast(true);
    const r = await apiFetch<{ message?: string }>("/api/v1/admin/email-center/broadcast", {
      method: "POST",
      accessToken: token,
      body: JSON.stringify({
        audience: Number(broadcastAudience),
        toEmailsRaw: broadcastAudience === "0" ? broadcastEmails || null : null,
        subject: broadcastSubject,
        htmlBody: broadcastHtml,
      }),
    });
    setBusyBroadcast(false);
    if (!r.ok) alert(r.message);
    else setToast((r.data && r.data.message) || "Tamam.");
  }

  if (!ready || loading) return <LoadingState label="E-posta merkezi yükleniyor..." />;
  if (error && !overview) return <ErrorState message={error} />;

  const tpl = overview?.templates ?? [];

  return (
    <DashboardShell>
      <PageHeader
        eyebrow="Yönetim"
        title="E-posta merkezi"
        lead="/api/v1/admin/email-center/*"
        actions={
          <Link href={routes.admin} className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/5">
            ← Özet
          </Link>
        }
      />

      <div className="mb-4 flex gap-2">
        {(
          [
            ["overview", "Otomasyon & şablonlar"],
            ["broadcast", "Toplu yayın"],
            ["log", "Gönderim günlüğü"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`rounded-full px-4 py-2 text-xs font-semibold ${
              tab === k ? "bg-pf-orange text-black" : "border border-white/15 text-zinc-200 hover:bg-white/5"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {toast ? <p className="mb-3 text-xs text-emerald-400">{toast}</p> : null}

      {tab === "overview" ? (
        <>
          <SectionCard title="Otomasyon tercihleri">
            {!autoDraft ? (
              <EmptyState title="Özet yüklenemedi" message="Otomasyon blokları bu özetten doldurulur." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs text-zinc-400">
                  Paket bitiş uyarısı (gün önce)
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={autoDraft.packageExpiryReminderDaysBefore}
                    onChange={(e) =>
                      setAutoDraft({ ...autoDraft, packageExpiryReminderDaysBefore: Number(e.target.value) })
                    }
                    className="rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-white"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-zinc-400">
                  Taslak hatırlatması (ayı günü)
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={autoDraft.monthlyDraftReminderFromDayOfMonth}
                    onChange={(e) =>
                      setAutoDraft({ ...autoDraft, monthlyDraftReminderFromDayOfMonth: Number(e.target.value) })
                    }
                    className="rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-white"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-300 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={autoDraft.enablePackageExpiryReminders}
                    onChange={(e) => setAutoDraft({ ...autoDraft, enablePackageExpiryReminders: e.target.checked })}
                  />{" "}
                  Paket bitiş e-postaları
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-300 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={autoDraft.enableMonthlyDraftReminders}
                    onChange={(e) => setAutoDraft({ ...autoDraft, enableMonthlyDraftReminders: e.target.checked })}
                  />{" "}
                  Aylık taslak hatırlatmaları
                </label>
              </div>
            )}
            <button
              type="button"
              onClick={() => void saveAutomation()}
              className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white"
            >
              Otomasyon kaydet
            </button>
          </SectionCard>

          <SectionCard title="Şablonlar">
            {tpl.length === 0 ? (
              <EmptyState title="Şablon yok" message="Veritabanında e-posta şablonu kaydı yok." />
            ) : (
              <div className="divide-y divide-white/10 rounded-2xl border border-white/10">
                {tpl.map((t) => (
                  <div key={t.key} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2">
                    <div>
                      <p className="font-semibold text-zinc-100">{t.displayName}</p>
                      <p className="font-mono text-xs text-zinc-500">
                        {t.key} • {t.category}
                      </p>
                      <p className="text-[11px] text-zinc-600">Son günc.: {fmtDate(t.updatedAtUtc)}</p>
                    </div>
                    <button
                      type="button"
                      className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-200"
                      onClick={() => void openTemplateEditor(t.key)}
                    >
                      HTML düzenle
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {tplKeyEditing ? (
            <div className="fixed inset-0 z-[101] bg-black/80 p-4">
              <div className="mx-auto mt-[5vh] max-h-[85vh] max-w-3xl overflow-y-auto rounded-2xl border border-white/15 bg-[#111] p-4">
                <h3 className="font-display text-lg text-white">Şablon düzenle: {tplKeyEditing}</h3>
                {tplLoading || !tplBody ? (
                  <LoadingState label="Şablon yükleniyor..." />
                ) : (
                  <>
                    <div className="mt-4 space-y-3">
                      <label className="block text-xs text-zinc-500">
                        Görünen ad
                        <input
                          className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-white"
                          value={tplBody.displayName}
                          onChange={(e) => setTplBody({ ...tplBody, displayName: e.target.value })}
                        />
                      </label>
                      <label className="block text-xs text-zinc-500">
                        Konu
                        <input
                          className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-white"
                          value={tplBody.subject}
                          onChange={(e) => setTplBody({ ...tplBody, subject: e.target.value })}
                        />
                      </label>
                      <label className="block text-xs text-zinc-500">
                        Gövde (HTML)
                        <textarea
                          rows={12}
                          className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 font-mono text-sm text-emerald-200"
                          value={tplBody.bodyHtml}
                          onChange={(e) => setTplBody({ ...tplBody, bodyHtml: e.target.value })}
                        />
                      </label>
                    </div>
                    <div className="mt-6 flex gap-2">
                      <button
                        type="button"
                        className="rounded-xl border border-white/20 px-4 py-2 text-sm text-zinc-300"
                        onClick={() => {
                          setTplKeyEditing(null);
                          setTplBody(null);
                        }}
                      >
                        Vazgeç
                      </button>
                      <button type="button" className="rounded-xl bg-pf-orange px-4 py-2 text-sm font-bold text-black" onClick={() => void saveTemplate()}>
                        Kaydet
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {tab === "broadcast" ? (
        <SectionCard title="Toplu yayın (broadcast)">
          <label className="block text-xs text-zinc-500">
            Alıcı kitlesi (AdminEmailBroadcastAudience)
            <select
              className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 px-2 py-2 text-sm text-white"
              value={broadcastAudience}
              onChange={(e) => setBroadcastAudience(e.target.value)}
            >
              <option value="0">Manuel liste (metin kutusuna yaz)</option>
              <option value="1">Tüm doğrulanmış öğrenciler</option>
              <option value="2">Tüm doğrulanmış koçlar</option>
              <option value="3">Tüm doğrulanmış kullanıcılar</option>
            </select>
          </label>

          <label className="mt-4 block text-xs text-zinc-500">
            Manuel liste e-postaları (virgül / satır ile)
            <textarea
              rows={4}
              disabled={broadcastAudience !== "0"}
              className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 font-mono text-xs text-emerald-200 disabled:opacity-40"
              value={broadcastEmails}
              onChange={(e) => setBroadcastEmails(e.target.value)}
            />
          </label>

          <label className="mt-4 block text-xs text-zinc-500">
            Konu
            <input
              className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-white"
              value={broadcastSubject}
              onChange={(e) => setBroadcastSubject(e.target.value)}
            />
          </label>

          <label className="mt-4 block text-xs text-zinc-500">
            HTML gövde
            <textarea
              rows={10}
              className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 font-mono text-sm text-emerald-200"
              value={broadcastHtml}
              onChange={(e) => setBroadcastHtml(e.target.value)}
            />
          </label>

          <button
            type="button"
            disabled={busyBroadcast || !broadcastSubject.trim()}
            className="mt-4 w-full rounded-xl bg-pf-orange px-4 py-3 text-sm font-black text-black disabled:opacity-50"
            onClick={() => void sendBroadcast()}
          >
            Yayını gönder
          </button>
        </SectionCard>
      ) : null}

      {tab === "log" ? (
        <SectionCard title={`Gönderim günlüğü (${logData?.totalCount ?? "…"} kayıt)`}>
          {logLoading ? <LoadingState label="Günlük yükleniyor..." /> : null}
          {!logLoading && logData?.items?.length === 0 ? (
            <EmptyState title="Günlük yok" message="Henüz gönderim kaydı yok veya sayfa boş." />
          ) : !logLoading && logData ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-zinc-500">
                    <tr className="border-b border-white/10">
                      <th className="pb-2 pr-2">Tarih</th>
                      <th className="pb-2 pr-2">Şablon</th>
                      <th className="pb-2 pr-2">Alıcı</th>
                      <th className="pb-2">Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logData.items.map((x) => (
                      <tr key={String(x.id)} className="border-t border-white/5 text-zinc-300">
                        <td className="py-2 pr-2">{fmtDate(x.sentAtUtc as string)}</td>
                        <td className="py-2 pr-2">{String(x.templateKey ?? "")}</td>
                        <td className="py-2 pr-2">{String(x.toEmail ?? "")}</td>
                        <td className="py-2">{x.success === true ? "Başarı" : "Başarısız"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <AdminPager
                page={logPage}
                pageSize={25}
                totalCount={logData.totalCount}
                onPageChange={(p) => setLogPage(p)}
              />
            </>
          ) : null}
        </SectionCard>
      ) : null}
    </DashboardShell>
  );
}
