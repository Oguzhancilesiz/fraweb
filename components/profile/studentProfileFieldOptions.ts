/** Sunucu `Gender` max 32 karakter; serbest metin yerine sabit değerler. */
export const genderSelectOptions: { value: string; label: string }[] = [
  { value: "", label: "Seçilmedi" },
  { value: "Kadın", label: "Kadın" },
  { value: "Erkek", label: "Erkek" },
  { value: "İkili cinsiyet", label: "İkili cinsiyet" },
  { value: "Belirtmek istemiyorum", label: "Belirtmek istemiyorum" },
  { value: "__OTHER__", label: "Diğer (yaz, en fazla 32 karakter)" },
];

/** `BloodType` max 8 karakter. */
export const bloodTypeSelectOptions: { value: string; label: string }[] = [
  { value: "", label: "Seçilmedi" },
  { value: "0+", label: "0 Rh (+)" },
  { value: "0-", label: "0 Rh (-)" },
  { value: "A+", label: "A Rh (+)" },
  { value: "A-", label: "A Rh (-)" },
  { value: "B+", label: "B Rh (+)" },
  { value: "B-", label: "B Rh (-)" },
  { value: "AB+", label: "AB Rh (+)" },
  { value: "AB-", label: "AB Rh (-)" },
  { value: "?", label: "Bilmiyorum" },
  { value: "__OTHER__", label: "Diğer (yaz)" },
];

/** Liste dışı / serbest metin: seçicide `__OTHER__` gösterilir. */
export const SELECT_OTHER = "__OTHER__" as const;

export function fieldSelectValue(raw: string | null | undefined, options: { value: string }[]): string {
  const v = raw?.trim() ?? "";
  if (v === "") return "";
  return options.some((o) => o.value === v && o.value !== "") ? v : SELECT_OTHER;
}

export const countrySelectOptions: { value: string; label: string }[] = [
  { value: "", label: "Seçilmedi" },
  { value: "Türkiye", label: "Türkiye" },
  { value: "Almanya", label: "Almanya" },
  { value: "Amerika Birleşik Devletleri", label: "ABD" },
  { value: "Birleşik Krallık", label: "Birleşik Krallık" },
  { value: "Fransa", label: "Fransa" },
  { value: "Hollanda", label: "Hollanda" },
  { value: "Belçika", label: "Belçika" },
  { value: "Avusturya", label: "Avusturya" },
  { value: "İsviçre", label: "İsviçre" },
  { value: "İtalya", label: "İtalya" },
  { value: "İspanya", label: "İspanya" },
  { value: "Yunanistan", label: "Yunanistan" },
  { value: "Bulgaristan", label: "Bulgaristan" },
  { value: "Romanya", label: "Romanya" },
  { value: "Rusya", label: "Rusya" },
  { value: "Ukrayna", label: "Ukrayna" },
  { value: "Azerbaycan", label: "Azerbaycan" },
  { value: "Kazakistan", label: "Kazakistan" },
  { value: "Suudi Arabistan", label: "Suudi Arabistan" },
  { value: "Birleşik Arap Emirlikleri", label: "BAE" },
  { value: "Katar", label: "Katar" },
  { value: "Mısır", label: "Mısır" },
  { value: "Kanada", label: "Kanada" },
  { value: "Avustralya", label: "Avustralya" },
  { value: "__OTHER__", label: "Diğer (yaz)" },
];

/** Türkiye illeri (profilde şehir alanı). */
export const turkeyCitySelectOptions: { value: string; label: string }[] = [
  { value: "", label: "Seçilmedi" },
  { value: "Adana", label: "Adana" },
  { value: "Adıyaman", label: "Adıyaman" },
  { value: "Afyonkarahisar", label: "Afyonkarahisar" },
  { value: "Ağrı", label: "Ağrı" },
  { value: "Aksaray", label: "Aksaray" },
  { value: "Amasya", label: "Amasya" },
  { value: "Ankara", label: "Ankara" },
  { value: "Antalya", label: "Antalya" },
  { value: "Ardahan", label: "Ardahan" },
  { value: "Artvin", label: "Artvin" },
  { value: "Aydın", label: "Aydın" },
  { value: "Balıkesir", label: "Balıkesir" },
  { value: "Bartın", label: "Bartın" },
  { value: "Batman", label: "Batman" },
  { value: "Bayburt", label: "Bayburt" },
  { value: "Bilecik", label: "Bilecik" },
  { value: "Bingöl", label: "Bingöl" },
  { value: "Bitlis", label: "Bitlis" },
  { value: "Bolu", label: "Bolu" },
  { value: "Burdur", label: "Burdur" },
  { value: "Bursa", label: "Bursa" },
  { value: "Çanakkale", label: "Çanakkale" },
  { value: "Çankırı", label: "Çankırı" },
  { value: "Çorum", label: "Çorum" },
  { value: "Denizli", label: "Denizli" },
  { value: "Diyarbakır", label: "Diyarbakır" },
  { value: "Düzce", label: "Düzce" },
  { value: "Edirne", label: "Edirne" },
  { value: "Elazığ", label: "Elazığ" },
  { value: "Erzincan", label: "Erzincan" },
  { value: "Erzurum", label: "Erzurum" },
  { value: "Eskişehir", label: "Eskişehir" },
  { value: "Gaziantep", label: "Gaziantep" },
  { value: "Giresun", label: "Giresun" },
  { value: "Gümüşhane", label: "Gümüşhane" },
  { value: "Hakkari", label: "Hakkari" },
  { value: "Hatay", label: "Hatay" },
  { value: "Iğdır", label: "Iğdır" },
  { value: "Isparta", label: "Isparta" },
  { value: "İstanbul", label: "İstanbul" },
  { value: "İzmir", label: "İzmir" },
  { value: "Kahramanmaraş", label: "Kahramanmaraş" },
  { value: "Karabük", label: "Karabük" },
  { value: "Karaman", label: "Karaman" },
  { value: "Kars", label: "Kars" },
  { value: "Kastamonu", label: "Kastamonu" },
  { value: "Kayseri", label: "Kayseri" },
  { value: "Kırıkkale", label: "Kırıkkale" },
  { value: "Kırklareli", label: "Kırklareli" },
  { value: "Kırşehir", label: "Kırşehir" },
  { value: "Kilis", label: "Kilis" },
  { value: "Kocaeli", label: "Kocaeli" },
  { value: "Konya", label: "Konya" },
  { value: "Kütahya", label: "Kütahya" },
  { value: "Malatya", label: "Malatya" },
  { value: "Manisa", label: "Manisa" },
  { value: "Mardin", label: "Mardin" },
  { value: "Mersin", label: "Mersin" },
  { value: "Muğla", label: "Muğla" },
  { value: "Muş", label: "Muş" },
  { value: "Nevşehir", label: "Nevşehir" },
  { value: "Niğde", label: "Niğde" },
  { value: "Ordu", label: "Ordu" },
  { value: "Osmaniye", label: "Osmaniye" },
  { value: "Rize", label: "Rize" },
  { value: "Sakarya", label: "Sakarya" },
  { value: "Samsun", label: "Samsun" },
  { value: "Siirt", label: "Siirt" },
  { value: "Sinop", label: "Sinop" },
  { value: "Sivas", label: "Sivas" },
  { value: "Şanlıurfa", label: "Şanlıurfa" },
  { value: "Şırnak", label: "Şırnak" },
  { value: "Tekirdağ", label: "Tekirdağ" },
  { value: "Tokat", label: "Tokat" },
  { value: "Trabzon", label: "Trabzon" },
  { value: "Tunceli", label: "Tunceli" },
  { value: "Uşak", label: "Uşak" },
  { value: "Van", label: "Van" },
  { value: "Yalova", label: "Yalova" },
  { value: "Yozgat", label: "Yozgat" },
  { value: "Zonguldak", label: "Zonguldak" },
  { value: "__OTHER__", label: "Diğer (yaz)" },
];

export const occupationSelectOptions: { value: string; label: string }[] = [
  { value: "", label: "Seçilmedi" },
  { value: "Öğrenci", label: "Öğrenci" },
  { value: "Memur", label: "Memur" },
  { value: "Özel sektör çalışanı", label: "Özel sektör çalışanı" },
  { value: "Serbest meslek", label: "Serbest meslek" },
  { value: "İşveren / girişimci", label: "İşveren / girişimci" },
  { value: "Ev hanımı / ev işleri", label: "Ev hanımı / ev işleri" },
  { value: "Emekli", label: "Emekli" },
  { value: "İş arıyor", label: "İş arıyor" },
  { value: "Sağlık çalışanı", label: "Sağlık çalışanı" },
  { value: "Eğitim çalışanı", label: "Eğitim çalışanı" },
  { value: "Askeri personel", label: "Askeri personel" },
  { value: "__OTHER__", label: "Diğer (yaz)" },
];

export function selectValueInList(value: string | null | undefined, options: { value: string }[]): boolean {
  if (value == null || value === "") return true;
  return options.some((o) => o.value === value && o.value !== "__OTHER__");
}

/** Kayıtta `__OTHER__` placeholder kalmasın. */
export function stripSelectPlaceholder(v: string | null | undefined): string | null {
  const t = v?.trim() ?? "";
  if (!t || t === "__OTHER__") return null;
  return t;
}
