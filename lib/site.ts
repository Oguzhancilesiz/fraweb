/** Merkezi rota isimleri — dışa bağlama yok, yalnızca UI yönlendirme. */
export const site = {
  name: "PT Fraoula",
  tagline: "Premium online fitness koçluğu",
  supportEmail: "destek@ptfraoula.local",
} as const;

export const routes = {
  home: "/",
  how: "/nasil-calisir",
  packages: "/paketler",
  contact: "/iletisim",
  privacy: "/gizlilik",
  terms: "/kullanim-sartlari",
  login: "/giris",
  register: "/kayit",
  reset: "/sifre-sifirlama",
  payment: "/odeme-durumu",
  student: "/ogrenci",
  studentProgram: "/ogrenci/programim",
  studentAssessments: "/ogrenci/degerlendirmeler",
  /** Gönderilmiş / kilitli kayıt — salt okunur detay. */
  studentAssessmentView: (formId: number) => `/ogrenci/degerlendirmeler/${formId}`,
  studentAssessmentEdit: (formId: number) => `/ogrenci/degerlendirmeler/${formId}/duzenle`,
  studentPackages: "/ogrenci/paketlerim",
  studentLiveChat: "/ogrenci/canli-sohbet",
  coach: "/koc",
  /** Koç paneli alt sayfaları (WebUI `Areas/Coach` ile hizalı). */
  coachStudents: "/koc/ogrenciler",
  coachStudentsReviewQueue: "/koc/ogrenciler?assessment=needsreview",
  coachStudentsNoPublished: "/koc/ogrenciler?programGap=nopublished",
  coachStudentsNoProgramLink: "/koc/ogrenciler?programGap=nolink",
  coachPrograms: "/koc/programlar",
  coachProgramFeedback: "/koc/durum-bildirimleri",
  coachLiveChat: "/koc/canli-sohbet",
  coachExercises: "/koc/egzersizler",
  admin: "/admin",
  adminUsers: "/admin/kullanicilar",
  adminUser: (userId: string) => `/admin/kullanicilar/${userId}`,
  adminModeration: "/admin/moderasyon",
  /** Reddedilmiş / silinmiş içerik geçmişi (API `moderation/archive`). */
  adminModerationArchive: "/admin/moderasyon-arsiv",
  adminPackages: "/admin/paketler",
  adminPackageNew: "/admin/paketler/yeni",
  adminPackage: (packageId: number | string) => `/admin/paketler/${packageId}`,
  adminStudentPackages: "/admin/ogrenci-paketleri",
  adminPayments: "/admin/odemeler",
  adminPurchaseIntents: "/admin/odeme-niyetleri",
  adminActivationCodes: "/admin/aktivasyon-kodlari",
  adminEmailCenter: "/admin/e-posta",
  adminCommunityInsights: "/admin/topluluk-icgoruler",
  adminSiteSettings: "/admin/site-ayarlari",
  adminAuditLogs: "/admin/denetim",
  /** Demo / canlı önizleme kullanıcı geri bildirimleri. */
  adminDemoFeedback: "/admin/demo-bildirimleri",
  adminSecurity: "/admin/guvenlik",
  adminMuscleWiki: "/admin/muscle-wiki",
  /** Topluluk — öncesi/sonrası vitrin (WebUI `BeforeAfter/Explore`). */
  beforeAfterExplore: "/oncesi-sonrasi",
  /** Girişli kullanıcının kendi paylaşımları (`before-after/mine`). */
  beforeAfterMine: "/oncesi-sonrasi/degisimim",
  community: "/topluluk",
  /** WebUI `Community/Home/Mine` — API `GET …/community/feed/mine`. */
  communityMine: "/topluluk/paylasimlarim",
  /** WebUI `ProfileSettings` — API `GET/POST …/profile`. */
  profileSettings: "/ayarlar",
  coaches: "/antrenorler",
  /** Toplulukta antrenör kamu profili (`GET …/community/coaches/{guid}`). */
  coachCommunityProfile: (coachUserId: string) => `/antrenorler/${coachUserId}`,
  /** @deprecated Yerine `beforeAfterExplore` veya `beforeAfterMine` kullanın. */
  beforeAfter: "/oncesi-sonrasi",
  forum: "/forum",
  /** Konu detayı — `publicId` GUID string. */
  forumTopic: (topicPublicId: string) => `/forum/konu/${topicPublicId}`,
} as const;
