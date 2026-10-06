import type { EntryType, TimelineEntry } from '@/domain/timeline/types'
import { trainingWizard } from './training'
import { schoolWizard } from './school'
import { jobWizard } from './job'
import { careerBreakWizard } from './careerBreak'
import { volunteeringWizard } from './volunteering'
import { stepForField, type WizardDefinition } from './types'

export const wizards = {
  training: trainingWizard,
  school: schoolWizard,
  professional_experience: jobWizard,
  career_break: careerBreakWizard,
  volunteering: volunteeringWizard,
} as unknown as Record<EntryType, WizardDefinition<TimelineEntry>>

export function fixStep(type: EntryType, field?: string): string | undefined {
  const def = wizards[type]
  // Dates that share a summary row are answered on separate screens.
  if (field === 'ongoing') return def.steps.find((s) => s.id === 'ongoing')?.id
  return stepForField(def, field)
}

export { trainingWizard, schoolWizard, jobWizard, careerBreakWizard, volunteeringWizard }
