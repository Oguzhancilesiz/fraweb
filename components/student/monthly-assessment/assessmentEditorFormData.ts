import type { EditVmJson } from "./assessmentEditorTypes";
import { stripSelectPlaceholder } from "@/components/profile/studentProfileFieldOptions";

export const photoSlotCount = 5;

function appendBool(fd: FormData, key: string, v: boolean) {
  fd.append(key, v ? "true" : "false");
}

function appendNullable(fd: FormData, key: string, v: string | number | undefined | null) {
  if (v === undefined || v === null || v === "") return;
  fd.append(key, String(v));
}

/** Form alanlarında ondalık ayırıcı her zaman nokta (Invariant ile uyumlu). */
function formatDecimalInvariant(n: number): string {
  if (!Number.isFinite(n)) return "";
  return String(n);
}

function appendNullableDecimalCm(fd: FormData, key: string, v: number | undefined | null) {
  if (v === undefined || v === null) return;
  if (!Number.isFinite(Number(v))) return;
  fd.append(key, formatDecimalInvariant(Number(v)));
}

function inputToTimePayload(v: string): string | undefined {
  const t = v.trim();
  if (!t) return undefined;
  const parts = t.split(":");
  if (parts.length >= 2) {
    const h = parts[0]!.padStart(2, "0");
    const m = parts[1]!.slice(0, 2).padStart(2, "0");
    return `${h}:${m}:00`;
  }
  return t;
}

export function timeToInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = /^(\d{1,2}):(\d{2})/.exec(iso.trim());
  if (!m) return "";
  return `${m[1]!.padStart(2, "0")}:${m[2]}`;
}

export function vmToFormData(
  vm: EditVmJson,
  removeIds: Set<string>,
  files: (File | null)[],
  preferredTime: string,
): FormData {
  const fd = new FormData();
  fd.append("Id", String(vm.id));
  fd.append("Year", String(vm.year));
  fd.append("Month", String(vm.month));
  fd.append("FullName", vm.fullName ?? "");
  fd.append("GoalType", String(vm.goalType));
  fd.append("Age", String(vm.age));
  fd.append("HeightCm", formatDecimalInvariant(Number(vm.heightCm)));
  fd.append("WeightKg", formatDecimalInvariant(Number(vm.weightKg)));
  appendNullable(fd, "HealthIssues", vm.healthIssues);
  appendNullable(fd, "InjuryText", vm.injuryText);
  appendBool(fd, "HasUsedSteroids", vm.hasUsedSteroids);
  appendNullable(fd, "SteroidUsageText", vm.steroidUsageText);
  appendBool(fd, "WillUseSupplements", vm.willUseSupplements);
  appendNullable(fd, "SupplementText", vm.supplementText);
  appendNullable(fd, "TrainingHistoryText", vm.trainingHistoryText);
  fd.append("WeeklyTrainingDays", String(vm.weeklyTrainingDays));
  fd.append("PreferredTrainingDaysMask", String(vm.preferredTrainingDaysMask));
  const pt = inputToTimePayload(preferredTime);
  if (pt) fd.append("PreferredTrainingTime", pt);
  fd.append("DailyTrainingHours", formatDecimalInvariant(Number(vm.dailyTrainingHours)));
  appendNullable(fd, "BloodType", stripSelectPlaceholder(vm.bloodType)?.slice(0, 8));
  appendNullable(fd, "FoodAllergiesText", vm.foodAllergiesText);
  appendNullable(fd, "RecentDietOrSpecialPracticeText", vm.recentDietOrSpecialPracticeText);
  appendBool(fd, "HasHomeCardioEquipment", vm.hasHomeCardioEquipment);
  appendNullable(fd, "HomeCardioEquipmentText", vm.homeCardioEquipmentText);
  appendNullable(fd, "DailyNutritionText", vm.dailyNutritionText);
  appendNullable(fd, "DailyWaterConsumptionText", vm.dailyWaterConsumptionText);
  appendNullable(fd, "MotivationText", vm.motivationText);
  appendNullableDecimalCm(fd, "NeckCm", vm.neckCm);
  appendNullableDecimalCm(fd, "ShoulderCm", vm.shoulderCm);
  appendNullableDecimalCm(fd, "ChestCm", vm.chestCm);
  appendNullableDecimalCm(fd, "WaistCm", vm.waistCm);
  appendNullableDecimalCm(fd, "BicepsCm", vm.bicepsCm);
  appendNullableDecimalCm(fd, "HipCm", vm.hipCm);
  appendNullableDecimalCm(fd, "UpperLegCm", vm.upperLegCm);
  appendNullableDecimalCm(fd, "CalfCm", vm.calfCm);
  appendNullable(fd, "StudentNote", vm.studentNote);
  for (const id of removeIds) fd.append("RemovePhotoPublicIds", id);
  for (let i = 0; i < photoSlotCount; i++) {
    const f = files[i];
    if (f && f.size > 0) fd.append(`progressPhoto_${i}`, f);
  }
  return fd;
}

export function fieldClass(errs: Record<string, string[]>, key: string) {
  const has = errs[key]?.length || errs[""]?.length;
  return has ? "border-red-500/60 focus:border-pf-orange-bright" : "border-white/15";
}
