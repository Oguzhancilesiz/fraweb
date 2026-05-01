/**
 * Sunucu `AssessmentProgressPhotoSteps.OrderedTypes` ve `Instruction` ile aynı sırada / aynı metinler.
 * `AssessmentPhotoType`: Front=0, Side=1, Back=2, Extra=3, FrontDoubleBiceps=4, BackDoubleBiceps=5
 */
export const ASSESSMENT_PROGRESS_PHOTO_ORDERED_TYPES = [0, 2, 1, 4, 5] as const;

export type AssessmentPhotoTypeNum = (typeof ASSESSMENT_PROGRESS_PHOTO_ORDERED_TYPES)[number];

/** Her poz için başlık + nasıl durulacağı (Türkçe). */
export const ASSESSMENT_PROGRESS_PHOTO_INSTRUCTIONS: Record<number, { title: string; body: string }> = {
  0: {
    title: "Ön — kol serbest duruş",
    body: "Kameraya tam karşı dur; omuzlar gevşek, kollar vücuda yapışık, karın içeri hafifçe. Tüm vücudun kadrajda olsun.",
  },
  2: {
    title: "Arka — kol serbest duruş",
    body: "Sırtın kameraya dönük; bacaklar doğal açık, kollar serbest. Başını çevirmeden düz dur.",
  },
  1: {
    title: "Yan — serbest profil",
    body: "Profilden dur; kollar vücuda yapışık, bakışın öne. Gövde çizgisi net görünsün.",
  },
  4: {
    title: "Ön — double biceps",
    body: "Öne dön; dirsekleri omuz hizasına kaldırıp bicepsleri sık, ön kol kasları belirgin olsun.",
  },
  5: {
    title: "Arka — double biceps",
    body: "Sırtın kameraya; dirsekleri yukarı kaldırıp sırt ve arka kol kaslarını göster.",
  },
};

export function assessmentPhotoInstruction(photoType: number): { title: string; body: string } {
  return ASSESSMENT_PROGRESS_PHOTO_INSTRUCTIONS[photoType] ?? {
    title: "Fotoğraf",
    body: "Bu poz için net, aydınlık bir görsel yükle.",
  };
}
