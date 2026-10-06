'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { en } from './locales/en'
import { hi } from './locales/hi'

/**
 * Candidate UI text. Labels are never hard-coded in components – they use keys.
 * To add a language (Tamil, Malayalam, Telugu, Bengali, Punjabi …), add a
 * locale file with the same keys and register it below.
 */
export type Locale = 'en'
export type HelperLocale = 'hi' | null

const dictionaries: Record<Locale, Record<string, string>> = { en }
const helperDictionaries: Record<Exclude<HelperLocale, null>, Record<string, string>> = { hi }

export type Params = Record<string, string | number | undefined>
export type Translate = (key: string, params?: Params) => string

function format(template: string, params?: Params): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (params[k] !== undefined ? String(params[k]) : m))
}

export function createTranslator(locale: Locale = 'en'): Translate {
  const dict = dictionaries[locale]
  return (key, params) => {
    const value = dict[key] ?? en[key]
    if (value === undefined) {
      if (process.env.NODE_ENV !== 'production') console.warn(`[i18n] missing key: ${key}`)
      return key
    }
    return format(value, params)
  }
}

interface I18nValue {
  t: Translate
  /** Hindi (or other) helper line for a key, if one exists. */
  helper: (key: string) => string | undefined
}

const I18nContext = createContext<I18nValue>({
  t: createTranslator('en'),
  helper: (key) => hi[key],
})

export function I18nProvider({ locale = 'en', helperLocale = 'hi', children }: { locale?: Locale; helperLocale?: HelperLocale; children: ReactNode }) {
  const value = useMemo<I18nValue>(() => {
    const helpers = helperLocale ? helperDictionaries[helperLocale] : {}
    return { t: createTranslator(locale), helper: (key) => helpers[key] }
  }, [locale, helperLocale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  return useContext(I18nContext)
}

/** Non-React access (e.g. in server code or tests). */
export const t = createTranslator('en')

export function durationLabel(tr: Translate, months: number): string {
  return months === 1 ? tr('duration.month') : tr('duration.months', { count: months })
}
