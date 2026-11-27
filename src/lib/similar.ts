import type { Listing } from '../types'
import { cityBySlug } from '../data/locations'
import { distanceKm } from './geo'

// Types that compete for the same tenant or buyer.
const TYPE_FAMILY: Record<string, string> = {
  'Self Contain': 'small',
  'Room & Parlour': 'small',
  'Studio Apartment': 'small',
  'Mini Flat': 'small',
  Apartment: 'flat',
  Penthouse: 'flat',
  'Block of Flats': 'block',
  Bungalow: 'house',
  Duplex: 'house',
  'Detached Duplex': 'house',
  'Semi-Detached Duplex': 'house',
  'Terraced Duplex': 'house',
  Mansion: 'house',
}
const family = (t: string) => TYPE_FAMILY[t] ?? t

/** Yearly price, so monthly and yearly rents compare fairly. */
export const yearlyPrice = (l: Listing) => (l.priceUnit === 'per month' ? l.price * 12 : l.price)
const comparableUnit = (l: Listing) => (l.priceUnit === 'per month' ? 'per annum' : l.priceUnit)

/** 0 – 100: how alike two adverts are for someone deciding between them. */
export function similarity(a: Listing, b: Listing) {
  if (a.category !== b.category || comparableUnit(a) !== comparableUnit(b)) return 0
  let score = 100
  if (a.propertyType !== b.propertyType) score -= family(a.propertyType) === family(b.propertyType) ? 12 : 35
  if (a.bedrooms !== undefined || b.bedrooms !== undefined) score -= Math.min(30, Math.abs((a.bedrooms ?? 0) - (b.bedrooms ?? 0)) * 12)
  score -= Math.min(30, Math.abs(Math.log(yearlyPrice(a) / Math.max(1, yearlyPrice(b)))) * 30)
  const km = distanceKm(a, b)
  score -= a.city === b.city ? Math.min(20, km * 1.6) : cityBySlug(a.city)?.stateSlug === cityBySlug(b.city)?.stateSlug ? 22 : 35
  if (a.area === b.area && a.city === b.city) score += 4
  if (a.furnishing && a.furnishing === b.furnishing) score += 3
  const shared = a.facilities.filter((f) => b.facilities.includes(f)).length
  score += Math.min(6, shared * 1.5)
  return Math.max(0, Math.min(100, Math.round(score)))
}

/** Most similar active adverts, best first. */
export function similarListings(l: Listing, all: Listing[], limit = 4, minScore = 45) {
  return all
    .filter((x) => x.id !== l.id && x.status === 'active')
    .map((x) => ({ x, s: similarity(l, x) }))
    .filter((r) => r.s >= minScore)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((r) => r.x)
}

export interface PriceComparison {
  /** One row per seller: their closest match to this advert. */
  rows: { listing: Listing; score: number }[]
  low: number
  high: number
  median: number
  /** Where this advert sits against the median, e.g. -0.12 = 12% cheaper. */
  vsMedian: number
  scope: 'area' | 'city' | 'state'
}

/** Like-for-like prices from different agents: same category, type family and bedrooms. */
export function comparePrices(l: Listing, all: Listing[]): PriceComparison | null {
  const like = all.filter(
    (x) =>
      x.status === 'active' &&
      x.category === l.category &&
      comparableUnit(x) === comparableUnit(l) &&
      family(x.propertyType) === family(l.propertyType) &&
      (l.bedrooms === undefined || x.bedrooms === l.bedrooms),
  )
  const state = cityBySlug(l.city)?.stateSlug
  const tiers: [PriceComparison['scope'], Listing[]][] = [
    ['area', like.filter((x) => x.city === l.city && x.area === l.area)],
    ['city', like.filter((x) => x.city === l.city)],
    ['state', like.filter((x) => cityBySlug(x.city)?.stateSlug === state)],
  ]
  for (const [scope, pool] of tiers) {
    const bySeller = new Map<string, { listing: Listing; score: number }>()
    for (const x of pool) {
      if (x.sellerId === l.sellerId && x.id !== l.id) continue
      const score = x.id === l.id ? 101 : similarity(l, x)
      const cur = bySeller.get(x.sellerId)
      if (!cur || score > cur.score) bySeller.set(x.sellerId, { listing: x, score })
    }
    const rows = [...bySeller.values()].sort((a, b) => yearlyPrice(a.listing) - yearlyPrice(b.listing))
    if (rows.length < 3) continue
    const prices = rows.map((r) => yearlyPrice(r.listing))
    const mid = Math.floor(prices.length / 2)
    const median = prices.length % 2 ? prices[mid]! : (prices[mid - 1]! + prices[mid]!) / 2
    return { rows, low: prices[0]!, high: prices[prices.length - 1]!, median, vsMedian: yearlyPrice(l) / median - 1, scope }
  }
  return null
}
