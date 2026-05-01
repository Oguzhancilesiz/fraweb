/** Sunucu `PaymentOrderStatus` ile aynı sayısal sıra. */

export function paymentOrderStatusLabel(n: number): string {
  const m: Record<number, string> = {
    0: "Beklemede",
    1: "Doğrulama bekliyor",
    2: "Ödendi",
    3: "Başarısız",
    4: "İptal",
    5: "İade",
  };
  return m[n] ?? `Durum (${n})`;
}

export function studentPackageStatusLabel(n: number): string {
  const m: Record<number, string> = {
    0: "Aktivasyon bekliyor",
    1: "Aktif",
    2: "Sona erdi",
    3: "İptal",
  };
  return m[n] ?? `Durum (${n})`;
}

/** `AuditActionType` sırasına uyumlu — kısa etiket. */
export function auditActionTypeLabel(n: number): string {
  const m: Record<number, string> = {
    0: "Oluştur",
    1: "Güncelle",
    2: "Sil",
    3: "Soft sil",
    4: "Giriş",
    5: "Çıkış",
    6: "Ödeme doğrulandı",
    7: "Manuel sipariş incelemesi",
    8: "Aktivasyon kullanıldı",
    9: "Aylık değerlendirme gönderildi",
    10: "Aylık değerlendirme incelendi",
    11: "Program yayınlandı",
    12: "Program arşivlendi",
    13: "Topluluk içerik yöneticisi kaldırdı",
    14: "Topluluk kısıtları güncellendi",
    15: "Topluluk içeriği geri yüklendi",
    16: "Giriş başarısız",
    17: "Öğrenci kaydı",
    18: "Erişim reddedildi",
    19: "Parola değişti",
    20: "İlk parola",
    21: "Ödeme webhook alındı",
    22: "Ödeme webhook reddi",
    23: "Dosya yüklemesi reddi",
    24: "Hesap kilidi (yönetici)",
    25: "Kilit kaldırıldı",
    26: "Rate limit",
    27: "Parola sıfırlama istendi",
    28: "Parola sıfırlandı",
    29: "Parola sıfırlama başarısız",
  };
  return m[n] ?? `Eylem #${n}`;
}

export function purchaseIntentStatusLabel(n: number): string {
  const m: Record<number, string> = {
    0: "Beklemede",
    1: "Yönlendirildi",
    2: "Doğrulama bekliyor",
    3: "Ödendi",
    4: "Başarısız",
    5: "Süresi doldu",
    6: "İptal",
  };
  return m[n] ?? `Durum (${n})`;
}
