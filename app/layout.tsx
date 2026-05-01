import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import Script from "next/script";
import { Manrope, Oswald } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { DemoFeedbackFab } from "@/components/DemoFeedbackFab";
import { AppChrome } from "@/components/panel/AppChrome";
import { getPublicSiteMeta } from "@/lib/api/public-site";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
});

const defaultMetadata: Metadata = {
  title: {
    default: "PT Fraoula | Premium online fitness koçluğu",
    template: "%s | PT Fraoula",
  },
  description:
    "Kişiye özel antrenman, düzenli takip ve sürdürülebilir alışkanlıklar. Hedefine net, profesyonel online koçlukla ilerle.",
  keywords: ["PT Fraoula", "online koçluk", "kişisel antrenör", "fitness", "antrenman programı"],
};

export async function generateMetadata(): Promise<Metadata> {
  const m = await getPublicSiteMeta();
  const landing = m?.pages?.landing;
  if (landing?.title?.trim() && landing?.metaDescription?.trim()) {
    return {
      ...defaultMetadata,
      title: { default: landing.title.trim(), template: "%s | PT Fraoula" },
      description: landing.metaDescription.trim(),
    };
  }
  return defaultMetadata;
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#030303",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteMeta = await getPublicSiteMeta();
  const supportEmail = siteMeta?.supportEmail;

  return (
    <html
      lang="tr"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${manrope.variable} ${oswald.variable} h-full antialiased`}
    >
      <body className="pf-site-body min-h-full flex flex-col text-zinc-100 transition-[background,color] duration-300 ease-out">
        <Script
          id="pf-site-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='pf-site-theme';var t=localStorage.getItem(k);if(t!=='light'&&t!=='dark')t='dark';document.documentElement.setAttribute('data-site-theme',t);}catch(e){document.documentElement.setAttribute('data-site-theme','dark');}})();`,
          }}
        />
        <Providers>
          <Suspense fallback={null}>
            <AppChrome supportEmail={supportEmail}>{children}</AppChrome>
          </Suspense>
          <DemoFeedbackFab />
        </Providers>
      </body>
    </html>
  );
}
