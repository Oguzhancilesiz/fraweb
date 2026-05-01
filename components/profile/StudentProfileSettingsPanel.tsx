"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";
import { getPublicApiBaseUrl } from "@/lib/api/config";
import { resolveMediaUrl } from "@/lib/media";
import { routes } from "@/lib/site";
import {
  bloodTypeSelectOptions,
  countrySelectOptions,
  fieldSelectValue,
  genderSelectOptions,
  occupationSelectOptions,
  SELECT_OTHER,
  stripSelectPlaceholder,
  turkeyCitySelectOptions,
} from "./studentProfileFieldOptions";
import { Badge, SectionCard } from "@/components/dashboard/DashboardUI";
import { AccountSecurityCard } from "@/components/profile/AccountSecurityCard";

export type StudentProfileGet = {
  role: "student";
  settings: StudentProfileSettingsJson;
  emailConfirmed: boolean;
  hasPassword: boolean;
};

export type StudentProfileSettingsJson = {
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  profilePhotoUrl?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  heightCm?: number | null;
  currentWeightKg?: number | null;
  bloodType?: string | null;
  emergencyNote?: string | null;
  defaultGoalType?: number | null;
  notes?: string | null;
  city?: string | null;
  country?: string | null;
  occupation?: string | null;
  social?: {
    instagramUrl?: string | null;
    linkedInUrl?: string | null;
    twitterXUrl?: string | null;
    youtubeUrl?: string | null;
    tikTokUrl?: string | null;
    facebookUrl?: string | null;
    websiteUrl?: string | null;
  };
};

const goalOptions: { v: number; label: string }[] = [
  { v: 0, label: "Kilo verme" },
  { v: 1, label: "Kilo alma" },
  { v: 2, label: "Rekompozisyon" },
  { v: 3, label: "Koru / form" },
  { v: 4, label: "Diğer" },
];

const HEIGHT_QUICK_CM = [150, 155, 160, 165, 170, 175, 180, 185, 190];
const WEIGHT_QUICK_KG = [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 110];

function birthDateToInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(iso);
  return m ? m[1]! : "";
}

type Props = {
  accessToken: string;
  initial: StudentProfileGet;
  onProfileUpdated: () => Promise<void>;
};

type SettingsTab = "profile" | "security";

export function StudentProfileSettingsPanel({ accessToken, initial, onProfileUpdated }: Props) {
  const [tab, setTab] = useState<SettingsTab>("profile");
  const [meta, setMeta] = useState({ emailConfirmed: initial.emailConfirmed, hasPassword: initial.hasPassword });
  const [s, setS] = useState(initial.settings);
  const [phone, setPhone] = useState(initial.settings.phoneNumber ?? "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [fieldErrs, setFieldErrs] = useState<Record<string, string[]>>({});
  const [pickCountry, setPickCountry] = useState("");
  const [pickCity, setPickCity] = useState("");
  const [pickOcc, setPickOcc] = useState("");
  const [pickBlood, setPickBlood] = useState("");
  const [pickGender, setPickGender] = useState("");

  const photoUrl = useMemo(() => resolveMediaUrl(s.profilePhotoUrl), [s.profilePhotoUrl]);

  const applySettings = useCallback((next: StudentProfileSettingsJson) => {
    setS(next);
    setPhone(next.phoneNumber ?? "");
    setPhotoFile(null);
    setRemovePhoto(false);
  }, []);

  useEffect(() => {
    applySettings(initial.settings);
    setMeta({ emailConfirmed: initial.emailConfirmed, hasPassword: initial.hasPassword });
    const st = initial.settings;
    setPickCountry(fieldSelectValue(st.country, countrySelectOptions));
    setPickCity(fieldSelectValue(st.city, turkeyCitySelectOptions));
    setPickOcc(fieldSelectValue(st.occupation, occupationSelectOptions));
    setPickBlood(fieldSelectValue(st.bloodType, bloodTypeSelectOptions));
    setPickGender(fieldSelectValue(st.gender, genderSelectOptions));
  }, [initial, applySettings]);

  function appendIf(fd: FormData, key: string, v: string | number | undefined | null) {
    if (v === undefined || v === null || v === "") return;
    fd.append(key, String(v).replace(",", "."));
  }

  async function saveProfile() {
    setSavingProfile(true);
    setErr(null);
    setMsg(null);
    setFieldErrs({});
    const fd = new FormData();
    fd.append("FullName", s.fullName.trim());
    const genderOut = stripSelectPlaceholder(s.gender)?.slice(0, 32);
    appendIf(fd, "Gender", genderOut ?? null);
    if (s.birthDate) fd.append("BirthDate", s.birthDate);
    appendIf(fd, "HeightCm", s.heightCm);
    appendIf(fd, "CurrentWeightKg", s.currentWeightKg);
    const bloodOut = stripSelectPlaceholder(s.bloodType)?.slice(0, 8);
    appendIf(fd, "BloodType", bloodOut ?? null);
    appendIf(fd, "EmergencyNote", s.emergencyNote);
    if (s.defaultGoalType !== undefined && s.defaultGoalType !== null) fd.append("DefaultGoalType", String(s.defaultGoalType));
    appendIf(fd, "Notes", s.notes);
    appendIf(fd, "City", stripSelectPlaceholder(s.city));
    appendIf(fd, "Country", stripSelectPlaceholder(s.country));
    appendIf(fd, "Occupation", stripSelectPlaceholder(s.occupation));
    const soc = s.social ?? {};
    appendIf(fd, "InstagramUrl", soc.instagramUrl);
    appendIf(fd, "LinkedInUrl", soc.linkedInUrl);
    appendIf(fd, "TwitterXUrl", soc.twitterXUrl);
    appendIf(fd, "YoutubeUrl", soc.youtubeUrl);
    appendIf(fd, "TikTokUrl", soc.tikTokUrl);
    appendIf(fd, "FacebookUrl", soc.facebookUrl);
    appendIf(fd, "WebsiteUrl", soc.websiteUrl);
    fd.append("removePhoto", removePhoto ? "true" : "false");
    if (photoFile) fd.append("profilePhoto", photoFile);

    const res = await fetch(`${getPublicApiBaseUrl()}/api/v1/profile/student`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
      body: fd,
    });
    const text = await res.text();
    setSavingProfile(false);
    if (res.ok) {
      try {
        const j = text ? (JSON.parse(text) as { message?: string }) : {};
        setMsg(j.message ?? "Profil kaydedildi.");
      } catch {
        setMsg("Profil kaydedildi.");
      }
      await onProfileUpdated();
      return;
    }
    try {
      const j = JSON.parse(text) as { message?: string; validationErrors?: Record<string, string[]> };
      if (j.validationErrors) setFieldErrs(j.validationErrors);
      setErr(j.message ?? "Kayıt başarısız.");
    } catch {
      setErr(text || res.statusText);
    }
  }

  async function savePhone() {
    setSavingPhone(true);
    setErr(null);
    setMsg(null);
    const r = await apiFetch<{ message?: string }>("/api/v1/profile/phone", {
      method: "POST",
      accessToken,
      body: JSON.stringify({ phoneNumber: phone.trim() || null }),
    });
    setSavingPhone(false);
    if (!r.ok) {
      setErr(r.message);
      return;
    }
    setMsg(r.data.message ?? "Telefon güncellendi.");
    await onProfileUpdated();
  }

  const fe = (key: string) => fieldErrs[key]?.join(" ") ?? "";
  const bErr = (k: string) => (fe(k) ? "border-red-500/50" : "border-white/15");
  const ctl = `rounded-lg border bg-pf-void/80 px-3 py-2 text-white`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => {
            setTab("profile");
            setErr(null);
            setMsg(null);
          }}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            tab === "profile" ? "bg-pf-orange-bright text-black" : "border border-white/15 text-zinc-300 hover:bg-white/5"
          }`}
        >
          Profil
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("security");
            setErr(null);
            setMsg(null);
          }}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            tab === "security" ? "bg-pf-orange-bright text-black" : "border border-white/15 text-zinc-300 hover:bg-white/5"
          }`}
        >
          Güvenlik
        </button>
        <Badge tone="orange">Öğrenci ayarları</Badge>
      </div>

      {msg ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100">{msg}</p>
      ) : null}
      {err ? <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">{err}</p> : null}

      {tab === "profile" ? (
        <>
          <SectionCard className="bg-pf-card/40">
          <div className="flex flex-wrap items-start gap-6">
            <div className="shrink-0">
              {photoUrl && !removePhoto ? (
                <img src={photoUrl} alt="" className="h-28 w-28 rounded-2xl border border-white/10 object-cover" />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-2xl border border-white/10 bg-pf-orange/10 font-display text-2xl font-bold text-pf-orange-bright">
                  {(s.fullName || s.email).slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2 text-sm">
              <p className="text-xs text-zinc-500">
                Bu bilgiler aylık değerlendirme formlarında ve koçunun seni tanımasında kullanılır.{" "}
                <Link href={routes.studentAssessments} className="text-pf-orange-bright hover:underline">
                  Değerlendirmeler
                </Link>
              </p>
              <dl className="grid gap-2 text-zinc-400 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase text-zinc-500">E-posta</dt>
                  <dd className="text-white">{s.email}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-zinc-500">E-posta doğrulandı</dt>
                  <dd>{meta.emailConfirmed ? "Evet" : "Hayır"}</dd>
                </div>
              </dl>
              <p className="text-xs text-zinc-500">
                E-posta veya parola değişikliği için <strong className="text-zinc-400">Güvenlik</strong> sekmesine geç.
              </p>
            </div>
          </div>
          </SectionCard>

          <SectionCard title="Profil ve iletişim" className="bg-pf-card/40">
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="text-xs text-zinc-400">Ad soyad *</span>
                <input
                  className={`mt-1 w-full ${ctl} ${bErr("FullName")}`}
                  value={s.fullName}
                  onChange={(e) => setS({ ...s, fullName: e.target.value })}
                />
                {fe("FullName") ? <p className="mt-1 text-xs text-red-300">{fe("FullName")}</p> : null}
              </label>
              <label className="block">
                <span className="text-xs text-zinc-400">Telefon</span>
                <input
                  className={`mt-1 w-full ${ctl} ${bErr("PhoneNumber")}`}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05xx…"
                />
              </label>
              <div className="flex items-end">
                <button
                  type="button"
                  disabled={savingPhone}
                  onClick={() => void savePhone()}
                  className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/5 disabled:opacity-50"
                >
                  {savingPhone ? "…" : "Telefonu kaydet"}
                </button>
              </div>
              <label className="block">
                <span className="text-xs text-zinc-400">Cinsiyet</span>
                <select
                  className={`mt-1 w-full ${ctl} ${bErr("Gender")}`}
                  value={pickGender}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPickGender(v);
                    if (v === SELECT_OTHER) setS({ ...s, gender: null });
                    else setS({ ...s, gender: v || null });
                  }}
                >
                  {genderSelectOptions.map((o) => (
                    <option key={o.value || "empty"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {pickGender === SELECT_OTHER ? (
                  <input
                    className={`mt-2 w-full ${ctl} ${bErr("Gender")}`}
                    maxLength={32}
                    value={s.gender ?? ""}
                    onChange={(e) => setS({ ...s, gender: e.target.value || null })}
                    placeholder="Kısaca yazın (en fazla 32 karakter)"
                  />
                ) : null}
              </label>
              <label className="block">
                <span className="text-xs text-zinc-400">Doğum tarihi</span>
                <input
                  type="date"
                  className={`mt-1 w-full ${ctl} ${bErr("BirthDate")}`}
                  value={birthDateToInput(s.birthDate ?? undefined)}
                  onChange={(e) => setS({ ...s, birthDate: e.target.value || null })}
                />
              </label>
              <div className="block space-y-1">
                <span className="text-xs text-zinc-400">Boy (cm)</span>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <select
                    defaultValue=""
                    aria-label="Boy hızlı seçim"
                    className={`${ctl} ${bErr("HeightCm")} max-w-[11rem] text-sm`}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v) setS({ ...s, heightCm: Number(v) });
                      e.currentTarget.value = "";
                    }}
                  >
                    <option value="">Hızlı seç…</option>
                    {HEIGHT_QUICK_CM.map((h) => (
                      <option key={h} value={h}>
                        ~{h} cm
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.1"
                    className={`min-w-[6rem] flex-1 ${ctl} ${bErr("HeightCm")}`}
                    value={s.heightCm ?? ""}
                    onChange={(e) => setS({ ...s, heightCm: e.target.value === "" ? null : Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="block space-y-1">
                <span className="text-xs text-zinc-400">Güncel kilo (kg)</span>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <select
                    defaultValue=""
                    aria-label="Kilo hızlı seçim"
                    className={`${ctl} ${bErr("CurrentWeightKg")} max-w-[11rem] text-sm`}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v) setS({ ...s, currentWeightKg: Number(v) });
                      e.currentTarget.value = "";
                    }}
                  >
                    <option value="">Hızlı seç…</option>
                    {WEIGHT_QUICK_KG.map((w) => (
                      <option key={w} value={w}>
                        ~{w} kg
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.1"
                    className={`min-w-[6rem] flex-1 ${ctl} ${bErr("CurrentWeightKg")}`}
                    value={s.currentWeightKg ?? ""}
                    onChange={(e) => setS({ ...s, currentWeightKg: e.target.value === "" ? null : Number(e.target.value) })}
                  />
                </div>
              </div>
              <label className="block md:col-span-2">
                <span className="text-xs text-zinc-400">Kan grubu</span>
                <select
                  className={`mt-1 w-full ${ctl} ${bErr("BloodType")}`}
                  value={pickBlood}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPickBlood(v);
                    if (v === SELECT_OTHER) setS({ ...s, bloodType: null });
                    else setS({ ...s, bloodType: v || null });
                  }}
                >
                  {bloodTypeSelectOptions.map((o) => (
                    <option key={o.value || "empty"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {pickBlood === SELECT_OTHER ? (
                  <input
                    className={`mt-2 w-full ${ctl} ${bErr("BloodType")}`}
                    maxLength={8}
                    value={s.bloodType ?? ""}
                    onChange={(e) => setS({ ...s, bloodType: e.target.value || null })}
                    placeholder="Örn. A+ veya kısa not (en fazla 8 karakter)"
                  />
                ) : null}
              </label>
              <label className="block md:col-span-2">
                <span className="text-xs text-zinc-400">Acil durum / sağlık notu (koç için)</span>
                <textarea
                  className={`mt-1 min-h-[64px] w-full ${ctl} ${bErr("EmergencyNote")}`}
                  value={s.emergencyNote ?? ""}
                  onChange={(e) => setS({ ...s, emergencyNote: e.target.value || null })}
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-xs text-zinc-400">Hedef tercihi (form önerisi)</span>
                <select
                  className={`mt-1 w-full ${ctl} ${bErr("DefaultGoalType")}`}
                  value={s.defaultGoalType ?? ""}
                  onChange={(e) =>
                    setS({
                      ...s,
                      defaultGoalType: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                >
                  <option value="">Seçilmedi</option>
                  {goalOptions.map((g) => (
                    <option key={g.v} value={g.v}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block md:col-span-2">
                <span className="text-xs text-zinc-400">Genel notlar</span>
                <textarea
                  className={`mt-1 min-h-[72px] w-full ${ctl} ${bErr("Notes")}`}
                  value={s.notes ?? ""}
                  onChange={(e) => setS({ ...s, notes: e.target.value || null })}
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-xs text-zinc-400">Şehir</span>
                <select
                  className={`mt-1 w-full ${ctl} ${bErr("City")}`}
                  value={pickCity}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPickCity(v);
                    if (v === SELECT_OTHER) setS({ ...s, city: null });
                    else setS({ ...s, city: v || null });
                  }}
                >
                  {turkeyCitySelectOptions.map((o) => (
                    <option key={o.value || "empty"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {pickCity === SELECT_OTHER ? (
                  <input
                    className={`mt-2 w-full ${ctl} ${bErr("City")}`}
                    value={s.city ?? ""}
                    onChange={(e) => setS({ ...s, city: e.target.value || null })}
                    placeholder="Şehir veya ilçe adı"
                  />
                ) : null}
              </label>
              <label className="block md:col-span-2">
                <span className="text-xs text-zinc-400">Ülke</span>
                <select
                  className={`mt-1 w-full ${ctl} ${bErr("Country")}`}
                  value={pickCountry}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPickCountry(v);
                    if (v === SELECT_OTHER) setS({ ...s, country: null });
                    else setS({ ...s, country: v || null });
                  }}
                >
                  {countrySelectOptions.map((o) => (
                    <option key={o.value || "empty"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {pickCountry === SELECT_OTHER ? (
                  <input
                    className={`mt-2 w-full ${ctl} ${bErr("Country")}`}
                    value={s.country ?? ""}
                    onChange={(e) => setS({ ...s, country: e.target.value || null })}
                    placeholder="Ülke adı"
                  />
                ) : null}
              </label>
              <label className="block md:col-span-2">
                <span className="text-xs text-zinc-400">Meslek</span>
                <select
                  className={`mt-1 w-full ${ctl} ${bErr("Occupation")}`}
                  value={pickOcc}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPickOcc(v);
                    if (v === SELECT_OTHER) setS({ ...s, occupation: null });
                    else setS({ ...s, occupation: v || null });
                  }}
                >
                  {occupationSelectOptions.map((o) => (
                    <option key={o.value || "empty"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {pickOcc === SELECT_OTHER ? (
                  <input
                    className={`mt-2 w-full ${ctl} ${bErr("Occupation")}`}
                    value={s.occupation ?? ""}
                    onChange={(e) => setS({ ...s, occupation: e.target.value || null })}
                    placeholder="Meslek"
                  />
                ) : null}
              </label>
            </div>

            <div className="mt-6 border-t border-white/10 pt-4">
              <h3 className="text-sm font-semibold text-zinc-200">Sosyal bağlantılar (isteğe bağlı)</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {(
                  [
                    ["instagramUrl", "Instagram", "InstagramUrl"],
                    ["linkedInUrl", "LinkedIn", "LinkedInUrl"],
                    ["twitterXUrl", "X (Twitter)", "TwitterXUrl"],
                    ["youtubeUrl", "YouTube", "YoutubeUrl"],
                    ["tikTokUrl", "TikTok", "TikTokUrl"],
                    ["facebookUrl", "Facebook", "FacebookUrl"],
                    ["websiteUrl", "Web sitesi", "WebsiteUrl"],
                  ] as const
                ).map(([key, label, errKey]) => {
                  const soc = s.social ?? {};
                  const val = (soc as Record<string, string | null | undefined>)[key] ?? "";
                  return (
                    <label key={key} className="block">
                      <span className="text-xs text-zinc-400">{label}</span>
                      <input
                        className={`mt-1 w-full ${ctl} ${fe(errKey) ? "border-red-500/50" : "border-white/15"}`}
                        value={val}
                        onChange={(e) =>
                          setS({
                            ...s,
                            social: { ...s.social, [key]: e.target.value || null },
                          })
                        }
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-4">
              <h3 className="text-sm font-semibold text-zinc-200">Profil fotoğrafı</h3>
              <div className="mt-2 flex flex-wrap items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  className="text-xs text-zinc-400 file:mr-2 file:rounded file:border-0 file:bg-pf-orange-bright file:px-2 file:py-1 file:text-black"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                />
                {photoUrl ? (
                  <label className="flex items-center gap-2 text-sm text-zinc-300">
                    <input type="checkbox" checked={removePhoto} onChange={(e) => setRemovePhoto(e.target.checked)} />
                    Mevcut fotoğrafı kaldır
                  </label>
                ) : null}
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                disabled={savingProfile}
                onClick={() => void saveProfile()}
                className="rounded-xl bg-pf-orange-bright px-6 py-2.5 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
              >
                {savingProfile ? "Kaydediliyor…" : "Profili kaydet"}
              </button>
            </div>
          </SectionCard>
        </>
      ) : null}

      {tab === "security" ? (
        <AccountSecurityCard accessToken={accessToken} hasPassword={meta.hasPassword} onUpdated={onProfileUpdated} />
      ) : null}
    </div>
  );
}
