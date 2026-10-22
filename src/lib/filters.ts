import type { Listing } from '../types'
import { ALL_CATEGORIES } from '../data/categories'
import { ALL_CITIES } from '../data/locations'
import { sellerById } from '../data/sellers'

export type Sort = 'recommended' | 'newest' | 'price-asc' | 'price-desc'
export type Posted = '' | '24h' | '7d' | '30d'

export interface Filters {
  q: string
  area: string
  min?: number
  max?: number
  types: string[]
  beds: number[]
  baths: number[]
  furnishing: string[]
  condition: string[]
  facilities: string[]
  docs: string[]
  verified: boolean
  posted: Posted
  sort: Sort
  view: 'grid' | 'list'
  page: number
}

const list = (sp: URLSearchParams, key: string) => (sp.get(key) ? sp.get(key)!.split(',').filter(Boolean) : [])
const num = (v: string | null) => (v && !Number.isNaN(Number(v)) ? Number(v) : undefined)

export function parseFilters(sp: URLSearchParams): Filters {
  return {
    q: sp.get('q') ?? '',
    area: sp.get('area') ?? '',
    min: num(sp.get('min')),
    max: num(sp.get('max')),
    types: list(sp, 'type'),
    beds: list(sp, 'beds').map(Number),
    baths: list(sp, 'baths').map(Number),
    furnishing: list(sp, 'furnishing'),
    condition: list(sp, 'condition'),
    facilities: list(sp, 'facilities'),
    docs: list(sp, 'docs'),
    verified: sp.get('verified') === '1',
    posted: (sp.get('posted') as Posted) ?? '',
    sort: (sp.get('sort') as Sort) || 'recommended',
    view: sp.get('view') === 'list' ? 'list' : 'grid',
    page: Math.max(1, Number(sp.get('page')) || 1),
  }
}

/** Listings in a city + category, before any sidebar filters. */
export function scopeListings(all: Listing[], city: string, category: string) {
  return all.filter(
    (l) => l.status === 'active' && (city === ALL_CITIES || l.city === city) && (category === ALL_CATEGORIES || l.category === category),
  )
}

const POSTED_HOURS: Record<Exclude<Posted, ''>, number> = { '24h': 24, '7d': 24 * 7, '30d': 24 * 30 }
const TIER_WEIGHT = { featured: 3, top: 2, boost: 1 } as const

export function matchesQuery(l: Listing, q: string) {
  const hay = `${l.title} ${l.description} ${l.area} ${l.propertyType} ${l.estate ?? ''}`.toLowerCase()
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => hay.includes(term))
}

/** Apply every filter except the ones named in `skip` (used for facet counts). */
export function applyFilters(scope: Listing[], f: Filters, skip: (keyof Filters)[] = []) {
  const now = Date.now()
  const on = (k: keyof Filters) => !skip.includes(k)
  return scope.filter((l) => {
    if (on('q') && f.q && !matchesQuery(l, f.q)) return false
    if (on('area') && f.area && l.area !== f.area) return false
    if (on('min') && f.min !== undefined && l.price < f.min) return false
    if (on('max') && f.max !== undefined && l.price > f.max) return false
    if (on('types') && f.types.length && !f.types.includes(l.propertyType)) return false
    if (on('beds') && f.beds.length && !f.beds.some((b) => (b >= 5 ? (l.bedrooms ?? 0) >= 5 : l.bedrooms === b))) return false
    if (on('baths') && f.baths.length && !f.baths.some((b) => (b >= 4 ? (l.bathrooms ?? 0) >= 4 : l.bathrooms === b))) return false
    if (on('furnishing') && f.furnishing.length && !f.furnishing.includes(l.furnishing ?? '')) return false
    if (on('condition') && f.condition.length && !f.condition.includes(l.condition ?? '')) return false
    if (on('facilities') && f.facilities.length && !f.facilities.every((x) => l.facilities.includes(x))) return false
    if (on('docs') && f.docs.length && !f.docs.includes(l.document ?? '')) return false
    if (on('verified') && f.verified && !(l.isUserAd || sellerById(l.sellerId)?.verified)) return false
    if (on('posted') && f.posted && now - new Date(l.postedAt).getTime() > POSTED_HOURS[f.posted] * 3600_000) return false
    return true
  })
}

export function sortListings(items: Listing[], sort: Sort) {
  const arr = [...items]
  const time = (l: Listing) => new Date(l.postedAt).getTime()
  switch (sort) {
    case 'newest':
      return arr.sort((a, b) => time(b) - time(a))
    case 'price-asc':
      return arr.sort((a, b) => a.price - b.price)
    case 'price-desc':
      return arr.sort((a, b) => b.price - a.price)
    default:
      return arr.sort((a, b) => (b.tier ? TIER_WEIGHT[b.tier] : 0) - (a.tier ? TIER_WEIGHT[a.tier] : 0) || time(b) - time(a))
  }
}

export function countBy<T extends string | number>(items: Listing[], get: (l: Listing) => T | T[] | undefined) {
  const m = new Map<T, number>()
  for (const l of items) {
    const v = get(l)
    if (v === undefined) continue
    for (const x of Array.isArray(v) ? v : [v]) m.set(x, (m.get(x) ?? 0) + 1)
  }
  return m
}

const niceRound = (n: number) => {
  if (n <= 0) return 0
  const mag = Math.pow(10, Math.floor(Math.log10(n)) - 1)
  return Math.round(n / mag) * mag
}

/** Five price bands split on quantiles, like "Under 1.8M · 1.8–37M · …". */
export function priceBands(items: Listing[]) {
  const prices = items.map((l) => l.price).sort((a, b) => a - b)
  if (prices.length < 5) return []
  const q = (p: number) => niceRound(prices[Math.min(prices.length - 1, Math.floor(prices.length * p))]!)
  const cuts = [...new Set([q(0.2), q(0.45), q(0.7), q(0.9)])].filter((c) => c > 0)
  const bands: { min?: number; max?: number; count: number }[] = []
  let lo: number | undefined
  for (const c of cuts) {
    bands.push({ min: lo, max: c, count: prices.filter((p) => (lo === undefined || p >= lo) && p <= c).length })
    lo = c
  }
  bands.push({ min: lo, count: prices.filter((p) => lo !== undefined && p > lo).length })
  return bands
}

export const PAGE_SIZE = 24
