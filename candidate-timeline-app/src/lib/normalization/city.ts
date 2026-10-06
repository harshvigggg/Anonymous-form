import { cities, type City } from '@/config/cities'
import { countries } from '@/config/countries'
import { matchScore, normalizeName, searchKey } from './text'

export interface CityMatch {
  city: City
  score: number
  /** Alias the candidate typed, e.g. "Bangalore" for Bengaluru */
  via?: string
}

export function searchCities(query: string, limit = 6): CityMatch[] {
  if (searchKey(query).length < 2) return []
  return cities
    .map((city) => {
      let best = matchScore(query, city.name)
      let via: string | undefined
      for (const alias of city.aliases) {
        const s = matchScore(query, alias)
        if (s > best) {
          best = s
          via = alias
        }
      }
      return { city, score: best, via }
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export function normalizeCityName(raw: string): string {
  return normalizeName(raw)
}

export function searchCountries(query: string): string[] {
  if (!query.trim()) return countries
  return countries
    .map((c) => ({ c, s: matchScore(query, c) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.c)
}
