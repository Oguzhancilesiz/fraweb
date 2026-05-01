/** Sunucu `MonthlyAssessmentEditVm` + istemci genişletmeleri (opsiyonel alanlar API’ye eklendiğinde kullanılır). */
export type AssessmentPhotoRow = {
  publicId: string;
  fileName: string;
  photoType: number;
};

export type EditVmJson = {
  id: number;
  year: number;
  month: number;
  fullName: string;
  photoSubmitHint?: string | null;
  goalType: number;
  age: number;
  heightCm: number;
  weightKg: number;
  healthIssues?: string | null;
  injuryText?: string | null;
  hasUsedSteroids: boolean;
  steroidUsageText?: string | null;
  willUseSupplements: boolean;
  supplementText?: string | null;
  trainingHistoryText?: string | null;
  weeklyTrainingDays: number;
  preferredTrainingDaysMask: number;
  preferredTrainingTime?: string | null;
  dailyTrainingHours: number;
  bloodType?: string | null;
  foodAllergiesText?: string | null;
  recentDietOrSpecialPracticeText?: string | null;
  hasHomeCardioEquipment: boolean;
  homeCardioEquipmentText?: string | null;
  dailyNutritionText?: string | null;
  dailyWaterConsumptionText?: string | null;
  motivationText?: string | null;
  neckCm?: number | null;
  shoulderCm?: number | null;
  chestCm?: number | null;
  waistCm?: number | null;
  bicepsCm?: number | null;
  hipCm?: number | null;
  upperLegCm?: number | null;
  calfCm?: number | null;
  studentNote?: string | null;
  existingPhotos?: AssessmentPhotoRow[];
  profilePrefillApplied?: boolean;
  draftSaveNote?: string | null;
  /** Sunucu henüz göndermiyorsa undefined; geldiğinde ölçü kartlarında fark gösterilir. */
  previousMonthMeasurementsCm?: Partial<Record<MeasurementFieldKey, number>> | null;
};

export type MeasurementFieldKey =
  | "neckCm"
  | "shoulderCm"
  | "chestCm"
  | "waistCm"
  | "bicepsCm"
  | "hipCm"
  | "upperLegCm"
  | "calfCm";
