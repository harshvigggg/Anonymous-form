import type { ReactNode } from 'react'
import type { MasterOrg } from '@/config/institutions'
import type { Params, Translate } from '@/i18n'
import type { ProfileValidation } from '@/domain/timeline/validators'
import type { EntryType, EvidenceFile, TimelineEntry } from '@/domain/timeline/types'

export interface WizardContext {
  token: string
  /** All entries (executive corrections applied) */
  entries: TimelineEntry[]
  validation: ProfileValidation
  orgAdditions: MasterOrg[]
  uploadEvidence: (file: File) => Promise<EvidenceFile>
}

export interface StepRenderProps<E extends TimelineEntry> {
  values: E
  /** Update answers. Pass a function to build on the latest values (safe for quick repeated taps). */
  set: (patch: Partial<E> | ((latest: E) => Partial<E>)) => void
  /** Move to the next screen (validates first). */
  next: () => void
  t: Translate
  ctx: WizardContext
}

export interface WizardStep<E extends TimelineEntry> {
  id: string
  /** i18n key of the question; Hindi helper uses the same key */
  question: string
  questionParams?: (v: E, ctx: WizardContext) => Params
  /** i18n key of a small help line */
  help?: string
  helpParams?: (v: E, ctx: WizardContext) => Params
  /** Entry fields answered on this screen – validated by the entry schema */
  fields: string[]
  /** Extra check for answers the schema cannot see (returns an i18n key) */
  check?: (v: E, ctx: WizardContext) => string | null
  visible?: (v: E, ctx: WizardContext) => boolean
  /** Optional screen – shows "Skip" which applies this patch */
  skip?: Partial<E>
  /** Content above the question (e.g. the missing period being explained) */
  intro?: (v: E, ctx: WizardContext, t: Translate) => ReactNode
  render: (p: StepRenderProps<E>) => ReactNode
  /** Value shown on the confirm screen; omit to hide the row */
  summary?: (v: E, ctx: WizardContext, t: Translate) => ReactNode
  summaryLabel?: string
  /** Show the summary row even while the step is hidden; "Change" applies `reveal` first */
  summaryWhenHidden?: boolean
  reveal?: Partial<E>
}

export interface WizardDefinition<E extends TimelineEntry> {
  type: EntryType
  steps: WizardStep<E>[]
  /** Pre-fill a brand-new entry (e.g. dates from a detected gap) */
  prepare?: (entry: E, ctx: WizardContext, search: URLSearchParams) => E
  /** Where "Back" from the first screen goes */
  backPath: (token: string) => string
}

/** Screen that answers a given field – used for "Fix" links. */
export function stepForField(def: WizardDefinition<TimelineEntry>, field: string | undefined): string | undefined {
  if (!field) return undefined
  return def.steps.find((s) => s.fields.includes(field))?.id
}
