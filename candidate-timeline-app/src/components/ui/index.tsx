'use client'

import Link from 'next/link'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'warn'

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark disabled:bg-[#b9c7c3] disabled:text-white',
  secondary: 'bg-white text-brand-dark border-2 border-brand-line hover:bg-brand-soft disabled:text-muted disabled:border-line',
  ghost: 'bg-transparent text-brand-dark hover:bg-brand-soft',
  danger: 'bg-white text-danger border-2 border-danger-line hover:bg-danger-soft',
  warn: 'bg-warn text-white hover:brightness-95',
}

const base = 'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-colors disabled:cursor-not-allowed select-none'
const sizes = { lg: 'min-h-[52px] px-5 text-[17px]', md: 'min-h-[44px] px-4 text-[16px]', sm: 'min-h-[44px] px-3 text-[15px]' }

export function Button({
  variant = 'primary',
  size = 'lg',
  block,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: keyof typeof sizes; block?: boolean }) {
  return <button type="button" className={cx(base, variants[variant], sizes[size], block && 'w-full', className)} {...props} />
}

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'lg',
  block,
  className,
  children,
}: {
  href: string
  variant?: Variant
  size?: keyof typeof sizes
  block?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <Link href={href} className={cx(base, variants[variant], sizes[size], block && 'w-full', className)}>
      {children}
    </Link>
  )
}

export function Card({ className, children, tone = 'plain' }: { className?: string; children: ReactNode; tone?: 'plain' | 'warn' | 'danger' | 'ok' | 'brand' }) {
  const tones = {
    plain: 'bg-white border-line',
    warn: 'bg-warn-soft border-warn-line',
    danger: 'bg-danger-soft border-danger-line',
    ok: 'bg-ok-soft border-[#b7e1c3]',
    brand: 'bg-brand-soft border-brand-line',
  }
  return <div className={cx('rounded-[var(--radius-card)] border p-4', tones[tone], className)}>{children}</div>
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v)}
      aria-label={label}
      className="h-2.5 w-full overflow-hidden rounded-full bg-line"
    >
      <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${v}%` }} />
    </div>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 mt-7 flex items-center justify-between">
      <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted">{children}</h2>
      {action}
    </div>
  )
}

export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted" role="status">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-line border-t-brand" aria-hidden />
      <span>{label}</span>
    </div>
  )
}

export function Badge({ tone = 'plain', children }: { tone?: 'plain' | 'warn' | 'danger' | 'ok' | 'brand'; children: ReactNode }) {
  const tones = {
    plain: 'bg-surface text-muted',
    warn: 'bg-warn-soft text-warn',
    danger: 'bg-danger-soft text-danger',
    ok: 'bg-ok-soft text-ok',
    brand: 'bg-brand-soft text-brand-dark',
  }
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[13px] font-semibold', tones[tone])}>{children}</span>
}

export function Check({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cx('h-5 w-5', className)} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

export function Chevron({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cx('h-5 w-5', className)} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

export function Warn({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cx('h-5 w-5', className)} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3 2 20h20L12 3z" />
      <path d="M12 10v4.5M12 17.5v.01" />
    </svg>
  )
}

export function Toast({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="toast fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-[15px] font-semibold text-white shadow-lg">
      {children}
    </div>
  )
}
