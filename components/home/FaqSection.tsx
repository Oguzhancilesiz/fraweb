import Link from "next/link";
import { routes } from "@/lib/site";

const faq = [
  {
    q: "Programlar kişiye özel mi?",
    a: "Evet. Başlangıç değerlendirmene, ekipmanına ve zamanına göre planlar oluşturulur; haftalar ilerledikçe geri bildirimlerinle güncellenir.",
  },
  {
    q: "Online takip nasıl işliyor?",
    a: "Check-in günlerinde formlar ve gerekiyorsa video paylaşırsın. Koç planı inceler, bir sonraki haftanın odağını ve düzeltmelerini net iletir.",
  },
  {
    q: "Beslenme desteği var mı?",
    a: "Tıbbi diyet değil; sürdürülebilir bir iskelet ve alışkanlık önerileri sunulur. Özel tıbbi durum için uzmana yönlendirme önerilir.",
  },
  {
    q: "Yeni başlayanlar için uygun mu?",
    a: "Düşük riskli progresyon, açık anlatımlar ve hareket öğrenme modülleri ile yeni başlayan dostu yaklaşım.",
  },
  {
    q: "Kaç gün antrenman olur?",
    a: "Hedefe ve toparlanmana göre çoğu senaryoda haftada 3–5 gün; yoğun dönemlerde yedek seans planları eklenebilir.",
  },
  {
    q: "Ödeme nasıl yapılır?",
    a: "Paket seçimi sonrası güvenli ödeme ekranına yönlendirilirsin; doğrulama ve aktivasyon adımlarıyla hesap açılır.",
  },
];

export function FaqSection() {
  return (
    <section id="sss" className="scroll-mt-24 py-[4rem] sm:py-[4.75rem]">
      <div className="mx-auto max-w-3xl px-4 lg:px-8">
        <p className="text-public-label text-center text-xs font-bold uppercase tracking-[0.2em]">SSS</p>
        <h2 className="font-display text-center text-2xl font-bold text-public-strong sm:text-3xl">Sıkça sorulanlar</h2>
        <p className="mt-3 text-center text-sm text-public-muted">
          Sorunun burada değilse{" "}
          <Link href={routes.contact} className="font-bold text-pf-orange-bright underline-offset-2 hover:text-pf-pink hover:underline">
            iletişim
          </Link>{" "}
          ile yazman yeterli.
        </p>
        <div className="mt-9 space-y-2 pf-faq">
          {faq.map((f) => (
            <details
              key={f.q}
              className="border-public-card group rounded-2xl border bg-transparent p-0 open:border-pf-orange/45 open:bg-pf-orange/[0.06] transition-colors"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-sm font-semibold text-public-body group-open:bg-gradient-to-r group-open:from-pf-orange/10 group-open:to-transparent group-open:text-pf-orange-bright">
                {f.q}
                <span className="text-public-muted transition-transform group-open:rotate-90">▸</span>
              </summary>
              <div className="border-t border-white/5 px-4 pb-4 pt-3 text-sm leading-relaxed text-public-muted">
                {f.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
