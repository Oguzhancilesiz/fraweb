"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/components/dashboard/DashboardUI";
import { marketingImages } from "@/components/marketing/marketing-assets";
import { useSiteTheme } from "@/contexts/SiteThemeContext";
import { routes } from "@/lib/site";

type Cycle = "monthly" | "quarter";

const plans: {
  name: string;
  blurb: string;
  monthly: string;
  quarter: string;
  featured?: boolean;
  items: { text: string; ok: boolean }[];
  cta: { label: string; href: string; primary?: boolean };
}[] = [
  {
    name: "Başlangıç",
    blurb: "Yeni başlayanlar, temel düzen arayanlar.",
    monthly: "₺2.900",
    quarter: "₺7.800",
    items: [
      { text: "Aylık program güncellemesi", ok: true },
      { text: "Haftalık check-in formu", ok: true },
      { text: "Beslenme iskeleti", ok: true },
      { text: "Sınırlı mesaj hakkı", ok: false },
    ],
    cta: { label: "Paketlere git", href: routes.packages },
  },
  {
    name: "Premium takip",
    blurb: "Düzenli geri bildirim ve hızlı ayar isteyenler.",
    monthly: "₺4.400",
    quarter: "₺11.900",
    featured: true,
    items: [
      { text: "Haftalık program ince ayarı", ok: true },
      { text: "Form video geri bildirimi", ok: true },
      { text: "Öncelikli mesaj hattı", ok: true },
      { text: "Ay sonu rapor özeti", ok: true },
    ],
    cta: { label: "Bu plan bana uygun", href: "/#onboarding-demo", primary: true },
  },
  {
    name: "VIP koçluk",
    blurb: "Maksimum birebir ve esnek iletişim.",
    monthly: "₺6.900",
    quarter: "₺18.500",
    items: [
      { text: "Tam kişiselleştirilmiş döngü", ok: true },
      { text: "Esnek seans revizyonları", ok: true },
      { text: "Yüksek mesaj & görsel kotası", ok: true },
      { text: "Öncelikli canlı koç sohbeti", ok: true },
    ],
    cta: { label: "Satın alma öncesi sor", href: routes.contact },
  },
];

export function PricingSection() {
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const { theme } = useSiteTheme();
  const light = theme === "light";

  return (
    <section
      id="paketler"
      className={cn(
        "pricing-stripes-soft scroll-mt-24 relative overflow-hidden border-y py-[4rem] transition-colors duration-300 sm:py-[4.75rem]",
        light
          ? "border-orange-200/35 bg-orange-50/45"
          : "pf-pricing-section border-white/10 bg-zinc-950/70",
      )}
    >
      <div id="fiyat" tabIndex={-1} aria-hidden className="scroll-mt-[5.5rem] focus:outline-none" />
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src={marketingImages.pricingBg}
          alt=""
          fill
          className={cn(
            "object-cover object-[center_30%]",
            light ? "opacity-[0.065]" : "opacity-[0.12]",
          )}
          sizes="100vw"
        />
        <div
          className={cn(
            "absolute inset-0",
            light
              ? "bg-gradient-to-b from-white/35 via-orange-50/45 to-orange-50/92"
              : "bg-gradient-to-b from-transparent via-black/52 to-black/86",
          )}
          aria-hidden
        />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="text-center">
          <p className="text-public-label text-xs font-bold uppercase tracking-[0.2em]">Paketler</p>
          <h2 className="font-display mt-2 text-3xl font-bold tracking-tight text-public-strong sm:text-4xl">
            Sana uygun yoğunluğu seç
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-public-muted">
            Örnek fiyat göstergeleri — kesin tutarlar için{" "}
            <Link
              href={routes.packages}
              className={cn(
                "font-semibold underline-offset-4 hover:underline",
                light ? "text-orange-800 hover:text-pink-800" : "text-pf-orange-bright hover:text-pink-400",
              )}
            >
              canlı paket listesi
            </Link>
            .
          </p>
        </div>

        <div
          className={cn(
            "mx-auto mt-9 flex w-fit items-center gap-1 rounded-full border p-1 shadow-inner backdrop-blur-md",
            light ? "border-orange-200/50 bg-white/95" : "border-public-card bg-public-deep",
          )}
          role="group"
          aria-label="Ödeme periyodu"
        >
          <button
            type="button"
            onClick={() => setCycle("monthly")}
            className={`rounded-full px-5 py-2 text-sm font-bold transition ${cycle === "monthly" ? "bg-gradient-to-r from-pf-orange to-pf-orange-bright text-black shadow-md" : "text-public-muted hover:text-public-strong"}`}
          >
            Aylık
          </button>
          <button
            type="button"
            onClick={() => setCycle("quarter")}
            className={`rounded-full px-5 py-2 text-sm font-bold transition ${cycle === "quarter" ? "bg-gradient-to-r from-pink-500 to-pf-pink text-white shadow-md shadow-pink-900/35" : "text-public-muted hover:text-public-strong"}`}
          >
            3 aylık
          </button>
        </div>

        <div className="mt-11 grid gap-6 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={
                light
                  ? cn(
                      "relative flex flex-col rounded-2xl border p-6 shadow-lg",
                      p.featured
                        ? "border-orange-400/55 bg-gradient-to-b from-orange-50 to-white shadow-orange-900/18 ring-1 ring-orange-300/65"
                        : "border-orange-300/55 bg-white/95 shadow-stone-400/28",
                    )
                  : cn(
                      "pf-pricing-card border-public-card relative flex flex-col rounded-2xl border p-6 backdrop-blur-md shadow-2xl",
                      p.featured && "pf-pricing-card--featured",
                    )
              }
            >
              {p.featured ? (
                <span
                  className={cn(
                    "absolute -top-3 left-1/2 z-[1] -translate-x-1/2 rounded-full bg-gradient-to-r from-pf-orange-bright to-pink-400 px-3 py-1 text-xs font-bold text-black shadow-sm ring-2",
                    light ? "ring-orange-900/35" : "ring-black/40",
                  )}
                >
                  Önerilen
                </span>
              ) : null}
              <h3 className={cn("font-display text-xl font-bold", light ? "text-stone-950" : "text-public-strong")}>
                {p.name}
              </h3>
              <p className={cn("mt-1 text-sm", light ? "text-stone-600" : "text-public-muted")}>{p.blurb}</p>
              <div className="my-6">
                <span className={cn("font-display text-4xl font-bold", light ? "text-stone-950" : "text-public-strong")}>
                  {cycle === "monthly" ? p.monthly : p.quarter}
                </span>
                <span className={cn("text-sm font-medium", light ? "text-stone-700" : "text-public-muted")}>
                  {cycle === "monthly" ? "/ay" : "/3 ay"}
                </span>
              </div>
              <ul className="mb-6 flex-1 space-y-2 text-sm">
                {p.items.map((it) => (
                  <li key={it.text} className="flex items-start gap-2">
                    {it.ok ? (
                      <span
                        className={cn("mt-0.5 font-bold", light ? "text-orange-600" : "text-pf-orange-bright")}
                        aria-hidden
                      >
                        ✓
                      </span>
                    ) : (
                      <span
                        className={cn("mt-0.5", light ? "text-stone-500" : "text-public-soft")}
                        aria-hidden
                      >
                        —
                      </span>
                    )}
                    <span className={it.ok ? (light ? "text-stone-800" : "text-public-body") : light ? "text-stone-500" : "text-public-muted"}>
                      {it.text}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href={p.cta.href}
                className={cn(
                  "rounded-full py-3 text-center text-sm font-bold transition",
                  p.cta.primary
                    ? "bg-gradient-to-r from-pf-orange via-pf-orange-bright to-pink-500 text-black shadow-lg hover:brightness-105"
                    : light
                      ? "border border-orange-400/60 bg-orange-50/95 text-orange-950 shadow-sm hover:bg-orange-100"
                      : "border-public-card text-public-strong border backdrop-blur-sm hover:border-pf-pink/45 hover:bg-pf-pink/8",
                )}
              >
                {p.cta.label}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
