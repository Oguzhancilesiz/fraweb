/** API `StudentHomeOverviewDto` ile uyumlu (camelCase). */
export type StudentHomeOverviewJson = {
  activePackage?: {
    studentPackageId?: number;
    packageName: string;
    packageSlug?: string;
    packageTagline?: string | null;
    startsAtUtc?: string;
    endsAtUtc: string;
    liveChatStatusSummary?: string;
    monthlyQaAllowanceDisplay?: string;
    totalVideoCallSessionsDisplay?: string;
    packageHighlights?: string[];
    packageHighlightsPreview?: string[];
    includesWhatsAppSupport?: boolean;
    includesVoiceReplies?: boolean;
    includesBloodWorkReview?: boolean;
    includesIntoleranceTest?: boolean;
    includesCyclePlanning?: boolean;
    includesLiveCoachChat?: boolean;
  } | null;
  currentProgram?: {
    title: string;
    goalSummary?: string | null;
    startDate: string;
    endDate: string;
    versionNo: number;
  } | null;
  programWorkoutDaysCompleted: number;
  programWorkoutDaysPlanned: number;
  programWorkoutCompletionPercent: number;
  activePackageTimelineBarPercent: number;
  activePackageDaysRemaining: number;
  packageHighlightPreviewLines: string[];
};

export type CoachDashboardMetricsJson = {
  activeStudentCount: number;
  pendingAssessmentReviewCount: number;
  activeProgramsCount: number;
  activePackageWithoutPublishedProgramCount: number;
  submittedAssessmentWithoutLinkedProgramCount: number;
  draftProgramsCount: number;
};

export type CoachStudentListItemJson = {
  studentUserId: string;
  email: string;
  displayName?: string | null;
  packageName?: string | null;
  packageEndsAtUtc?: string | null;
  lastAssessmentSummary?: string | null;
  latestAssessmentFormId?: number | null;
  latestAssessmentStatus?: number | null;
  latestAssessmentSubmittedAtUtc?: string | null;
  hasLinkedProgramForLatestAssessment?: boolean;
  linkedProgramIdForLatestAssessment?: number | null;
  linkedProgramStatus?: number | null;
};

export type CoachStudentsListResponse = {
  dashboard: CoachDashboardMetricsJson;
  page: {
    items: CoachStudentListItemJson[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  sortBy: string;
  sortDescending: boolean;
  assessmentFilter: string;
  programGapFilter: string;
};

export type CoachDirectoryEntryJson = {
  coachUserId: string;
  displayName: string;
  bioPreview?: string | null;
  photoUrl?: string | null;
  likeCount: number;
  likedByMe: boolean;
};

export type CoachHomeOverviewJson = {
  metrics: CoachDashboardMetricsJson;
  activityByMonth: unknown[];
  latestFormStatusSlices: unknown[];
  programStatusSlices: unknown[];
  hasMonthlyAssessmentChartActivity: boolean;
  latestFormSlicesTotalCount: number;
  programSlicesTotalCount: number;
  dashboardChartsJson: string;
};

export type StudentProgramOverviewJson = {
  hasProgram: boolean;
  assessmentCallout?: string;
  dayLinksEnabled?: boolean;
  progress?: {
    // Yeni API alanları (MyProgramProgressSnapshot)
    trainingDayTotal?: number;
    daysCompleted?: number;
    exerciseLineTotal?: number;
    exerciseLinesLoggedDone?: number;
    trainingDaysCompletedPercent?: number;
    exerciseLoggedPercent?: number;
    // Geriye dönük alanlar
    completedDays?: number;
    totalDays?: number;
    completionPercent?: number;
    completedExercises?: number;
    totalExercises?: number;
  };
  program?: {
    id: number;
    title: string;
    goalSummary?: string | null;
    startDate: string;
    endDate: string;
    versionNo: number;
    isCurrent: boolean;
    programStatus: number;
    weeks: Array<{
      id?: number | null;
      weekNumber: number;
      title?: string | null;
      days: Array<{
        id?: number | null;
        dayNumber: number;
        dayLabel: string;
        isRestDay: boolean;
        notes?: string | null;
        myLog?: {
          completionStatus: number;
          completedAtUtc?: string | null;
          studentFeedback?: string | null;
          painOrIssueNote?: string | null;
          energyScore?: number | null;
          difficultyScore?: number | null;
        } | null;
        exercises?: Array<{
          id?: number | null;
          sortOrder: number;
          resolvedName?: string | null;
          customExerciseName?: string | null;
          libraryDescription?: string | null;
          libraryDetailedDescription?: string | null;
          videoEmbedUrl?: string | null;
          sets: number;
          reps?: string | null;
          restSeconds?: number | null;
          tempo?: string | null;
          rir?: number | null;
          durationMinutes?: number | null;
          distanceKm?: number | null;
          notes?: string | null;
          libraryImagePath?: string | null;
          videoWatchUrl?: string | null;
          myExerciseLog?: {
            completionStatus: number;
            completedAtUtc?: string | null;
            studentNote?: string | null;
          } | null;
        }>;
        completedOrPartialExerciseCount?: number;
      }>;
    }>;
  };
  empty?: {
    callout: string;
    assessmentFormId?: number | null;
  };
};

export type StudentAssessmentCycleJson = {
  renewalWindowDays: number;
  hasActiveEntitledPackage: boolean;
  requiresFirstSubmittedEvaluation: boolean;
  topPeriodNeedsRevision: boolean;
  awaitingPublishedProgram: boolean;
  currentProgramId?: number | null;
  programStartDate?: string | null;
  programEndDate?: string | null;
  daysUntilProgramEnd?: number | null;
  inRenewalWindow: boolean;
  programLinkedAssessmentFormId?: number | null;
  newMonthlyDraftBlocked: boolean;
  requiresRenewalEvaluation: boolean;
  bannerMessageTr?: string | null;
};

export type StudentMonthlyAssessmentListItemJson = {
  id: number;
  publicId: string;
  year: number;
  month: number;
  formStatus: number;
  submittedAtUtc?: string | null;
  sensitivePreview?: string | null;
  linkedTrainingProgramId?: number | null;
  linkedTrainingProgramStatus?: number | null;
};

export type StudentMonthlyAssessmentIndexJson = {
  items: StudentMonthlyAssessmentListItemJson[];
  totalCount: number;
  draftCount: number;
  beyondDraftCount: number;
  currentCalendarMonthTitleTr: string;
  hasCurrentCalendarMonthRecord: boolean;
  currentCalendarMonthIsDraft: boolean;
  calendarReferenceYear: number;
  calendarReferenceMonth: number;
  currentCalendarMonthItem?: StudentMonthlyAssessmentListItemJson | null;
  /** API v2+: program dönem / yenileme penceresi; eski cevapda olmayabilir. */
  assessmentCycle?: StudentAssessmentCycleJson;
};

/** `GET /api/v1/student/my-packages` satırı — `StudentPackageRowDto` ile uyumlu. */
export type StudentPackageRowJson = {
  studentPackageId: number;
  packageName: string;
  packageSlug: string;
  packageTagline?: string | null;
  packageHighlights?: string[];
  packageHighlightsPreview?: string[];
  /** `StudentPackageStatus`: 0 bekliyor, 1 aktif, 2 süresi doldu, 3 iptal */
  status?: number;
  startsAtUtc: string;
  endsAtUtc: string;
  activatedAtUtc?: string | null;
  paidAmount?: number | null;
  currency?: string | null;
  paidAtUtc?: string | null;
  paymentReference?: string | null;
  monthlyQaAllowanceDisplay?: string;
  totalVideoCallSessionsDisplay?: string;
  includesWhatsAppSupport?: boolean;
  includesVoiceReplies?: boolean;
  includesBloodWorkReview?: boolean;
  includesIntoleranceTest?: boolean;
  includesCyclePlanning?: boolean;
  includesLiveCoachChat?: boolean;
  /** -1 = sınırsız mesaj kotası (sunucu sözleşmesi). */
  liveChatMessageQuota?: number;
  liveChatImageQuota?: number;
  liveChatMessagesUsed?: number;
  liveChatImagesUsed?: number;
  liveChatStatusSummary?: string;
};

export type StudentLiveChatThreadJson = {
  studentPackageId: number;
  coachDisplayName: string;
  coachUserId?: string | null;
  chatEnabled: boolean;
  disabledReason?: string | null;
  studentMessagesUsed: number;
  studentMessagesQuota: number;
  studentImagesUsed: number;
  studentImagesQuota: number;
  studentMaySend: boolean;
  coachMaySend?: boolean;
  /** İlk yüklemede daha eski mesaj var mı (sunucu N+1). */
  hasMoreOlderMessages?: boolean;
  messages: Array<{
    id: number;
    senderIsCoach: boolean;
    bodyText?: string | null;
    createdAtUtc: string;
    attachments: Array<{ id: number; fileName?: string; contentType?: string }>;
  }>;
};

export type LiveChatOlderMessagesPageJson = {
  messages: StudentLiveChatThreadJson["messages"];
  hasMore: boolean;
};
