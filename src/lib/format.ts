import type { Listing, PriceUnit } from '../types'

const nf = new Intl.NumberFormat('en-NG')

export const naira = (n: number) => `₦ ${nf.format(Math.round(n))}`

export function nairaCompact(n: number): string {
  if (n >= 1_000_000_000) return `₦${trim(n / 1_000_000_000)}B`
  if (n >= 1_000_000) return `₦${trim(n / 1_000_000)}M`
  if (n >= 1_000) return `₦${trim(n / 1_000)}k`
  return `₦${n}`
}

const trim = (v: number) => (v >= 100 ? Math.round(v).toString() : v.toFixed(1).replace(/\.0$/, ''))

export function unitLabel(unit: PriceUnit, category?: string): string {
  if (unit === 'total') return category?.startsWith('land') ? 'Outright price' : ''
  if (unit === 'per day') return category === 'event-centres-venues' ? 'per day' : 'per night'
  return unit
}

export function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d} day${d > 1 ? 's' : ''} ago`
  const w = Math.floor(d / 7)
  if (d < 30) return `${w} week${w > 1 ? 's' : ''} ago`
  const mo = Math.floor(d / 30)
  return `${mo} month${mo > 1 ? 's' : ''} ago`
}

/** Compact time for lists, e.g. "now", "5m", "3h", "2d", "14 Oct". */
export function shortAgo(iso: string): string {
  const m = Math.floor(Math.max(0, Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

export function yearsOn(joinedYear: number): string {
  const y = new Date().getFullYear() - joinedYear
  if (y < 1) return 'New on House4Rent'
  return `${y}+ year${y > 1 ? 's' : ''} on House4Rent`
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')

export const listingPath = (l: Pick<Listing, 'id' | 'slug'>) => `/listing/${l.id}/${l.slug}`

export const maskPhone = (phone: string) => phone.replace(/\d{4}$/, '••••')

export const plural = (n: number, word: string) => `${nf.format(n)} ${word}${n === 1 ? '' : 's'}`
