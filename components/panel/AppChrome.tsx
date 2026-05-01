"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { isPanelPath, resolvePanelVariant } from "@/lib/panel-paths";
import { PanelShell } from "./PanelShell";

type AppChromeProps = {
  children: ReactNode;
  supportEmail?: string;
};

export function AppChrome({ children, supportEmail }: AppChromeProps) {
  const pathname = usePathname();
  const { user, ready } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const panel = isPanelPath(pathname);
  const showPanel = panel && user != null;

  // İlk istemci boyamasını SSR ile aynı tut: oturum/pathname farkı panel kabuğunu
  // hemen açarsa hydration uyuşmazlığı oluşur; mounted + ready sonrası dallan.
  if (!mounted || !ready) {
    return (
      <>
        <a className="pf-skip" href="#icerik">
          İçeriğe atla
        </a>
        <SiteHeader />
        <div id="icerik" className="flex-1">
          {children}
        </div>
        <SiteFooter supportEmail={supportEmail} />
      </>
    );
  }

  if (showPanel && user) {
    const variant = resolvePanelVariant(pathname, user.roles);
    return (
      <>
        <a className="pf-skip" href="#icerik">
          İçeriğe atla
        </a>
        <div className="flex h-[100dvh] max-h-[100dvh] min-h-0 w-full flex-1 flex-col overflow-hidden">
          <PanelShell variant={variant}>{children}</PanelShell>
        </div>
      </>
    );
  }

  return (
    <>
      <a className="pf-skip" href="#icerik">
        İçeriğe atla
      </a>
      <SiteHeader />
      <div id="icerik" className="flex-1">
        {children}
      </div>
      <SiteFooter supportEmail={supportEmail} />
    </>
  );
}
