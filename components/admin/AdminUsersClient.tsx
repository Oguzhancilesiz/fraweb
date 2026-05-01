"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import { routes } from "@/lib/site";
import {
  Badge,
  DashboardShell,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SectionCard,
} from "@/components/dashboard/DashboardUI";
import { AdminPager } from "./AdminPager";
import { AdminUsersResultJson, fmtDate } from "./AdminShared";

const ROLE_OPTS = ["", "Student", "Coach", "Admin", "SuperAdmin"];

export function AdminUsersClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = "/admin/kullanicilar";
  const { ready, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AdminUsersResultJson | null>(null);

  const page = Math.max(1, Number(sp.get("page") ?? "1") || 1);
  const pageSize = Math.min(100, Math.max(10, Number(sp.get("pageSize") ?? "25") || 25));
  const roleName = sp.get("roleName")?.trim() ?? "";
  const emailContains = sp.get("emailContains")?.trim() ?? "";

  const query = useMemo(() => {
    const q = new URLSearchParams();
    q.set("page", String(page));
    q.set("pageSize", String(pageSize));
    if (roleName) q.set("roleName", roleName);
    if (emailContains) q.set("emailContains", emailContains);
    return q.toString();
  }, [emailContains, roleName, page, pageSize]);

  function mergeQuery(updates: Record<string, string | null | undefined>, resetPage?: boolean) {
    const q = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === undefined) continue;
      if (v === null || v === "") q.delete(k);
      else q.set(k, v);
    }
    if (resetPage) q.set("page", "1");
    router.replace(`${pathname}?${q}`);
  }

  useEffect(() => {
    if (!ready || !token) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const r = await apiFetch<AdminUsersResultJson>(`/api/v1/admin/users?${query}`, { accessToken: token });
      if (cancelled) return;
      if (!r.ok) {
        setError(r.message);
        setData(null);
      } else {
        setError(null);
        setData(r.data);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, token, query]);

  if (!ready || !token || loading) return <LoadingState label="Kullanıcılar yükleniyor..." />;
  if (error) return <ErrorState message={error} />;

  const items = data?.items ?? [];
  const total = data?.totalCount ?? 0;

  return (
    <DashboardShell>
      <PageHeader
        eyebrow="Yönetim"
        title="Kullanıcılar"
        lead="`/api/v1/admin/users` kullanıcı dizini (sayfalı)."
        actions={
          <Link href={routes.admin} className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/5">
            ← Özet
          </Link>
        }
      />

      <SectionCard title="Filtre">
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Rol
            <select
              className="rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-zinc-100"
              value={roleName}
              onChange={(e) => mergeQuery({ roleName: e.target.value || null }, true)}
            >
              {ROLE_OPTS.map((r) => (
                <option key={r || "__all"} value={r}>
                  {r === "" ? "Tümü" : r}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            E-posta içerir
            <input
              className="min-w-[200px] rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-zinc-100"
              defaultValue={emailContains}
              onBlur={(e) => mergeQuery({ emailContains: e.target.value.trim() || null }, true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") mergeQuery({ emailContains: (e.target as HTMLInputElement).value.trim() || null }, true);
              }}
            />
          </label>
        </div>
      </SectionCard>

      <SectionCard title={`Sonuç: ${total} kullanıcı`}>
        {items.length === 0 ? (
          <EmptyState title="Kullanıcı bulunamadı" message="Filtreyi gevşetip tekrar deneyin." />
        ) : (
          <div className="space-y-3">
            {items.map((u) => (
              <article key={u.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={routes.adminUser(u.id)}
                      className="text-sm font-semibold text-white hover:text-pf-orange-bright hover:underline"
                    >
                      {u.fullName || "İsimsiz kullanıcı"}
                    </Link>
                    <p className="text-xs text-zinc-400">{u.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {u.isActive ? <Badge tone="success">Aktif</Badge> : <Badge tone="error">Pasif</Badge>}
                    {u.roles.map((r) => (
                      <Badge key={r} tone={r.includes("Admin") ? "orange" : "neutral"}>
                        {r}
                      </Badge>
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  Son giriş: {fmtDate(u.lastLoginAtUtc)} ·{" "}
                  <Link className="font-semibold text-pf-orange-bright hover:underline" href={routes.adminUser(u.id)}>
                    profil →
                  </Link>
                </p>
              </article>
            ))}
          </div>
        )}
        <AdminPager page={page} pageSize={pageSize} totalCount={total} onPageChange={(p) => mergeQuery({ page: String(p) })} />
      </SectionCard>
    </DashboardShell>
  );
}
