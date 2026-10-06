'use client'

import { useId, useMemo, useState } from 'react'
import { useI18n } from '@/i18n'
import { defaultCountry } from '@/config/countries'
import { searchCities, normalizeCityName, searchCountries } from '@/lib/normalization/city'
import { Button, Check } from '@/components/ui'

export interface Location {
  city: string | null
  cityId: string | null
  country: string | null
}

/** City search with typo tolerance; the country is filled in from the city and can be changed. */
export function CityCountryField({ value, onChange, label }: { value: Location; onChange: (v: Location) => void; label: string }) {
  const { t } = useI18n()
  const inputId = useId()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(!value.city)
  const [countryOpen, setCountryOpen] = useState(false)
  const [countryQuery, setCountryQuery] = useState('')
  const matches = useMemo(() => searchCities(query), [query])
  const countryMatches = useMemo(() => searchCountries(countryQuery).slice(0, 40), [countryQuery])

  const typed = query.trim()

  return (
    <div>
      {value.city && !editing ? (
        <div className="rounded-2xl border-2 border-brand bg-brand-soft p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-white"><Check className="h-4 w-4" /></span>
            <p className="flex-1 font-semibold">{value.city}</p>
          </div>
          <Button variant="ghost" size="sm" className="mt-1" onClick={() => { setQuery(value.city ?? ''); setEditing(true) }}>
            {t('common.change')}
          </Button>
        </div>
      ) : (
        <div>
          <label htmlFor={inputId} className="sr-only">{label}</label>
          <input
            id={inputId}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('city.placeholder')}
            autoComplete="off"
            autoCapitalize="words"
            autoFocus
            className="min-h-[52px] w-full rounded-2xl border-2 border-line bg-white px-4 text-[17px] outline-none focus:border-brand"
          />
          <ul className="mt-3 flex flex-col gap-2">
            {matches.map(({ city }) => (
              <li key={city.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange({ city: city.name, cityId: city.id, country: city.country })
                    setEditing(false)
                  }}
                  className="flex min-h-[56px] w-full flex-col justify-center rounded-2xl border-2 border-line bg-white px-4 py-2 text-left hover:border-brand"
                >
                  <span className="font-semibold">{city.name}</span>
                  <span className="text-[15px] text-muted">{city.state}, {city.country}</span>
                </button>
              </li>
            ))}
            {typed.length >= 2 && !matches.some((m) => m.score >= 0.95) && (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onChange({ city: normalizeCityName(typed), cityId: null, country: value.country ?? defaultCountry })
                    setEditing(false)
                  }}
                  className="flex min-h-[52px] w-full items-center rounded-2xl border-2 border-dashed border-line px-4 text-left font-semibold text-brand-dark"
                >
                  {t('city.use', { name: normalizeCityName(typed) })}
                </button>
              </li>
            )}
          </ul>
        </div>
      )}

      {value.city && (
        <div className="mt-4 rounded-2xl bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[14px] font-semibold text-muted">{t('city.country')}</p>
              <p className="font-semibold">{value.country ?? '—'}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCountryOpen((x) => !x)} aria-expanded={countryOpen}>
              {t('city.changeCountry')}
            </Button>
          </div>
          {countryOpen && (
            <div className="mt-3">
              <input
                type="search"
                value={countryQuery}
                onChange={(e) => setCountryQuery(e.target.value)}
                placeholder={t('city.searchCountry')}
                aria-label={t('city.searchCountry')}
                className="min-h-[48px] w-full rounded-2xl border-2 border-line bg-white px-4 outline-none focus:border-brand"
              />
              <ul className="mt-2 max-h-64 overflow-y-auto rounded-2xl border border-line bg-white">
                {countryMatches.map((c) => (
                  <li key={c}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange({ ...value, country: c })
                        setCountryOpen(false)
                        setCountryQuery('')
                      }}
                      className="flex min-h-[48px] w-full items-center px-4 text-left hover:bg-brand-soft"
                    >
                      {c}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
