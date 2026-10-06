'use client'

import { useState } from 'react'
import { byId } from '@/config/types'
import { bedCountOptions } from '@/config/facilityTypes'
import { homeQualificationNames } from '@/config/qualifications'
import type { MasterOrg, OrgKind } from '@/config/institutions'
import { entryDates, entryTitle } from '@/domain/entries/entries'
import { formatRange } from '@/domain/dates'
import type { EntryOverride, OrgName, TimelineEntry, TimelineGap, ValidationIssue } from '@/domain/timeline/types'
import { t } from '@/i18n'
import { orgFromMaster, suggestOrg } from '@/lib/normalization/orgName'
import { Badge, Button, Card } from '@/components/ui'

export interface ReviewActions {
  accept: (issues: ValidationIssue[], note?: string) => void
  override: (entry: TimelineEntry, patch: Omit<EntryOverride, 'at' | 'by'>, resolves: ValidationIssue[], log: { field: string; from: unknown; to: unknown }) => void
  addOrg: (org: MasterOrg) => void
}

const input = 'min-h-[44px] w-full rounded-xl border-2 border-line px-3 outline-none focus:border-brand'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[160px_1fr]">
      <span className="text-[14px] font-semibold text-muted">{label}</span>
      <span className="break-words">{children}</span>
    </div>
  )
}

function OrgReview({ entry, field, org, issues, actions, additions }: { entry: TimelineEntry; field: 'institution' | 'facility'; org: OrgName; issues: ValidationIssue[]; actions: ReviewActions; additions: MasterOrg[] }) {
  const kind: OrgKind = field === 'facility' ? 'facility' : entry.type === 'school' ? 'school' : 'institution'
  const suggested = suggestOrg(org.rawValue, kind, additions)
  const unverified = issues.some((i) => i.code === 'INSTITUTION_UNVERIFIED' || i.code === 'FACILITY_UNVERIFIED')
  const [verifiedName, setVerifiedName] = useState(org.normalizedValue)
  const [german, setGerman] = useState(suggested?.germanName ?? org.germanValue ?? org.normalizedValue)
  const [addToMaster, setAddToMaster] = useState(true)

  const keep = () => {
    const next: OrgName = { ...org, verifiedValue: verifiedName.trim(), germanValue: german.trim(), germanStatus: 'verified', verificationStatus: 'verified' }
    actions.override(entry, { [field]: next }, issues, { field: `${field}_verified`, from: org.normalizedValue, to: next.verifiedValue })
    if (addToMaster) {
      actions.addOrg({
        id: `custom-${kind}-${verifiedName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${(entry.city ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        kind,
        normalizedName: verifiedName.trim(),
        germanName: german.trim(),
        city: entry.city ?? '',
        cityId: entry.cityId,
        country: entry.country ?? '',
        aliases: [...new Set([org.rawValue, org.normalizedValue].filter((a) => a !== verifiedName.trim()))],
        verificationStatus: 'verified',
        facilityType: entry.type === 'professional_experience' ? entry.facilityTypeId : null,
        bedCountId: entry.type === 'professional_experience' ? entry.bedCountId : null,
      })
    }
  }

  const useSuggested = () => {
    if (!suggested) return
    const next: OrgName = { ...orgFromMaster(suggested, org.rawValue), germanValue: german.trim() || suggested.germanName, germanStatus: 'verified', verificationStatus: 'verified', verifiedValue: suggested.normalizedName }
    actions.override(entry, { [field]: next }, issues, { field: `${field}_verified`, from: org.normalizedValue, to: suggested.normalizedName })
  }

  return (
    <div className="space-y-2">
      <Row label="Candidate entered">{org.rawValue}</Row>
      {org.normalizedValue !== org.rawValue && <Row label="Normalized">{org.normalizedValue}</Row>}
      {unverified && suggested && suggested.normalizedName !== org.normalizedValue && (
        <Row label="Suggested">
          <strong>{suggested.normalizedName}</strong>
          <span className="block text-[14px] text-muted">{[suggested.city, suggested.country].join(', ')}</span>
        </Row>
      )}
      {unverified && (
        <Row label="Verified name">
          <input className={input} value={verifiedName} onChange={(e) => setVerifiedName(e.target.value)} aria-label="Verified name" />
        </Row>
      )}
      <Row label="German name">
        <input className={input} value={german} onChange={(e) => setGerman(e.target.value)} aria-label="German name" />
      </Row>
      {unverified && (
        <label className="flex min-h-[44px] items-center gap-2 text-[15px]">
          <input type="checkbox" checked={addToMaster} onChange={(e) => setAddToMaster(e.target.checked)} className="h-5 w-5 accent-[var(--color-brand)]" />
          Add to the verified list (future candidates can select it)
        </label>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        {unverified && suggested && suggested.normalizedName !== org.normalizedValue && <Button size="md" onClick={useSuggested}>Use Suggested</Button>}
        {unverified ? (
          <Button size="md" variant="secondary" onClick={keep} disabled={!verifiedName.trim() || !german.trim()}>Keep Candidate Value</Button>
        ) : (
          <Button size="md" onClick={keep} disabled={!german.trim()}>Confirm German name</Button>
        )}
      </div>
    </div>
  )
}

export function ReviewWarningCard({
  issues,
  entry,
  gap,
  actions,
  additions,
}: {
  /** One or more issues about the same thing (e.g. "not verified" + "spelling changed") */
  issues: ValidationIssue[]
  entry?: TimelineEntry
  gap?: TimelineGap
  actions: ReviewActions
  additions: MasterOrg[]
}) {
  const [note, setNote] = useState('')
  const [beds, setBeds] = useState('')
  const [homeName, setHomeName] = useState('')
  const main = issues[0]
  const isError = main.severity === 'error'
  const title = issues.map((i) => t(i.message, { ...i.params, field: i.field ? t(`field.${i.field}`) : '' })).join(' · ')

  let body: React.ReactNode = null
  if (entry && (main.field === 'institution' || main.field === 'facility')) {
    const org = (entry as unknown as Record<string, OrgName | null>)[main.field]
    if (org) body = <OrgReview entry={entry} field={main.field} org={org} issues={issues} actions={actions} additions={additions} />
  } else if (entry?.type === 'professional_experience' && main.code === 'BED_COUNT_UNKNOWN') {
    body = (
      <div className="space-y-2">
        <Row label="Facility">{entry.facility?.verifiedValue || entry.facility?.normalizedValue}</Row>
        <Row label="Candidate selected">I don’t know</Row>
        <div className="flex flex-wrap items-center gap-2">
          <select className={`${input} max-w-[220px]`} value={beds} onChange={(e) => setBeds(e.target.value)} aria-label="Bed count">
            <option value="">Choose bed count…</option>
            {bedCountOptions.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>
          <Button size="md" disabled={!beds} onClick={() => actions.override(entry, { bedCountId: beds, bedCountUnknown: false }, issues, { field: 'bedCountId', from: null, to: beds })}>
            Add Bed Count
          </Button>
          <Button size="md" variant="secondary" onClick={() => actions.accept(issues)}>Accept Unknown</Button>
        </div>
      </div>
    )
  } else if (entry?.type === 'training' && main.code === 'RECOGNITION_UNCONFIRMED') {
    body = (
      <div className="flex flex-wrap gap-2">
        <Button size="md" onClick={() => actions.override(entry, { recognitionEligibility: 'eligible', recognitionSource: 'executive' }, issues, { field: 'recognitionEligibility', from: 'unknown', to: 'eligible' })}>Eligible</Button>
        <Button size="md" variant="secondary" onClick={() => actions.override(entry, { recognitionEligibility: 'not_eligible', recognitionSource: 'executive' }, issues, { field: 'recognitionEligibility', from: 'unknown', to: 'not_eligible' })}>Not eligible</Button>
      </div>
    )
  } else if (entry?.type === 'training' && main.code === 'QUALIFICATION_MAPPING_UNKNOWN') {
    body = (
      <div className="space-y-2">
        <Row label="Candidate entered">{entry.otherHomeQualification || entry.otherQualification || '—'}</Row>
        <div className="flex flex-wrap items-center gap-2">
          <select className={`${input} max-w-[340px]`} value={homeName} onChange={(e) => setHomeName(e.target.value)} aria-label="Home-country qualification">
            <option value="">Map to a known qualification…</option>
            {homeQualificationNames.filter((h) => h.id !== 'other').map((h) => <option key={h.id} value={h.id}>{h.label}</option>)}
          </select>
          <Button size="md" disabled={!homeName} onClick={() => actions.override(entry, { homeQualificationId: homeName }, issues, { field: 'homeQualificationId', from: 'other', to: byId(homeQualificationNames, homeName)?.target })}>
            Apply mapping
          </Button>
          <Button size="md" variant="secondary" onClick={() => actions.accept(issues)}>Accept as entered</Button>
        </div>
      </div>
    )
  } else {
    body = (
      <div className="flex flex-wrap items-center gap-2">
        <input className={`${input} max-w-[320px]`} placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Note" />
        <Button size="md" variant={isError ? 'warn' : 'primary'} onClick={() => actions.accept(issues, note || undefined)}>
          {isError ? (gap ? 'Accept this gap' : 'Accept') : 'Accept'}
        </Button>
      </div>
    )
  }

  return (
    <Card tone={isError ? 'danger' : 'warn'}>
      <div className="mb-3 flex flex-wrap items-start gap-2">
        <div className="flex-1">
          <p className="font-bold">{title}</p>
          {entry && <p className="text-[15px] text-muted">{entryTitle(entry)} · {entryDates(entry)}</p>}
          {gap && <p className="text-[15px] text-muted">{formatRange(gap.startDate, gap.endDate, gap.endIsPresent)} · {gap.durationMonthsApprox} month(s)</p>}
        </div>
        <Badge tone={isError ? 'danger' : 'warn'}>{isError ? 'Blocking' : 'Warning'}</Badge>
      </div>
      {body}
    </Card>
  )
}
