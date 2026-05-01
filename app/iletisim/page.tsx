import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { NoopForm } from "@/components/NoopForm";
import { getPublicSiteMeta } from "@/lib/api/public-site";
import { routes, site } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const m = await getPublicSiteMeta();
  const p = m?.pages?.contact;
  return {
    title: p?.title?.split("|")[0]?.trim() ?? "İletişim",
    description: p?.metaDescription ?? "PT Fraoula iletişim ve destek.",
  };
}

export default async function ContactPage() {
  const m = await getPublicSiteMeta();
  const supportEmail = (m?.supportEmail?.trim() || site.supportEmail).trim();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 lg:px-6">
      <PageHeader
        eyebrow="İletişim"
        title="Sana en kısa yoldan dönüş yapalım"
        lead="Paket, teknik veya iş birliği soruların için tek adres. Aşağıdaki form arayüz örneğidir; veri gitmez, kayıt tutulmaz."
      />
      <div className="rounded-2xl border border-white/10 bg-pf-card/50 p-6">
        <h2 className="text-sm font-bold">E-posta</h2>
        <p className="mt-1 text-sm text-zinc-500">Destek ve iş birliği.</p>
        <a
          className="mt-4 inline-flex rounded-full bg-pf-orange px-5 py-2.5 text-sm font-bold text-black"
          href={`mailto:${supportEmail}?subject=PT%20Fraoula%20iletişim`}
        >
          {supportEmail}
        </a>
        <NoopForm className="mt-8 space-y-3 border-t border-white/10 pt-6">
          <div>
            <label className="text-xs font-bold text-pf-mist" htmlFor="c-name">
              Ad
            </label>
            <input
              id="c-name"
              className="mt-1 w-full rounded-xl border border-white/10 bg-pf-void px-3 py-2 text-sm"
              autoComplete="name"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-pf-mist" htmlFor="c-msg">
              Mesaj
            </label>
            <textarea
              id="c-msg"
              rows={4}
              className="mt-1 w-full rounded-xl border border-white/10 bg-pf-void px-3 py-2 text-sm"
            />
          </div>
          <a
            href={`mailto:${encodeURIComponent(supportEmail)}?subject=${encodeURIComponent("PT Fraoula — iletişim formu")}&body=${encodeURIComponent("(Form demo; mesajını buraya yapıştır veya doğrudan e-posta gönder.)")}`}
            className="block w-full rounded-full border border-dashed border-pf-mist/40 py-2.5 text-center text-xs font-bold text-pf-mist hover:border-pf-orange/50 hover:text-pf-orange-bright"
          >
            E-posta uygulamasında aç (demo)
          </a>
        </NoopForm>
      </div>
      <div className="mt-4 rounded-2xl border border-pf-green/30 bg-pf-green/5 p-4 text-sm text-zinc-400" role="note">
        <strong className="text-pf-green-bright">Not:</strong> Bu platform tıbbi acil servis değildir. Ödeme ve aktivasyon bilgisi için{" "}
        <Link className="font-bold text-pf-orange-bright" href={routes.packages}>
          paketler
        </Link>{" "}
        sayfasını kullan.
      </div>
    </div>
  );
}
