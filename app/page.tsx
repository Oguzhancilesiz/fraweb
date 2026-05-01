import type { Metadata } from "next";
import { HeroSection } from "@/components/home/HeroSection";
import { AboutSection } from "@/components/home/AboutSection";
import { PathSection } from "@/components/home/PathSection";
import { ProgramsSection } from "@/components/home/ProgramsSection";
import { ProcessSection } from "@/components/home/ProcessSection";
import { OnboardingSection } from "@/components/home/OnboardingSection";
import { SpotlightSection } from "@/components/home/SpotlightSection";
import { PricingSection } from "@/components/home/PricingSection";
import { FaqSection } from "@/components/home/FaqSection";
import { CtaSection } from "@/components/home/CtaSection";
import { getPublicBeforeAfterSpotlight } from "@/lib/api/public-before-after-spotlight";
import { getPublicSiteMeta } from "@/lib/api/public-site";

export async function generateMetadata(): Promise<Metadata> {
  const m = await getPublicSiteMeta();
  const landing = m?.pages?.landing;
  return {
    title: "Anasayfa",
    description:
      landing?.metaDescription?.trim() ??
      "PT Fraoula: kişiye özel plan, ölçülebilir ilerleme ve profesyonel online fitness koçluğu.",
  };
}

export default async function HomePage() {
  const spotlightRows = await getPublicBeforeAfterSpotlight(8);

  return (
    <main className="min-w-0">
      <HeroSection />
      <PathSection />
      <AboutSection />
      <ProgramsSection />
      <ProcessSection />
      <OnboardingSection />
      <SpotlightSection rows={spotlightRows} />
      <PricingSection />
      <FaqSection />
      <CtaSection />
    </main>
  );
}
