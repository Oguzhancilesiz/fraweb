"use client";

import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api/client";
import { getAccessToken } from "@/lib/auth/session-browser";

type ProfileGet = {
  role: string;
  settings?: { studentPortalTourCompleted?: boolean };
};

type StudentPortalTourProps = {
  /** Mobilde menü kapalıyken tura başlamadan yan paneli aç. */
  onNeedOpenSidebar: () => void;
};

function buildSteps() {
  const side = "right" as const;
  const align = "start" as const;
  return [
    {
      popover: {
        title: "Öğrenci paneline hoş geldiniz",
        description:
          "Bu kısa turda sol menüdeki başlıca sayfaları gösteriyoruz. İleri ile devam edebilir veya dışarıya tıklayarak kapatabilirsiniz.",
      },
    },
    {
      element: "#pf-web-tour-nav-overview",
      popover: {
        title: "Genel bakış",
        description: "Aktif paketiniz, program özeti ve günlük ilerlemeniz burada.",
        side,
        align,
      },
    },
    {
      element: "#pf-web-tour-nav-program",
      popover: {
        title: "Programım",
        description: "Koçunuzun hazırladığı antrenman programınızı ve günleri buradan yönetirsiniz.",
        side,
        align,
      },
    },
    {
      element: "#pf-web-tour-nav-assessments",
      popover: {
        title: "Değerlendirmeler",
        description: "Aylık ölçüm ve formlarınız bu bölümdedir.",
        side,
        align,
      },
    },
    {
      element: "#pf-web-tour-nav-packages",
      popover: {
        title: "Paketlerim",
        description: "Paket süreleri ve haklarınızı burada görürsünüz.",
        side,
        align,
      },
    },
    {
      element: "#pf-web-tour-nav-chat",
      popover: {
        title: "Canlı sohbet",
        description: "Koçunuzla mesajlaşma (paket kapsamına göre) bu sayfadadır.",
        side,
        align,
      },
    },
    {
      element: "#pf-web-tour-nav-community",
      popover: {
        title: "Topluluk",
        description: "Akış, forum ve paylaşımlar: diğer üyelerle etkileşim kurduğunuz alan.",
        side,
        align,
      },
    },
    {
      element: "#pf-web-tour-nav-beforeafter",
      popover: {
        title: "Değişimim",
        description: "Önce/sonra içeriklerinizi yönetir ve paylaşırsınız.",
        side,
        align,
      },
    },
    {
      element: "#pf-web-tour-nav-explore",
      popover: {
        title: "Keşfet",
        description: "Topluluktaki önce/sonra gönderilerini keşfedin.",
        side,
        align,
      },
    },
    {
      element: "#pf-web-tour-nav-shop",
      popover: {
        title: "Paket mağazası",
        description: "Yeni paket satın almak için ana sitedeki mağazaya gidersiniz.",
        side,
        align,
      },
    },
  ];
}

export function StudentPortalTour({ onNeedOpenSidebar }: StudentPortalTourProps) {
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    let cancelled = false;

    async function run() {
      const r = await apiFetch<ProfileGet>("/api/v1/profile", { accessToken: token });
      if (!r.ok || cancelled) return;
      if (r.data.role !== "student") return;
      if (r.data.settings?.studentPortalTourCompleted === true) return;

      await new Promise((resolve) => setTimeout(resolve, 450));
      if (cancelled) return;

      const isDesktop = typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
      if (!isDesktop) {
        onNeedOpenSidebar();
        await new Promise((resolve) => setTimeout(resolve, 380));
      }
      if (cancelled) return;

      let donePosted = false;
      const postDone = async () => {
        if (donePosted) return;
        donePosted = true;
        try {
          await apiFetch("/api/v1/profile/student/portal-tour/complete", {
            method: "POST",
            accessToken: token,
            body: "{}",
          });
        } catch {
          /* sessiz; sonraki oturumda tur tekrar denenebilir */
        }
      };

      const d = driver({
        showProgress: true,
        progressText: "{{current}} / {{total}}",
        nextBtnText: "İleri",
        prevBtnText: "Geri",
        doneBtnText: "Tamam",
        smoothScroll: true,
        onDestroyed: () => {
          void postDone();
        },
        steps: buildSteps(),
      });
      driverRef.current = d;
      requestAnimationFrame(() => {
        if (!cancelled) d.drive();
      });
    }

    void run();

    return () => {
      cancelled = true;
      driverRef.current?.destroy();
      driverRef.current = null;
    };
  }, [onNeedOpenSidebar]);

  return null;
}
