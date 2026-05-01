import Link from "next/link";
import { routes, site } from "@/lib/site";

const y = new Date().getUTCFullYear();

type Props = {
  /** API `public/site/meta` destek e-postası; yoksa `site.supportEmail`. */
  supportEmail?: string;
};

export function SiteFooter({ supportEmail }: Props) {
  const email = supportEmail?.trim() || site.supportEmail;
  return (
    <footer className="pf-site-footer mt-auto border-t border-white/10 bg-pf-ink transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <p className="font-display text-xl font-bold text-public-strong">
              PT <span className="bg-gradient-to-r from-pf-orange-bright to-pink-500 bg-clip-text text-transparent">Fraoula</span>
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-public-muted">
              {site.tagline}: kişiye özel plan, düzenli takip ve sürdürülebilir alışkanlıklar. Net bir yol ve
              profesyonel mesafe.
            </p>
          </div>
          <div className="lg:col-span-2">
            <p className="text-xs font-bold uppercase tracking-widest text-public-label">Keşfet</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href={routes.home} className="pf-footer-link transition hover:text-pf-orange-bright">
                  Anasayfa
                </Link>
              </li>
              <li>
                <Link href="/#programlar" className="pf-footer-link transition hover:text-pf-orange-bright">
                  Programlar
                </Link>
              </li>
              <li>
                <Link href={routes.how} className="pf-footer-link transition hover:text-pf-orange-bright">
                  Nasıl çalışır?
                </Link>
              </li>
              <li>
                <Link href={routes.packages} className="pf-footer-link transition hover:text-pf-orange-bright">
                  Paketler
                </Link>
              </li>
            </ul>
          </div>
          <div className="lg:col-span-3">
            <p className="text-xs font-bold uppercase tracking-widest text-public-label">Deneyim</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href={routes.community} className="pf-footer-link transition hover:text-pf-pink">
                  Topluluk
                </Link>
              </li>
              <li>
                <Link href={routes.coaches} className="pf-footer-link transition hover:text-pf-pink">
                  Antrenörler
                </Link>
              </li>
              <li>
                <Link href={routes.beforeAfter} className="pf-footer-link transition hover:text-pf-pink">
                  Öncesi &amp; sonrası
                </Link>
              </li>
              <li>
                <Link href={routes.forum} className="pf-footer-link transition hover:text-pf-pink">
                  Forum
                </Link>
              </li>
            </ul>
          </div>
          <div className="lg:col-span-3">
            <p className="text-xs font-bold uppercase tracking-widest text-public-muted">Destek &amp; yasal</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href={routes.contact} className="pf-footer-link transition hover:text-public-strong">
                  İletişim
                </Link>
              </li>
              <li>
                <Link href="/#sss" className="pf-footer-link transition hover:text-public-strong">
                  SSS
                </Link>
              </li>
              <li>
                <Link href={routes.privacy} className="pf-footer-link transition hover:text-public-strong">
                  Gizlilik
                </Link>
              </li>
              <li>
                <Link href={routes.terms} className="pf-footer-link transition hover:text-public-strong">
                  Kullanım şartları
                </Link>
              </li>
            </ul>
            <p className="mt-5 text-xs text-public-muted">
              E-posta:{" "}
              <a className="font-semibold text-pf-orange-bright hover:underline" href={`mailto:${email}`}>
                {email}
              </a>
            </p>
            <Link
              href={routes.contact}
              className="mt-4 inline-flex rounded-full border border-pf-orange/45 bg-gradient-to-br from-pf-orange/12 to-pf-pink/10 px-4 py-2 text-sm font-bold text-pf-orange-bright transition hover:border-pf-orange/70"
            >
              Bize ulaş
            </Link>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-8 text-xs text-public-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© {y} {site.name}. Tüm hakları saklıdır.</span>
          <div className="flex flex-wrap gap-4">
            <Link href={routes.privacy} className="hover:text-public-strong">
              Gizlilik
            </Link>
            <Link href={routes.terms} className="hover:text-public-strong">
              Şartlar
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
