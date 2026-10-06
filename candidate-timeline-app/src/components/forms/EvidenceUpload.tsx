'use client'

import { useRef, useState } from 'react'
import { useI18n } from '@/i18n'
import type { EvidenceFile } from '@/domain/timeline/types'
import { Button } from '@/components/ui'

export function EvidenceUpload({
  value,
  onChange,
  upload,
}: {
  value: EvidenceFile | null
  onChange: (v: EvidenceFile | null) => void
  upload: (file: File) => Promise<EvidenceFile>
}) {
  const { t } = useI18n()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      onChange(await upload(file))
    } catch (e) {
      setError(e instanceof Error && e.message === 'size' ? t('evidence.tooBig') : t('evidence.error'))
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept="image/*,application/pdf"
        className="sr-only"
        aria-label={t('evidence.choose')}
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      {value ? (
        <div className="rounded-2xl border-2 border-brand bg-brand-soft p-4">
          <p className="font-semibold">{t('evidence.uploaded')}</p>
          <p className="text-[15px] text-muted break-all">{value.fileName} · {value.sizeKb} KB</p>
          <Button variant="ghost" size="sm" className="mt-1" onClick={() => onChange(null)}>{t('evidence.remove')}</Button>
        </div>
      ) : (
        <Button variant="secondary" block disabled={busy} onClick={() => input.current?.click()}>
          <span aria-hidden>📷</span> {busy ? t('evidence.uploading') : t('evidence.choose')}
        </Button>
      )}
      {error && <p className="mt-3 font-medium text-danger" role="alert">{error}</p>}
    </div>
  )
}
