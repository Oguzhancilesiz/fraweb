"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { resolveMediaUrl } from "@/lib/media";
import type { CommunityLikeUserJson } from "./community-feed-types";

type Props = {
  token: string;
  title: string;
  url: string;
  onClose: () => void;
};

export function CommunityFeedLikersModal({ token, title, url, onClose }: Props) {
  const [users, setUsers] = useState<CommunityLikeUserJson[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let c = false;
    void (async () => {
      const r = await apiFetch<{ ok: boolean; users: CommunityLikeUserJson[] }>(url, { accessToken: token });
      if (c) return;
      if (!r.ok) {
        setErr(r.message);
        setUsers([]);
        return;
      }
      setErr(null);
      setUsers(r.data.users ?? []);
    })();
    return () => {
      c = true;
    };
  }, [token, url]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="likers-title">
      <button type="button" className="absolute inset-0 bg-black/60" aria-label="Kapat" onClick={onClose} />
      <div className="relative z-10 max-h-[70vh] w-full max-w-sm overflow-hidden rounded-t-2xl border border-white/10 bg-pf-raised shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 id="likers-title" className="text-sm font-bold text-white">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-zinc-400 hover:bg-white/10 hover:text-white">
            ✕
          </button>
        </div>
        <ul className="max-h-[55vh] overflow-y-auto p-2">
          {err ? <li className="px-2 py-4 text-center text-xs text-red-300">{err}</li> : null}
          {!err && users === null ? <li className="px-2 py-8 text-center text-xs text-zinc-500">Yükleniyor…</li> : null}
          {users && !users.length && !err ? <li className="px-2 py-8 text-center text-xs text-zinc-500">Henüz beğeni yok.</li> : null}
          {users?.map((u) => {
            const photo = resolveMediaUrl(u.photoUrl);
            return (
              <li key={u.userId} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-pf-void/50">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-pf-orange/20 text-xs font-bold text-pf-orange-bright">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (u.displayName || "?")[0]
                  )}
                </div>
                <span className="text-sm text-zinc-200">{u.displayName}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
