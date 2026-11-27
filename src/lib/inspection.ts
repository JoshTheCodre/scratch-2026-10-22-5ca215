import type { Availability, Booking, Listing } from '../types'
import { categoryBySlug } from '../data/categories'

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return (h >>> 0) / 4294967296
}

const PATTERNS: Availability[] = [
  { days: [1, 2, 3, 4, 5, 6], from: 10, to: 16 },
  { days: [1, 2, 3, 4, 5], from: 9, to: 17 },
  { days: [1, 3, 5, 6], from: 10, to: 15 },
  { days: [2, 4, 6], from: 11, to: 17 },
  { days: [6, 0], from: 12, to: 17 },
  { days: [1, 2, 3, 4, 5, 6], from: 8, to: 12 },
]

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** When this advert can be inspected. */
export function availabilityFor(l: Listing): Availability {
  return l.inspection ?? PATTERNS[Math.floor(hash(l.id) * PATTERNS.length)]!
}

export const hourLabel = (h: number) => `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`

/** "Mon–Sat · 10am – 4pm" */
export function availabilityText(a: Availability) {
  // Monday-first runs: [Mon..Fri, Sun] reads "Mon–Fri, Sun".
  const idx = [...new Set(a.days)].map((d) => (d + 6) % 7).sort((x, y) => x - y)
  const runs: number[][] = []
  for (const v of idx) {
    const last = runs[runs.length - 1]
    if (last && v === last[last.length - 1]! + 1) last.push(v)
    else runs.push([v])
  }
  const name = (i: number) => DAY_NAMES[(i + 1) % 7]
  const dayText =
    idx.length === 7
      ? 'Every day'
      : runs.map((r) => (r.length > 2 ? `${name(r[0]!)}–${name(r[r.length - 1]!)}` : r.map(name).join(', '))).join(', ')
  return `${dayText} · ${hourLabel(a.from)} – ${hourLabel(a.to)}`
}

export const toISODate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const fromISODate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y!, m! - 1, d!)
}

export function bookingDateText(b: Pick<Booking, 'date' | 'hour'>, long = false) {
  const d = fromISODate(b.date)
  const day = d.toLocaleDateString('en-NG', long ? { weekday: 'long', day: 'numeric', month: 'long' } : { weekday: 'short', day: 'numeric', month: 'short' })
  return `${day}, ${hourLabel(b.hour)}`
}

export interface DayOption {
  date: string
  label: string
  weekday: string
  open: boolean
}

/** The next `count` days, flagged open when the owner inspects that weekday. */
export function upcomingDays(a: Availability, count = 14, now = new Date()): DayOption[] {
  const out: DayOption[] = []
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)
    // Same-day slots close once the window has started.
    const open = a.days.includes(d.getDay()) && (i > 0 || now.getHours() < a.to - 2)
    out.push({ date: toISODate(d), label: String(d.getDate()), weekday: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : DAY_NAMES[d.getDay()]!, open })
  }
  return out
}

export interface Slot {
  hour: number
  taken: boolean
}

/** Hourly slots for a day. Some are already taken by other viewers. */
export function slotsFor(l: Listing, a: Availability, date: string, bookings: Booking[], now = new Date()): Slot[] {
  const isToday = date === toISODate(now)
  const mine = new Set(bookings.filter((b) => b.listingId === l.id && b.date === date && b.status !== 'cancelled').map((b) => b.hour))
  const slots: Slot[] = []
  for (let h = a.from; h < a.to; h++) {
    if (isToday && h <= now.getHours() + 1) continue
    slots.push({ hour: h, taken: mine.has(h) || (!l.isUserAd && hash(`${l.id}:${date}:${h}`) < 0.22) })
  }
  return slots
}

export const isUpcoming = (b: Booking, now = new Date()) => {
  const d = fromISODate(b.date)
  d.setHours(b.hour + 1)
  return d.getTime() > now.getTime()
}

export const viewingWord = (l: Listing) => (categoryBySlug(l.category)?.deal === 'shortlet' ? 'viewing' : 'inspection')

/** An .ics calendar file for the booking. */
export function bookingIcs(b: Booking, l: Listing, where: string) {
  const d = fromISODate(b.date)
  const pad = (n: number) => String(n).padStart(2, '0')
  const stamp = (h: number) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(h)}0000`
  const esc = (s: string) => s.replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, '\\n')
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//House4Rent//Inspections//EN',
    'BEGIN:VEVENT',
    `UID:${b.id}@house4rent.ng`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    `DTSTART:${stamp(b.hour)}`,
    `DTEND:${stamp(b.hour + 1)}`,
    `SUMMARY:${esc(`Inspection: ${l.title}`)}`,
    `LOCATION:${esc(where)}`,
    `DESCRIPTION:${esc('Booked on House4Rent. Never pay before you inspect.')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}
