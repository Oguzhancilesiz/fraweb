"use client";

import { cn } from "@/components/dashboard/DashboardUI";
import { usePanelTheme } from "@/contexts/PanelThemeContext";
import { useSiteTheme } from "@/contexts/SiteThemeContext";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  lead: string;
};

export function PageHeader({ eyebrow, title, lead }: PageHeaderProps) {
  const { theme: panelTheme, enabled: panelEnabled } = usePanelTheme();
  const { theme: siteTheme } = useSiteTheme();
  const L = panelEnabled ? panelTheme === "light" : siteTheme === "light";

  return (
    <div
      className={cn(
        "mb-6 overflow-hidden rounded-3xl border p-5 md:mb-8 md:p-8",
        L
          ? "border-orange-200/75 bg-gradient-to-br from-white via-orange-50/85 to-pink-50/95 shadow-[0_14px_40px_-34px_rgba(249,115,22,0.2)]"
          : "border-white/10 bg-gradient-to-br from-[#111111] via-[#111111]/95 to-[#090909]",
      )}
    >
      <p className={cn("text-[11px] font-bold uppercase tracking-[0.22em]", L ? "text-orange-700" : "text-pf-orange-bright")}>{eyebrow}</p>
      <h1 className={cn("font-display mt-2 text-2xl font-bold md:text-4xl", L ? "text-stone-900" : "text-zinc-100")}>{title}</h1>
      <p className={cn("mt-2 max-w-3xl text-sm", L ? "text-stone-600" : "text-zinc-400")}>{lead}</p>
    </div>
  );
}
