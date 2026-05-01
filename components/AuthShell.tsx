import { ReactNode } from "react";
import Link from "next/link";
import { routes } from "@/lib/site";

type AuthShellProps = {
  sideEyebrow: string;
  sideTitle: string;
  sideText: string;
  children: ReactNode;
};

export function AuthShell({ sideEyebrow, sideTitle, sideText, children }: AuthShellProps) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-6">
      <div className="pf-auth-grid grid overflow-hidden rounded-3xl border border-white/10 bg-pf-card/40 lg:grid-cols-5">
        <div className="pf-auth-aside hidden border-b border-white/10 bg-pf-void/60 p-8 lg:col-span-2 lg:block lg:border-b-0 lg:border-r lg:border-white/10">
          <p className="pf-auth-aside-eyebrow text-xs font-bold uppercase tracking-[0.2em] text-pf-orange-bright">
            {sideEyebrow}
          </p>
          <h2 className="pf-auth-aside-title font-display mt-2 text-2xl font-bold text-white">{sideTitle}</h2>
          <p className="pf-auth-aside-lead mt-3 text-sm text-zinc-300">{sideText}</p>
          <Link
            href={routes.home}
            className="pf-auth-aside-home mt-6 inline-flex rounded-full border border-white/15 px-4 py-2 text-xs font-bold text-white/90 transition hover:border-white/35 hover:bg-white/5"
          >
            Ana siteye dön
          </Link>
        </div>
        <div className="pf-auth-main p-6 sm:p-10 lg:col-span-3">{children}</div>
      </div>
    </div>
  );
}
