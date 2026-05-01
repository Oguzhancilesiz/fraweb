export type PublicSiteSeoBlock = {
  title: string;
  metaDescription: string;
};

export type PublicSiteMeta = {
  supportEmail: string;
  publicBaseUrl: string | null;
  pages: {
    landing: PublicSiteSeoBlock;
    privacy: PublicSiteSeoBlock;
    terms: PublicSiteSeoBlock;
    howItWorks: PublicSiteSeoBlock;
    contact: PublicSiteSeoBlock;
  };
};

export type PublicPackageListItem = {
  id: number;
  publicId: string;
  name: string;
  slug: string;
  tagline?: string | null;
  description?: string | null;
  highlightLines: string[];
  highlightLinesShopPreview: string[];
  displayPriceText?: string | null;
  priceAmount: number;
  currency: string;
  durationDays: number;
  packageTier?: string | null;
  isPurchasable: boolean;
  includesLiveCoachChat: boolean;
};

export type PublicPackageDetailResponse = {
  package: PublicPackageListItem & {
    detailedDescription?: string | null;
    maxProgramsActive?: number;
    allowsMonthlyAssessment?: boolean;
    maxAssessmentsPerMonth?: number;
    monthlyQaAllowance?: number;
    totalVideoCallSessions?: number;
    includesWhatsAppSupport?: boolean;
    includesVoiceReplies?: boolean;
    includesBloodWorkReview?: boolean;
    includesIntoleranceTest?: boolean;
    includesCyclePlanning?: boolean;
    liveChatStudentMessageQuota?: number;
    liveChatStudentImageQuota?: number;
  };
  checkoutWithAccount: boolean;
  selectableCoaches: { id: string; displayName: string }[];
};
