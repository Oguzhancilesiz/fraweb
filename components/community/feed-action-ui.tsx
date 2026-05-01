/** Ortak: akış gönderisi ve yorum satırı aksiyon pill’leri. */

export const feedActionPill =
  "inline-flex min-h-[2.35rem] shrink-0 select-none items-center justify-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-pf-orange/45 focus-visible:ring-offset-2 disabled:opacity-45 sm:px-3 sm:text-xs";

export const feedPillNeutral = `${feedActionPill} border-white/18 bg-pf-raised/60 text-zinc-200 hover:border-white/28 hover:bg-pf-raised hover:text-white focus-visible:ring-offset-pf-void`;

export const feedPillNeutralLight = `${feedActionPill} border-orange-900/17 bg-white text-stone-800 shadow-sm hover:border-orange-950/36 hover:bg-orange-50 focus-visible:ring-offset-orange-50`;

export const feedPillLikeOn = `${feedActionPill} border-pf-orange/50 bg-pf-orange/14 text-pf-orange-bright hover:border-pf-orange/70 hover:bg-pf-orange/22 focus-visible:ring-offset-pf-void`;

export const feedPillLikeOnLight = `${feedActionPill} border-orange-800/52 bg-orange-50 text-orange-950 hover:border-orange-800/74 hover:bg-orange-100 focus-visible:ring-offset-orange-50`;

export const feedPillSaveOn = `${feedActionPill} border-amber-400/45 bg-amber-500/12 text-amber-100 hover:border-amber-300/55 hover:bg-amber-500/18 focus-visible:ring-offset-pf-void`;

export const feedPillSaveOnLight = `${feedActionPill} border-amber-800/37 bg-amber-50 text-amber-950 hover:bg-amber-100 focus-visible:ring-offset-orange-50`;

export const feedPillCommentsOn = `${feedActionPill} border-sky-400/35 bg-sky-500/10 text-sky-100 hover:border-sky-300/50 hover:bg-sky-500/16 focus-visible:ring-offset-pf-void`;

export const feedPillCommentsOnLight = `${feedActionPill} border-sky-800/41 bg-sky-50 text-sky-950 hover:bg-sky-100 focus-visible:ring-offset-orange-50`;

export const feedPillSecondary = `${feedActionPill} border-white/14 bg-pf-void/90 text-zinc-300 hover:border-pf-orange/35 hover:text-pf-orange-bright focus-visible:ring-offset-pf-void`;

export const feedPillSecondaryLight = `${feedActionPill} border-orange-950/29 bg-orange-50/93 text-orange-950 hover:border-pf-orange/44 hover:bg-white focus-visible:ring-offset-orange-50`;

export function IconHeart({ filled, className = "h-4 w-4" }: { filled: boolean; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      />
    </svg>
  );
}

export function IconChatBubble({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

export function IconBookmark({ filled, className = "h-4 w-4" }: { filled: boolean; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function IconUsers({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

/** Yorum satırı — küçük metin aksiyonları (Instagram benzeri). */
export const commentActionBtn =
  "inline-flex items-center gap-0.5 rounded-md border-0 bg-transparent px-0 py-0.5 text-[11px] font-semibold text-zinc-400 transition hover:text-white disabled:opacity-40";

export const commentActionBtnActive = "text-white";

export const commentActionBtnLight =
  "inline-flex items-center gap-0.5 rounded-md border-0 bg-transparent px-0 py-0.5 text-[11px] font-semibold text-stone-600 transition hover:text-stone-900 disabled:opacity-40";

export const commentActionBtnActiveLight = "text-stone-900 font-bold";
