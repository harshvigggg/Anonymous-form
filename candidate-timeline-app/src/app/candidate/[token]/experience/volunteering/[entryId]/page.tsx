'use client'

import { Suspense } from 'react'
import { useParams } from 'next/navigation'
import { EntryWizard } from '@/components/candidate/EntryWizard'
import { volunteeringWizard } from '@/components/candidate/wizards'

export default function Page() {
  const { entryId } = useParams<{ entryId: string }>()
  return (
    <Suspense>
      <EntryWizard definition={volunteeringWizard} entryId={entryId} />
    </Suspense>
  )
}
