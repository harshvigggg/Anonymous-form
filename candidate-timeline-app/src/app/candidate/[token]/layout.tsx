'use client'

import { useParams } from 'next/navigation'
import { CandidateProvider } from '@/components/candidate/CandidateProvider'
import { CandidateStateScreen } from '@/components/candidate/CandidateChrome'

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const { token } = useParams<{ token: string }>()
  return (
    <CandidateProvider token={token} renderState={(state, retry) => <CandidateStateScreen state={state} retry={retry} />}>
      {children}
    </CandidateProvider>
  )
}
