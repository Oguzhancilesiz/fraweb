export const HEIGHT_QUICK_CM = [150, 155, 160, 165, 170, 175, 180, 185, 190];
export const WEIGHT_QUICK_KG = [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 110];

export const GOAL_CHIPS: { v: number; label: string }[] = [
  { v: 0, label: "Kilo vermek" },
  { v: 1, label: "Kas kazanmak" },
  { v: 2, label: "Rekompozisyon" },
  { v: 3, label: "Form korumak" },
  { v: 4, label: "Performans / diğer hedef" },
];

export const HEALTH_QUICK: { key: string; label: string; append: string }[] = [
  { key: "none", label: "Kronik rahatsızlığım yok", append: "Kronik rahatsızlığım yok." },
  { key: "thyroid", label: "Tiroid", append: "Tiroid rahatsızlığı / ilaç kullanımı." },
  { key: "pcos", label: "PCOS", append: "PCOS." },
  { key: "back", label: "Bel ağrısı", append: "Bel ağrısı / bel problemi." },
  { key: "knee", label: "Diz ağrısı", append: "Diz ağrısı / diz problemi." },
  { key: "shoulder", label: "Omuz problemi", append: "Omuz problemi." },
  { key: "meds", label: "İlaç kullanıyorum", append: "Düzenli ilaç kullanıyorum." },
  { key: "other", label: "Diğer", append: "Diğer sağlık notu: " },
];

export const TRAINING_HISTORY_QUICK: string[] = [
  "Yeni başlıyorum.",
  "Evde çalışıyorum.",
  "Salona gidiyorum.",
  "Daha önce düzenli program yaptım.",
  "Ağırlık antrenmanını seviyorum.",
  "Kardiyo ağırlıklı ilerlemek istiyorum.",
];

export const WATER_CHIPS: { label: string; value: string }[] = [
  { label: "1 L altı", value: "Günde 1 litrenin altı su tüketiyorum." },
  { label: "1–1,5 L", value: "Günde yaklaşık 1–1,5 litre su." },
  { label: "2 L", value: "Günde yaklaşık 2 litre su." },
  { label: "2,5 L", value: "Günde yaklaşık 2,5 litre su." },
  { label: "3 L+", value: "Günde 3 litre ve üzeri su." },
];

export const MEAL_CHIPS: { label: string; value: string }[] = [
  { label: "2 öğün", value: "Günde 2 ana öğün besleniyorum." },
  { label: "3 öğün", value: "Günde 3 ana öğün besleniyorum." },
  { label: "4 öğün", value: "Günde 4 öğün besleniyorum." },
  { label: "5+ öğün", value: "Günde 5 veya daha fazla öğün/atıştırma ile besleniyorum." },
];

export const DIET_CHIPS: { label: string; value: string }[] = [
  { label: "Normal", value: "Genel olarak normal besleniyorum." },
  { label: "Kalori takip", value: "Kalori / makro takibi yapıyorum." },
  { label: "Düşük karb.", value: "Düşük karbonhidratlı besleniyorum." },
  { label: "Vejetaryen", value: "Vejetaryen besleniyorum." },
  { label: "Glutensiz", value: "Glutensiz besleniyorum." },
  { label: "Laktozsuz", value: "Laktozsuz besleniyorum." },
  { label: "Düzensiz", value: "Beslenme saatlerim düzensiz." },
];

export const ALLERGY_CHIPS: { label: string; value: string }[] = [
  { label: "Yok", value: "Bilinen gıda alerjim yok." },
  { label: "Laktoz", value: "Laktoz intoleransı / alerjisi." },
  { label: "Gluten", value: "Gluten hassasiyeti / çölyak." },
  { label: "Kuruyemiş", value: "Kuruyemiş alerjisi." },
  { label: "Yumurta", value: "Yumurta alerjisi." },
  { label: "Diğer", value: "Diğer alerjiler: " },
];

export const DURATION_PRESETS: { label: string; hours: number }[] = [
  { label: "30 dk", hours: 0.5 },
  { label: "45 dk", hours: 0.75 },
  { label: "60 dk", hours: 1 },
  { label: "75 dk", hours: 1.25 },
  { label: "90 dk", hours: 1.5 },
  { label: "120 dk", hours: 2 },
];

export const TIME_PERIOD_PRESETS: { label: string; time: string }[] = [
  { label: "Sabah", time: "08:00" },
  { label: "Öğlen", time: "12:30" },
  { label: "Akşam", time: "18:30" },
  { label: "Gece", time: "21:30" },
];

export const SECTION_ANCHORS = ["sec-basic", "sec-health", "sec-train", "sec-nutrition", "sec-measure", "sec-photo"] as const;

export const PHOTO_CHECKLIST_LABELS = ["Ön serbest", "Arka serbest", "Yan profil", "Ön double biceps", "Arka double biceps"] as const;
