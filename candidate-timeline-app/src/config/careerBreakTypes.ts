import type { CatalogOption } from './types'

export interface CareerBreakType extends CatalogOption {
  /** Short name shown on timeline cards, e.g. "Job Seeking". */
  short: string
}

/** Target field: "Type of career break". */
export const careerBreakTypes: CareerBreakType[] = [
  { id: 'job_seeking', label: 'Looking for a job', short: 'Job Seeking', icon: '🔎', target: 'Job seeking' },
  { id: 'training_search', label: 'Looking for training / study', short: 'Looking for Training', icon: '🎒', target: 'Searching for training or study place' },
  { id: 'learning_german', label: 'Learning German', short: 'Learning German', icon: '🇩🇪', target: 'Language course' },
  { id: 'exam_preparation', label: 'Exam preparation', short: 'Exam Preparation', icon: '📚', target: 'Exam preparation' },
  { id: 'caregiving', label: 'Caregiving / family responsibility', short: 'Family Responsibility', icon: '👪', target: 'Care of relatives / family responsibility' },
  { id: 'parental_leave', label: 'Parental leave', short: 'Parental Leave', icon: '👶', target: 'Parental leave' },
  { id: 'illness', label: 'Illness', short: 'Illness', icon: '🤒', target: 'Illness' },
  { id: 'military', label: 'Military service', short: 'Military Service', icon: '🎖️', target: 'Military service' },
  { id: 'relocation', label: 'Relocation', short: 'Relocation', icon: '📦', target: 'Relocation' },
  { id: 'bereavement', label: 'Bereavement', short: 'Bereavement', icon: '🕊️', target: 'Bereavement' },
  { id: 'integration_course', label: 'Integration course', short: 'Integration Course', icon: '🤝', target: 'Integration course' },
  { id: 'voluntary', label: 'Voluntary activity', short: 'Voluntary Activity', icon: '❤️', target: 'Voluntary activity' },
  { id: 'other', label: 'Other', short: 'Other', icon: '✏️', target: 'Other', requiresText: true },
]
