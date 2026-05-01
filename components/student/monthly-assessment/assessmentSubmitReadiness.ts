import { ASSESSMENT_PROGRESS_PHOTO_ORDERED_TYPES } from "@/lib/assessment-progress-photo-instructions";
import type { EditVmJson } from "./assessmentEditorTypes";
import { photoSlotCount } from "./assessmentEditorFormData";

export function countDaysInMask(mask: number): number {
  let n = 0;
  for (let b = 1; b <= 64; b <<= 1) {
    if ((mask & b) !== 0) n++;
  }
  return n;
}

export function slotPhotoSatisfied(
  vm: EditVmJson,
  removePhotoIds: Set<string>,
  photoFiles: (File | null)[],
  slotIndex: number,
): boolean {
  const wantType = ASSESSMENT_PROGRESS_PHOTO_ORDERED_TYPES[slotIndex]!;
  if (photoFiles[slotIndex]?.size) return true;
  const existing = vm.existingPhotos?.find((p) => p.photoType === wantType);
  if (!existing) return false;
  return !removePhotoIds.has(existing.publicId);
}

export function allProgressPhotosReady(
  vm: EditVmJson,
  removePhotoIds: Set<string>,
  photoFiles: (File | null)[],
): boolean {
  for (let i = 0; i < photoSlotCount; i++) {
    if (!slotPhotoSatisfied(vm, removePhotoIds, photoFiles, i)) return false;
  }
  return true;
}

const HEALTH_NONE_SENTINEL = "Kronik rahatsızlığım yok.";

export function healthSectionAnswered(vm: EditVmJson): boolean {
  const h = (vm.healthIssues ?? "").trim();
  const inj = (vm.injuryText ?? "").trim();
  if (inj.length > 0) return true;
  if (h.length > 0) return true;
  return false;
}

export function isHealthExplicitlyNone(vm: EditVmJson): boolean {
  return (vm.healthIssues ?? "").trim() === HEALTH_NONE_SENTINEL;
}

export { HEALTH_NONE_SENTINEL };

export function goalSelected(vm: EditVmJson): boolean {
  return Number.isFinite(vm.goalType) && vm.goalType >= 0 && vm.goalType <= 4;
}

/** Gönderim öncesi kullanıcı dostu eksik listesi (sunucu kurallarıyla uyumlu). */
export function getSubmitBlockers(
  vm: EditVmJson,
  removePhotoIds: Set<string>,
  photoFiles: (File | null)[],
): string[] {
  const out: string[] = [];
  if (!goalSelected(vm)) out.push("Hedef seçimi");
  if (!(vm.fullName ?? "").trim()) out.push("Ad soyad (profilden)");
  if (!Number.isFinite(vm.age) || vm.age < 10 || vm.age > 100) out.push("Yaş (10–100)");
  if (!Number.isFinite(vm.heightCm) || vm.heightCm <= 0 || vm.heightCm > 300) out.push("Boy (cm)");
  if (!Number.isFinite(vm.weightKg) || vm.weightKg <= 0 || vm.weightKg > 500) out.push("Kilo (kg)");
  if (!healthSectionAnswered(vm)) out.push("Sağlık bilgisi");
  if (!Number.isFinite(vm.weeklyTrainingDays) || vm.weeklyTrainingDays < 1 || vm.weeklyTrainingDays > 7) {
    out.push("Haftalık antrenman günü");
  }
  const th = (vm.trainingHistoryText ?? "").trim();
  if (th.length < 10) out.push("Antrenman geçmişi (en az 10 karakter)");
  if (!Number.isFinite(vm.dailyTrainingHours) || vm.dailyTrainingHours <= 0 || vm.dailyTrainingHours > 24) {
    out.push("Günlük antrenman süresi");
  }
  if (!(vm.motivationText ?? "").trim()) out.push("Motivasyon / hedef metni");
  if (!(vm.dailyNutritionText ?? "").trim()) out.push("Günlük beslenme özeti");
  if (!(vm.dailyWaterConsumptionText ?? "").trim()) out.push("Su tüketimi");
  if (vm.hasUsedSteroids && !(vm.steroidUsageText ?? "").trim()) out.push("Steroid kullanım notu");
  if (!allProgressPhotosReady(vm, removePhotoIds, photoFiles)) out.push("5 ilerleme fotoğrafı");
  return out;
}

function hasAnyMeasurement(vm: EditVmJson): boolean {
  return [vm.neckCm, vm.shoulderCm, vm.chestCm, vm.waistCm, vm.bicepsCm, vm.hipCm, vm.upperLegCm, vm.calfCm].some(
    (x) => x != null && Number(x) > 0,
  );
}

export function sectionCompletion(
  vm: EditVmJson,
  removePhotoIds: Set<string>,
  photoFiles: (File | null)[],
  measurementAcknowledged: boolean,
): boolean[] {
  const s0 =
    goalSelected(vm) &&
    (vm.fullName ?? "").trim().length > 0 &&
    Number.isFinite(vm.age) &&
    vm.age >= 10 &&
    vm.age <= 100 &&
    vm.heightCm > 0 &&
    vm.heightCm <= 300 &&
    vm.weightKg > 0 &&
    vm.weightKg <= 500;
  const s1 = healthSectionAnswered(vm);
  const s2 =
    vm.weeklyTrainingDays >= 1 &&
    vm.weeklyTrainingDays <= 7 &&
    (vm.trainingHistoryText ?? "").trim().length >= 10 &&
    vm.dailyTrainingHours > 0 &&
    vm.dailyTrainingHours <= 24;
  const s3 =
    !!(vm.dailyWaterConsumptionText ?? "").trim() &&
    !!(vm.dailyNutritionText ?? "").trim() &&
    !!(vm.motivationText ?? "").trim();
  const s4 = measurementAcknowledged || hasAnyMeasurement(vm);
  const s5 = allProgressPhotosReady(vm, removePhotoIds, photoFiles);
  return [s0, s1, s2, s3, s4, s5];
}
