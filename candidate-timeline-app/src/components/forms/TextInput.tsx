'use client'

import { useId } from 'react'
import { cx } from '@/components/ui'

const field = 'w-full rounded-2xl border-2 border-line bg-white px-4 text-[17px] outline-none focus:border-brand'

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  autoFocus,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
  autoFocus?: boolean
}) {
  const id = useId()
  return (
    <div className="mt-3">
      <label htmlFor={id} className="mb-1.5 block font-semibold">{label}</label>
      <input
        id={id}
        type="text"
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        className={cx(field, 'min-h-[52px]')}
      />
    </div>
  )
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 4,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
  rows?: number
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="sr-only">{label}</label>
      <textarea
        id={id}
        value={value}
        rows={rows}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cx(field, 'py-3')}
      />
      {maxLength && <p className="mt-1 text-right text-[13px] text-muted">{value.length}/{maxLength}</p>}
    </div>
  )
}
