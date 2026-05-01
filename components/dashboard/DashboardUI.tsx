"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { usePanelTheme } from "@/contexts/PanelThemeContext";

/** tailwind-merge: çakışan utility sınıflarında son argüman kazanır (tema + SectionCard className). */
export function cn(...inputs: Array<string | false | null | undefined>) {
  return twMerge(inputs.filter(Boolean).join(" "));
}

function usePanelSurfaceLight() {
  const { theme, enabled } = usePanelTheme();
  return enabled && theme === "light";
}

export function DashboardShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("space-y-5 md:space-y-6", className)}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  lead,
  actions,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  actions?: ReactNode;
}) {
  const L = usePanelSurfaceLight();

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl p-5 md:p-8",
        L
          ? "border border-orange-200/70 bg-gradient-to-br from-white via-orange-50/80 to-pink-50/95 shadow-[0_1px_0_rgba(255,255,255,0.9)] shadow-orange-200/20"
          : "border border-white/10 bg-gradient-to-br from-[#111111] via-[#111111]/95 to-[#090909]",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full",
          L ? "bg-[radial-gradient(circle,rgba(251,146,60,0.22)_0%,rgba(251,146,60,0)_70%)]" : "bg-[radial-gradient(circle,rgba(249,115,22,0.25)_0%,rgba(249,115,22,0)_70%)]",
        )}
      />
      <p
        className={cn(
          "text-[11px] font-bold uppercase tracking-[0.22em]",
          L ? "text-orange-700" : "text-pf-orange-bright",
        )}
      >
        {eyebrow}
      </p>
      <h1 className={cn("mt-2 font-display text-2xl font-bold md:text-4xl", L ? "text-stone-900" : "text-zinc-100")}>{title}</h1>
      {lead ? <p className={cn("mt-2 max-w-3xl text-sm", L ? "text-stone-600" : "text-zinc-400")}>{lead}</p> : null}
      {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
    </section>
  );
}

export function SectionCard({
  title,
  action,
  children,
  className,
  id,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const L = usePanelSurfaceLight();

  return (
    <section
      id={id}
      className={cn(
        "rounded-3xl p-4 md:p-5",
        L
          ? cn(
              className,
              "border border-orange-200/65 bg-white/93 shadow-[0_14px_40px_-30px_rgba(249,115,22,0.18)] backdrop-blur-sm",
            )
          : cn("border border-white/10 bg-[rgba(255,255,255,0.04)]", className),
      )}
    >
      {title || action ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title ? (
            <h2 className={cn("font-display text-lg font-bold", L ? "text-stone-900" : "text-white")}>{title}</h2>
          ) : (
            <span />
          )}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function StatCard({ label, value, hint, tone = "default" }: { label: string; value: ReactNode; hint?: string; tone?: "default" | "orange" | "purple" | "pink" | "success" }) {
  const L = usePanelSurfaceLight();

  const toneClass =
    tone === "orange"
      ? L
        ? "border-orange-400/55"
        : "border-pf-orange/35"
      : tone === "purple"
        ? L
          ? "border-violet-400/55"
          : "border-violet-500/35"
        : tone === "pink"
          ? L
            ? "border-pink-400/55"
            : "border-pink-500/35"
          : tone === "success"
            ? L
              ? "border-emerald-400/55"
              : "border-emerald-500/35"
            : L
              ? "border-orange-100/95"
              : "border-white/10";

  return (
    <article className={cn("rounded-2xl border p-4", toneClass, L ? "bg-orange-50/55" : "bg-black/25")}>
      <p className={cn("text-xs", L ? "text-stone-600" : "text-zinc-400")}>{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold", L ? "text-stone-900" : "text-zinc-100")}>{value}</p>
      {hint ? <p className={cn("mt-1 text-xs", L ? "text-stone-500" : "text-zinc-500")}>{hint}</p> : null}
    </article>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "orange" | "purple" | "pink" | "success" | "warning" | "error" }) {
  const L = usePanelSurfaceLight();

  const classes: Record<string, string> = L
    ? {
        neutral: "border-orange-900/14 bg-orange-950/[0.04] text-stone-700",
        orange: "border-orange-600/38 bg-orange-500/14 text-orange-950",
        purple: "border-violet-600/38 bg-violet-500/12 text-violet-950",
        pink: "border-pink-600/38 bg-pink-500/12 text-pink-950",
        success: "border-emerald-600/38 bg-emerald-500/12 text-emerald-950",
        warning: "border-amber-600/38 bg-amber-400/14 text-amber-950",
        error: "border-red-600/38 bg-red-500/12 text-red-950",
      }
    : {
        neutral: "border-white/15 bg-white/5 text-zinc-300",
        orange: "border-pf-orange/40 bg-pf-orange/10 text-pf-orange-bright",
        purple: "border-violet-500/40 bg-violet-500/10 text-violet-200",
        pink: "border-pink-500/40 bg-pink-500/10 text-pink-200",
        success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
        warning: "border-amber-500/40 bg-amber-500/10 text-amber-200",
        error: "border-red-500/40 bg-red-500/10 text-red-200",
      };

  return <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-semibold", classes[tone])}>{children}</span>;
}

export function ActionCard({ title, description, href }: { title: string; description: string; href: string }) {
  const L = usePanelSurfaceLight();

  return (
    <Link
      href={href}
      className={cn(
        "rounded-2xl border p-4 transition",
        L
          ? "border-orange-800/14 bg-orange-50/45 hover:border-pf-orange/45 hover:bg-white/90 hover:shadow-md hover:shadow-orange-400/15"
          : "border-white/10 bg-black/20 hover:border-pf-orange/45 hover:bg-black/35",
      )}
    >
      <p className={cn("text-sm font-semibold", L ? "text-stone-900" : "text-zinc-100")}>{title}</p>
      <p className={cn("mt-1 text-xs", L ? "text-stone-600" : "text-zinc-400")}>{description}</p>
    </Link>
  );
}

export function LoadingState({ label = "Yükleniyor..." }: { label?: string }) {
  const L = usePanelSurfaceLight();

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-8 text-center text-sm",
        L ? "border-orange-200/90 bg-orange-50/55 text-stone-600" : "border-white/10 bg-black/20 text-zinc-400",
      )}
    >
      {label}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  const L = usePanelSurfaceLight();

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm",
        L ? "border-red-700/38 bg-red-50 text-red-900" : "border-red-500/40 bg-red-500/10 text-red-200",
      )}
    >
      {message}
    </div>
  );
}

export function EmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  const L = usePanelSurfaceLight();

  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed px-4 py-8 text-center",
        L ? "border-orange-300/70 bg-white/85" : "border-white/20 bg-black/15",
      )}
    >
      <p className={cn("text-base font-semibold", L ? "text-stone-900" : "text-zinc-100")}>{title}</p>
      <p className={cn("mt-2 text-sm", L ? "text-stone-600" : "text-zinc-400")}>{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

type BottomPanelAccent = "student" | "coach" | "admin";

export function MobileBottomNav({
  items,
  onMenuClick,
  panelAccent = "admin",
}: {
  items: Array<{ href: string; label: string; icon: ReactNode; active?: boolean; badgeCount?: number }>;
  onMenuClick: () => void;
  panelAccent?: BottomPanelAccent;
}) {
  const { theme, enabled } = usePanelTheme();
  const peach = enabled && theme === "light" && panelAccent !== "admin";

  const barTone = peach
    ? "border-t border-orange-300/45 bg-[linear-gradient(180deg,#fffdfb_0%,#fff7f2_52%,rgba(255,239,231,0.98)_100%)] shadow-[0_-12px_40px_-20px_rgba(249,115,22,0.14)] backdrop-blur-md"
    : panelAccent === "student"
      ? "border-t border-orange-400/28 bg-[linear-gradient(180deg,rgba(249,115,22,0.16)_0%,rgba(236,72,153,0.06)_52%,rgba(15,13,11,0.97)_100%)] shadow-[0_-12px_40px_-20px_rgba(249,115,22,0.22)] backdrop-blur-md"
      : panelAccent === "coach"
        ? "border-t border-orange-400/28 bg-[linear-gradient(180deg,rgba(249,115,22,0.15)_0%,rgba(244,114,182,0.08)_52%,rgba(15,13,11,0.97)_100%)] shadow-[0_-12px_40px_-20px_rgba(249,115,22,0.2)] backdrop-blur-md"
        : "border-t border-white/10 bg-[#111111]/95 backdrop-blur-md";

  const navLinkActive = peach
    ? "border border-orange-500/42 bg-gradient-to-r from-orange-300/52 via-pink-200/40 to-purple-200/42 text-orange-950 shadow-inner shadow-orange-300/35 [&_svg]:opacity-95"
    : panelAccent === "student"
      ? "border border-orange-400/45 bg-gradient-to-r from-pf-orange/38 via-pink-500/28 to-purple-950/25 text-orange-50 shadow-inner shadow-orange-950/35 [&_svg]:opacity-95"
      : panelAccent === "coach"
        ? "border border-orange-500/43 bg-gradient-to-r from-pf-orange/[0.35] via-pink-500/[0.24] to-rose-950/25 text-orange-50 shadow-inner shadow-orange-950/38 [&_svg]:opacity-95"
        : "border border-orange-400/35 bg-gradient-to-r from-pf-orange/[0.34] via-pink-500/[0.22] to-transparent text-orange-50 shadow-inner shadow-orange-950/35 [&_svg]:opacity-95";

  const inactiveClass = cn(
    "border-transparent transition",
    peach ? "text-zinc-600 hover:border-orange-300/52 hover:bg-pink-100/52 hover:text-orange-950/95" : "text-zinc-400",
    !peach && panelAccent === "student" && "hover:border-orange-400/35 hover:bg-pink-500/12 hover:text-orange-50",
    !peach && panelAccent === "coach" && "hover:border-orange-500/37 hover:bg-pink-500/13 hover:text-orange-50",
    !peach && panelAccent === "admin" && "hover:bg-white/[0.06] hover:text-white",
  );

  const badgeClass =
    panelAccent === "student" || panelAccent === "coach"
      ? "bg-gradient-to-br from-pf-orange-bright to-pink-400 text-black"
      : "bg-pf-orange-bright text-black";

  return (
    <div className={cn("fixed inset-x-0 bottom-0 z-40 px-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.35rem)] pt-2 lg:hidden", barTone)}>
      <nav className="grid grid-cols-5 gap-1">
        {items.slice(0, 4).map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "relative flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl border border-transparent px-0.5 text-[11px] font-medium transition",
              item.active ? navLinkActive : inactiveClass,
            )}
          >
            <span className="text-base leading-none">{item.icon}</span>
            <span className={item.active ? "font-semibold" : undefined}>{item.label}</span>
            {item.badgeCount && item.badgeCount > 0 ? (
              <span className={cn("absolute right-1 top-1 inline-flex min-w-[1rem] justify-center rounded-full px-1 text-[10px] font-bold", badgeClass)}>
                {item.badgeCount > 99 ? "99+" : item.badgeCount}
              </span>
            ) : null}
          </Link>
        ))}
        <button
          type="button"
          onClick={onMenuClick}
          className={cn(
            "flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition",
            peach && "border border-orange-400/38 bg-orange-100/72 text-orange-950",
            !peach && panelAccent === "student" && "border border-orange-500/25 bg-pink-500/10 text-orange-50/95",
            !peach && panelAccent === "coach" && "border border-orange-500/31 bg-pink-500/12 text-orange-50/95",
            !peach && panelAccent === "admin" && "text-zinc-300 hover:bg-white/8",
          )}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
          <span>Menü</span>
        </button>
      </nav>
    </div>
  );
}
