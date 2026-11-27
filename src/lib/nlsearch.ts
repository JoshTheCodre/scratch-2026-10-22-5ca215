import type { CategorySlug, Listing, Place, PlaceLabel } from '../types'
import { ALL_CATEGORIES, COMMERCIAL_TYPES, categoryBySlug } from '../data/categories'
import { CITIES, STATES } from '../data/locations'
import { nairaCompact } from './format'

// Turns "I want a 3 bedroom flat in Woji under 2.5m with parking" into filters.
// Everything runs in the browser; unknown words fall back to a keyword match.

export interface ParsedSearch {
  place?: string
  area?: string
  category?: CategorySlug
  types: string[]
  beds?: number
  baths?: number
  min?: number
  max?: number
  /** The budget was given per month and converted to a yearly figure. */
  monthly: boolean
  furnishing: string[]
  condition: string[]
  facilities: string[]
  docs: string[]
  verified: boolean
  sort?: 'price-asc' | 'price-desc' | 'newest'
  near?: PlaceLabel
  keywords: string[]
  /** Human-readable pieces we understood, in reading order. */
  understood: string[]
}

/** Lower-case, padded with spaces; dots, commas and hyphens survive only inside numbers. */
const norm = (s: string) =>
  ` ${s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9₦.,\s-]/g, ' ')
    .replace(/(?<!\d)[.,]|[.,](?!\d)/g, ' ')
    .replace(/(?<!\d)-|-(?!\d)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Remove the first match of `re` from the working text and return it. */
function take(state: { t: string }, re: RegExp): RegExpMatchArray | null {
  const m = state.t.match(re)
  if (m) state.t = `${state.t.slice(0, m.index)} ${state.t.slice(m.index! + m[0].length)} `.replace(/\s+/g, ' ')
  return m
}

const has = (t: string, key: string) => t.includes(` ${key} `)
const cut = (state: { t: string }, key: string) => {
  state.t = state.t.replace(` ${key} `, ' ')
}

// ── Places ──────────────────────────────────────────────────────────────────

interface AreaKey {
  key: string
  city: string
  area: string
}
const AREA_KEYS: AreaKey[] = [
  ...CITIES.flatMap((c) => c.areas.map((a) => ({ key: norm(a).trim(), city: c.slug, area: a }))),
  { key: 'lekki', city: 'lagos', area: 'Lekki Phase 1' },
  { key: 'vi', city: 'lagos', area: 'Victoria Island' },
  { key: 'ikeja', city: 'lagos', area: 'Ikeja GRA' },
  { key: 'transamadi', city: 'port-harcourt', area: 'Trans Amadi' },
  { key: 'wuse', city: 'abuja', area: 'Wuse 2' },
  { key: 'gra phase ii', city: 'port-harcourt', area: 'GRA Phase 2' },
  { key: 'peter odili', city: 'port-harcourt', area: 'Peter Odili Road' },
  { key: 'odili road', city: 'port-harcourt', area: 'Peter Odili Road' },
  { key: 'dline', city: 'port-harcourt', area: 'D-Line' },
].sort((a, b) => b.key.length - a.key.length)

// Area names that are also everyday words only count when their city is named too.
const WORDY_AREAS = new Set(['challenge', 'presco', 'university area', 'gra', 'government station', 'high level'])

const CITY_KEYS = (
  [
    ...CITIES.map((c) => [norm(c.name).trim(), c.slug]),
    ['ph', 'port-harcourt'],
    ['phc', 'port-harcourt'],
    ['portharcourt', 'port-harcourt'],
    ['benin', 'benin-city'],
  ] as [string, string][]
).sort((a, b) => b[0].length - a[0].length)

const STATE_KEYS: [string, string][] = STATES.flatMap((st) => {
  const name = norm(st.name).trim()
  const keys: [string, string][] = [[`${name} state`, st.slug]]
  if (st.slug === 'fct-abuja') keys.push(['fct', st.slug])
  else if (!CITIES.some((c) => norm(c.name).trim() === name)) keys.push([name, st.slug])
  return keys
}).sort((a, b) => b[0].length - a[0].length)

// ── Property words ──────────────────────────────────────────────────────────

const TYPE_RULES: [RegExp, string[]][] = [
  [/ (self ?con(tain(ed)?)?|selfcon) /, ['Self Contain']],
  [/ mini ?flats? /, ['Mini Flat']],
  [/ rooms? and parlou?rs? /, ['Room & Parlour']],
  [/ studio( apartments?)? /, ['Studio Apartment']],
  [/ pent ?houses? /, ['Penthouse']],
  [/ blocks? of flats? /, ['Block of Flats']],
  [/ semi ?detached( duplex(es)?| house)? /, ['Semi-Detached Duplex']],
  [/ (fully )?detached( duplex(es)?| house)? /, ['Detached Duplex']],
  [/ terrace(d)?( duplex(es)?| house)? /, ['Terraced Duplex']],
  [/ duplex(es)? /, ['Duplex', 'Detached Duplex', 'Semi-Detached Duplex', 'Terraced Duplex']],
  [/ bungalows? /, ['Bungalow']],
  [/ mansions? /, ['Mansion']],
  [/ (flats?|apartments?) /, ['Apartment']],
  [/ (farm ?lands?|farms?) /, ['Farmland']],
  [/ estate plots? /, ['Estate Plot']],
  [/ commercial land /, ['Commercial Land']],
  [/ residential land /, ['Residential Land']],
  [/ mixed use( land)? /, ['Mixed-Use Land']],
  [/ (open )?yards? /, ['Open Yard']],
  [/ offices?( spaces?)? /, ['Office Space']],
  [/ (shops?|stores?) /, ['Shop']],
  [/ warehouses? /, ['Warehouse']],
  [/ plazas? /, ['Plaza']],
  [/ (filling|petrol|gas) stations? /, ['Filling Station']],
  [/ hotels? /, ['Hotel']],
  [/ schools?( buildings?)? /, ['School Building']],
  [/ (event (hall|centre|center)s?|halls?) /, ['Event Hall']],
  [/ conference( rooms?| halls?)? /, ['Conference Room']],
  [/ (co ?working( spaces?)?|workspaces?) /, ['Co-working Space']],
  [/ (outdoor( venues?)?|garden venues?) /, ['Outdoor Venue']],
]
const LAND_TYPES = ['Farmland', 'Estate Plot', 'Commercial Land', 'Residential Land', 'Mixed-Use Land', 'Open Yard']
const LAND_WORDS = / (land|lands|plots?|acres?|hectares?) /
const VENUE_WORDS = / (venues?|events?|weddings?|parties|party) /
const HOME_WORDS = / (house|houses|home|homes|accommodation|apartment) /

const DEAL_RULES: [RegExp, 'shortlet' | 'sale' | 'rent'][] = [
  [/ (short ?lets?|per night|a night|nightly|airbnb|serviced apartments?|staycation|weekend) /, 'shortlet'],
  [/ (for sale|to buy|buy|buying|purchase|sale|to own) /, 'sale'],
  [/ (for rent|to let|rent|rental|renting|rents|let|lease|leasing|tenant|per annum|yearly|per year|a year) /, 'rent'],
]

const FURNISH_RULES: [RegExp, string][] = [
  [/ semi furnished /, 'Semi-Furnished'],
  [/ (unfurnished|not furnished|empty) /, 'Unfurnished'],
  [/ (fully )?furnished /, 'Furnished'],
]
const CONDITION_RULES: [RegExp, string][] = [
  [/ off plan /, 'Off-Plan'],
  [/ (newly built|brand new|new builds?|new) /, 'Newly-Built'],
  [/ renovated /, 'Renovated'],
  [/ fairly used /, 'Fairly Used'],
]
const FACILITY_RULES: [RegExp, string][] = [
  [/ ((24 ?(hours?|hrs?|7)|constant|steady|uninterrupted|stable|regular) (light|power|electricity)|24 hour electricity) /, '24-hour Electricity'],
  [/ (borehole|running water|water supply|water) /, 'Borehole Water'],
  [/ (cctv|cameras?) /, 'CCTV'],
  [/ (security|secure|security guards?) /, 'Security'],
  [/ (gated( estate| compound)?|in an? estate|inside an? estate) /, 'Gated Estate'],
  [/ (parking( space)?|car park|garage) /, 'Parking Space'],
  [/ pop( ceiling)? /, 'POP Ceiling'],
  [/ tiled( floors?)? /, 'Tiled Floor'],
  [/ (fitted kitchen|kitchen cabinets?) /, 'Fitted Kitchen'],
  [/ wardrobes? /, 'Wardrobe'],
  [/ (ac|a c|air ?con(dition(ing|er|ed)?)?) /, 'Air Conditioning'],
  [/ (swimming )?pool /, 'Swimming Pool'],
  [/ gym /, 'Gym'],
  [/ (bq|boys quarters?) /, 'Boys Quarters (BQ)'],
  [/ (solar|inverter) /, 'Inverter / Solar'],
  [/ prepaid( meter)? /, 'Prepaid Meter'],
  [/ (wi ?fi|internet) /, 'Wi-Fi'],
  [/ smart home /, 'Smart Home'],
  [/ balcon(y|ies) /, 'Balcony'],
  [/ (tarred|good) roads? /, 'Tarred Road'],
]
const DOC_RULES: [RegExp, string][] = [
  [/ (c of o|cofo|c o o|certificate of occupancy) /, 'Certificate of Occupancy (C of O)'],
  [/ governors? consent /, "Governor's Consent"],
  [/ (registered )?survey( plan)? /, 'Registered Survey Plan'],
  [/ deed of assignment /, 'Deed of Assignment'],
  [/ (deed of )?conveyance /, 'Deed of Conveyance'],
  [/ (gazette|excision) /, 'Gazette / Excision'],
]
const NEAR_RULE = / (near|close to|around|not far from|walking distance to|walking distance from) (my |our |the )?(church|mosque|work|workplace|office|school|family|parents|gym) /
const NEAR_LABEL: Record<string, PlaceLabel> = {
  church: 'Church', mosque: 'Mosque', work: 'Work', workplace: 'Work', office: 'Work', school: 'School', family: 'Family', parents: 'Family', gym: 'Gym',
}

const WORD_NUM: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, single: 1 }
const toNum = (s: string) => WORD_NUM[s] ?? Number(s)

// ── Money ───────────────────────────────────────────────────────────────────

const AMT = String.raw`(?:₦ ?|ngn |n)?(\d+(?:[.,]\d+)*) ?(k|thousand|m|mil|mill|million|millions|b|bn|billion)?(?: naira)?`
const MULT: Record<string, number> = { k: 1e3, thousand: 1e3, m: 1e6, mil: 1e6, mill: 1e6, million: 1e6, millions: 1e6, b: 1e9, bn: 1e9, billion: 1e9 }

/** A naira amount. After a budget word, "under 3" reads as ₦3M and "under 500" as ₦500k. */
function money(num: string, suffix: string | undefined, raw: string, budgetWord: boolean): number | undefined {
  const v = Number(num.replace(/,/g, ''))
  if (!Number.isFinite(v) || v <= 0) return undefined
  if (suffix) return v * MULT[suffix]!
  if (v >= 10000) return v
  if (budgetWord) return v <= 50 ? v * 1e6 : v < 1000 ? v * 1e3 : v
  if (/^\s*(₦|ngn |n\d)/.test(raw)) return v
  return undefined
}

const MAX_WORDS = 'under|below|less than|not more than|no more than|maximum|max|at most|up to|within|budget of|budget is|budget|cheaper than|not above|not over'
const MIN_WORDS = 'above|over|more than|at least|minimum|min|from|starting at|starting from'
const ABOUT_WORDS = 'around|about|roughly|approximately|approx'

// ── Main ────────────────────────────────────────────────────────────────────

const STOP = new Set(
  `i im want wants need needs looking look search searching find show me a an the in at on for with and or of to my our is am are be that which who any some please pls kindly hello hi good nice beautiful lovely spacious decent clean big small budget price cost range around near close area location city town property properties place places one bedroom bedrooms bed beds room rooms per year yearly annum month monthly within max maximum min minimum less more than under below above over between from up naira ngn it its can you could would like get rent buy sale let lease available somewhere where also very really just new`.split(' '),
)

export function parseSearch(text: string, listings: Listing[] = []): ParsedSearch {
  const s = { t: norm(text) }
  const out: ParsedSearch = { types: [], monthly: false, furnishing: [], condition: [], facilities: [], docs: [], verified: false, keywords: [], understood: [] }

  // "near my church" first, so "office" and "school" aren't read as property types.
  const near = take(s, NEAR_RULE)
  if (near) out.near = NEAR_LABEL[near[3]!]

  // Places. Areas are found first so "Aba Road" (an area) never reads as the city Aba.
  const areaHits = AREA_KEYS.filter((a) => has(s.t, a.key))
  const insideArea = (key: string) => areaHits.some((a) => a.key !== key && has(` ${a.key} `, key))
  for (const [key, slug] of STATE_KEYS)
    if (has(s.t, key) && !insideArea(key)) {
      out.place = slug
      cut(s, key)
      break
    }
  let city: string | undefined
  for (const [key, slug] of CITY_KEYS)
    if (has(s.t, key) && !insideArea(key)) {
      city = slug
      cut(s, key)
      break
    }
  const usable = areaHits.filter((a) => has(s.t, a.key) && (!WORDY_AREAS.has(a.key) || a.city === city))
  const area = usable.find((a) => a.city === city) ?? (city ? undefined : usable[0])
  if (area) {
    out.area = area.area
    city = area.city
    cut(s, area.key)
  }
  if (city) out.place = city

  // Bedrooms and bathrooms come before money, so "3 bedroom" is never ₦3.
  const beds = take(s, / (\d+|one|two|three|four|five|six|seven|single) ?(bed|beds|bedroom|bedrooms|bedroomed|br|bdr|bd|bedrm) /)
  if (beds) out.beds = Math.min(5, toNum(beds[1]!))
  const baths = take(s, / (\d+|one|two|three|four|five|six) ?(bath|baths|bathroom|bathrooms|toilet|toilets) /)
  if (baths) out.baths = Math.min(4, toNum(baths[1]!))
  take(s, / \d+ ?(sqm|square met(er|re)s?|m2) /)

  // Budget: "between 2m and 3m", "2-3m", "under 2.5m", "from 500k", "around 1m", or a bare "2m".
  out.monthly = Boolean(take(s, / (per month|a month|monthly|pm|every month|month) /))
  const range = take(s, new RegExp(String.raw` (?:between |from )?${AMT} ?(?:to|and|-) ?${AMT} `))
  if (range) {
    const loSuffix = range[2] ?? range[4]
    const hiSuffix = range[4] ?? range[2]
    const lo = money(range[1]!, loSuffix, range[0], true)
    const hi = money(range[3]!, hiSuffix, range[0], Boolean(loSuffix || hiSuffix || /between|from/.test(range[0])))
    if (lo !== undefined && hi !== undefined) {
      out.min = Math.min(lo, hi)
      out.max = Math.max(lo, hi)
    }
  }
  if (out.min === undefined && out.max === undefined) {
    const max = take(s, new RegExp(String.raw` (?:${MAX_WORDS}) ${AMT} `))
    if (max) out.max = money(max[1]!, max[2], max[0], true)
    const min = take(s, new RegExp(String.raw` (?:${MIN_WORDS}) ${AMT} `))
    if (min) out.min = money(min[1]!, min[2], min[0], true)
    const about = take(s, new RegExp(String.raw` (?:${ABOUT_WORDS}) ${AMT} `))
    const v = about ? money(about[1]!, about[2], about[0], true) : undefined
    if (v) {
      out.min = Math.round(v * 0.8)
      out.max = Math.round(v * 1.2)
    }
    if (out.min === undefined && out.max === undefined) {
      for (const bare of s.t.matchAll(new RegExp(String.raw`(?<= )${AMT}(?= )`, 'g'))) {
        const amount = money(bare[1]!, bare[2], bare[0], false)
        if (amount) {
          out.max = amount
          take(s, new RegExp(` ${escapeRe(bare[0])} `))
          break
        }
      }
    }
  }

  // Deal, documents, furnishing, condition.
  let deal: 'shortlet' | 'sale' | 'rent' | undefined
  for (const [re, d] of DEAL_RULES) if (take(s, re)) deal ??= d
  for (const [re, doc] of DOC_RULES) if (take(s, re)) out.docs.push(doc)
  for (const [re, f] of FURNISH_RULES)
    if (take(s, re)) {
      out.furnishing.push(f)
      break
    }
  for (const [re, c] of CONDITION_RULES) if (take(s, re)) out.condition.push(c)

  // Property types (estate plots before the "estate" facility; mini flats before flats).
  const types = new Set<string>()
  for (const [re, ts] of TYPE_RULES) while (take(s, re)) ts.forEach((t) => types.add(t))
  for (const [re, f] of FACILITY_RULES) if (take(s, re)) out.facilities.push(f)
  const landWord = Boolean(take(s, LAND_WORDS))
  const venueWord = Boolean(take(s, VENUE_WORDS))
  const homeWord = Boolean(take(s, HOME_WORDS))
  if (take(s, / verified /)) out.verified = true
  if (take(s, / (cheap|cheapest|affordable|budget friendly|low cost|lowest|cheaper) /)) out.sort = 'price-asc'
  else if (take(s, / (luxury|luxurious|exclusive|high end|top notch) /)) out.sort = 'price-desc'
  else if (take(s, / (newest|latest|recent|just listed) /)) out.sort = 'newest'

  // Category from the kind of property and the deal described.
  const list = [...types]
  const venue = venueWord || list.some((t) => categoryBySlug('event-centres-venues')!.types.includes(t))
  const land = landWord || list.some((t) => LAND_TYPES.includes(t))
  const commercial = list.some((t) => COMMERCIAL_TYPES.includes(t))
  const residential =
    homeWord || out.beds !== undefined || list.some((t) => categoryBySlug('houses-apartments-for-rent')!.types.includes(t) || t === 'Mansion' || t.includes('Duplex'))
  if (venue && !residential) out.category = 'event-centres-venues'
  else if (land && !residential) out.category = deal === 'rent' || list.includes('Open Yard') ? 'land-plots-for-rent' : 'land-plots-for-sale'
  else if (commercial && !residential) out.category = deal === 'sale' ? 'houses-apartments-for-sale' : 'commercial-property-for-rent'
  else if (deal === 'shortlet') out.category = 'short-let'
  else if (deal === 'sale') out.category = 'houses-apartments-for-sale'
  else if (deal === 'rent' || residential) out.category = 'houses-apartments-for-rent'

  const cat = categoryBySlug(out.category)
  out.types = cat ? list.filter((t) => cat.types.includes(t)) : []
  if (cat?.group === 'land' || cat?.group === 'venue' || out.types.some((t) => COMMERCIAL_TYPES.includes(t))) {
    out.beds = undefined
    out.baths = undefined
  }
  if (cat?.group !== 'land') out.docs = []

  // A monthly budget for a yearly rent becomes a yearly figure.
  const yearly = cat?.deal === 'rent'
  if (out.monthly && yearly) {
    if (out.max !== undefined) out.max *= 12
    if (out.min !== undefined) out.min *= 12
  }

  // Leftover words that only a few real adverts use (estate names, streets) become keywords.
  const leftovers = s.t.split(' ').filter((w) => w.length >= 3 && !STOP.has(w) && !/^[\d₦]/.test(w))
  if (leftovers.length && listings.length) {
    const hay = listings.map((l) => `${l.title} ${l.description} ${l.area} ${l.propertyType} ${l.estate ?? ''}`.toLowerCase())
    out.keywords = leftovers
      .filter((w) => {
        const hits = hay.filter((h) => h.includes(w)).length
        return hits > 0 && hits <= Math.max(3, hay.length * 0.15)
      })
      .slice(0, 3)
  }

  // Labels for the "we understood" line.
  const u = out.understood
  if (out.beds) u.push(`${out.beds >= 5 ? '5+' : out.beds} bed${out.beds > 1 ? 's' : ''}`)
  if (out.types.length) u.push(out.types.length > 1 && out.types.every((t) => t.includes('Duplex')) ? 'Duplex' : out.types.join(' or '))
  if (cat && !(cat.group === 'venue' && out.types.length))
    u.push(!out.types.length ? cat.short : cat.deal === 'sale' ? 'for sale' : cat.deal === 'shortlet' ? cat.short.toLowerCase() : cat.group === 'land' ? 'for lease' : 'for rent')
  const placeLabel = out.area ?? (out.place ? CITIES.find((c) => c.slug === out.place)?.name ?? STATES.find((x) => x.slug === out.place)?.label : undefined)
  if (placeLabel) u.push(`in ${placeLabel}`)
  if (out.baths) u.push(`${out.baths}+ bath`)
  const per = out.monthly && yearly ? ' a year' : ''
  if (out.min !== undefined && out.max !== undefined) u.push(`${nairaCompact(out.min)} – ${nairaCompact(out.max)}${per}`)
  else if (out.max !== undefined) u.push(`under ${nairaCompact(out.max)}${per}`)
  else if (out.min !== undefined) u.push(`from ${nairaCompact(out.min)}${per}`)
  u.push(...out.furnishing, ...out.condition)
  u.push(...out.facilities.map((f) => f.replace(/ \(.*\)/, '')))
  u.push(...out.docs.map((d) => d.match(/\((.*)\)/)?.[1] ?? d))
  if (out.verified) u.push('verified sellers')
  if (out.near) u.push(`near your ${out.near.toLowerCase()}`)
  if (out.sort === 'price-asc') u.push('cheapest first')
  if (out.sort === 'price-desc') u.push('priciest first')
  if (out.sort === 'newest') u.push('newest first')
  u.push(...out.keywords.map((k) => `“${k}”`))
  return out
}

/** Listings URL for a parsed search. `fallbackPlace` is used when no place was named. */
export function searchUrl(p: ParsedSearch, raw: string, fallbackPlace: string, places: Place[] = []) {
  const place = p.place ?? fallbackPlace
  const category = p.category ?? ALL_CATEGORIES
  const sp = new URLSearchParams()
  const setList = (k: string, v: (string | number)[]) => {
    if (v.length) sp.set(k, v.join(','))
  }
  if (p.area) sp.set('area', p.area)
  setList('type', p.types)
  if (p.beds) sp.set('beds', String(p.beds))
  if (p.baths) sp.set('baths', String(p.baths))
  if (p.min !== undefined) sp.set('min', String(Math.round(p.min)))
  if (p.max !== undefined) sp.set('max', String(Math.round(p.max)))
  setList('furnishing', p.furnishing)
  setList('condition', p.condition)
  setList('facilities', p.facilities)
  setList('docs', p.docs)
  if (p.verified) sp.set('verified', '1')
  const nearPlace = p.near && places.find((x) => x.label === p.near)
  if (nearPlace) sp.set('sort', `near-${nearPlace.id}`)
  else if (p.sort) sp.set('sort', p.sort)
  if (p.near && !nearPlace) sp.set('nearlabel', p.near)
  if (p.keywords.length) sp.set('q', p.keywords.join(' '))
  if (raw.trim()) sp.set('nl', raw.trim())
  // Nothing recognised: show everything and say so, rather than an empty page.
  if (!p.understood.length) sp.set('nlu', '0')
  return `/${place}/${category}?${sp}`
}

export const SEARCH_EXAMPLES = [
  '2 bedroom flat in Woji under 2.5m',
  'Self contain in Choba below 400k',
  'Duplex for sale in Lekki with swimming pool',
  'Land in Abuja with C of O under 20m',
  'Furnished short let in Ikoyi',
  'Office space in Trans Amadi',
]
