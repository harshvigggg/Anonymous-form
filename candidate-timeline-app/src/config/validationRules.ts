/**
 * Tunable thresholds for the timeline and validation engines.
 * Change these here – never inside components.
 */
export const timelineRules = {
  /** Uncovered periods longer than this (day-level dates) become gaps. */
  minGapDays: 30,
  /** Two entries must share at least this many whole months to count as an overlap. */
  minOverlapMonths: 2,
}

export const entryRules = {
  /** Target system limit for selected tasks. */
  maxTasks: 15,
  minTasks: 1,
  /** Diploma date this many months after course end creates a warning. */
  diplomaLateMonths: 24,
  /** Diploma date more than this many months before course end is a blocking error. */
  diplomaEarlyBlockingMonths: 1,
  /** Earliest year shown in date pickers. */
  minYear: 1970,
}

export const textLimits = {
  shortText: 120,
  sentence: 200,
  longText: 1000,
}

/** Weights for the executive-facing profile quality score (must add up to 100). */
export const qualityWeights = {
  timelineCompleteness: 40,
  requiredFields: 25,
  verifiedInstitutions: 10,
  verifiedEmployers: 10,
  dateConfidence: 10,
  warnings: 5,
}

export const evidenceRules = {
  maxImageSide: 1600,
  imageQuality: 0.72,
  maxRemoteBytes: 4 * 1024 * 1024,
  maxLocalBytes: 900 * 1024,
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'],
}
