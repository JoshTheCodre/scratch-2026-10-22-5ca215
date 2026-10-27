import type { CategorySlug, City, Condition, Furnishing, Listing, PriceUnit, Tier, Zone } from '../types'
import { STATES, cityBySlug, stateOfCity } from './locations'
import { POOLS } from './images'
import { LAND_DOCUMENTS } from './categories'
import { slugify } from '../lib/format'

// Deterministic demo inventory. Replace with an API call when a backend exists.

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20261022)
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]!
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min
const chance = (p: number) => rand() < p
const between = (min: number, max: number) => min + rand() * (max - min)
const roundTo = (n: number, step: number) => Math.max(step, Math.round(n / step) * step)

function sample<T>(arr: readonly T[], n: number): T[] {
  const copy = [...arr]
  const out: T[] = []
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]!)
  return out
}

// Rough price level relative to Port Harcourt; cities not listed use DEFAULT_MULT.
const CITY_MULT: Record<string, number> = {
  'port-harcourt': 1, lagos: 1.65, abuja: 1.4, owerri: 0.6, uyo: 0.65,
  ikorodu: 0.85, karu: 0.8, gwagwalada: 0.7, ibadan: 0.75, 'benin-city': 0.75, enugu: 0.8, asaba: 0.75, warri: 0.75,
  kano: 0.7, kaduna: 0.7, calabar: 0.7, abeokuta: 0.65, ota: 0.7, jos: 0.62, ilorin: 0.6, akure: 0.6, osogbo: 0.55,
}
const DEFAULT_MULT = 0.5
const PREMIUM = ['GRA Phase 2', 'Old GRA', 'Peter Odili Road', 'Woji', 'Ikoyi', 'Lekki Phase 1', 'Victoria Island', 'Maitama', 'Asokoro', 'Guzape', 'New Owerri', 'Ewet Housing']
const BUDGET = ['Choba', 'Oyigbo', 'Igwuruta', 'Mile 1', 'D-Line', 'Borokiri', 'Rumuokoro', 'Kubwa', 'Lugbe', 'Ajah', 'Ibeju-Lekki', 'Rukpokwu', 'Eneka']
const areaMult = (area: string) => (PREMIUM.includes(area) ? 1.55 : BUDGET.includes(area) ? 0.72 : 1)

const ESTATES = ['Palm View Estate', 'Royal Gardens Estate', 'Unity Estate', 'Cedar Court Estate', 'Silver Springs Estate', 'Golden Gate Estate', 'Harmony Estate', 'Rosewood Estate', 'Oakridge Estate', 'Bayview Estate']
const STREETS = ['Okporo Road', 'Ikwerre Road', 'Stadium Road', 'Evo Road', 'Tombia Street', 'Sani Abacha Road', 'Rumuibekwe Road', 'Aba Road', 'Woji Road', 'Elelenwo Road', 'King Perekule Street', 'Odili Road', 'Tank Road', 'Igbo Etche Road']
// Street names common to many Nigerian cities, used outside Port Harcourt.
const GENERIC_STREETS = ['Airport Road', 'Station Road', 'Hospital Road', 'Market Road', 'Club Road', 'Stadium Road', 'Ahmadu Bello Way', 'Murtala Mohammed Way', 'Independence Avenue', 'New Layout Road', 'Government House Road', 'Old Garage Road']

const ZONE_SELLER: Record<Zone, string> = { NW: 's17', NE: 's17', SW: 's18', SE: 's19', NC: 's20', SS: 's21' }

const LAND_FEATURES = ['Dry Land', 'Fenced', 'Gated Estate', 'Tarred Road', 'Electricity Available', 'Good Drainage', 'Corner Piece', 'Instant Allocation', 'Security']
const HOME_FACILITIES = ['24-hour Electricity', 'Borehole Water', 'Security', 'Gated Estate', 'Parking Space', 'POP Ceiling', 'Tiled Floor', 'Fitted Kitchen', 'Wardrobe', 'Air Conditioning', 'Prepaid Meter', 'Balcony', 'Inverter / Solar', 'CCTV']
const LUX_FACILITIES = ['Swimming Pool', 'Gym', 'Boys Quarters (BQ)', 'Smart Home', 'CCTV', 'Inverter / Solar']
const SHORTLET_FACILITIES = ['24-hour Electricity', 'Wi-Fi', 'Air Conditioning', 'Smart TV with streaming', 'Security', 'Fitted Kitchen', 'Parking Space', 'Housekeeping', 'Hot Water']
const COMMERCIAL_FACILITIES = ['24-hour Electricity', 'Parking Space', 'Security', 'CCTV', 'Elevator', 'Fire Safety', 'Loading Bay', 'Generator', 'Road Frontage']

function sellerFor(category: CategorySlug, city: string): string {
  if (city === 'lagos') return pick(['s10', 's10', 's11'])
  if (city === 'abuja') return 's12'
  if (city === 'owerri') return 's13'
  if (city === 'uyo') return 's14'
  if (city !== 'port-harcourt') return ZONE_SELLER[stateOfCity(city)?.zone ?? 'SS']
  if (category.startsWith('land')) return pick(['s3', 's3', 's3', 's1', 's5'])
  if (category.startsWith('commercial')) return pick(['s6', 's6', 's9'])
  if (category === 'short-let') return pick(['s7', 's2', 's7'])
  if (category === 'new-builds') return 's8'
  if (category === 'event-centres-venues') return 's15'
  return pick(['s1', 's1', 's2', 's4', 's5', 's9', 's16'])
}

function photos(kind: 'home' | 'flat' | 'shortlet' | 'land' | 'office' | 'shop' | 'event', i: number): string[] {
  const rot = <T,>(arr: T[], k: number) => arr[(i * 7 + k * 3) % arr.length]!
  switch (kind) {
    case 'home':
      return [rot(POOLS.exterior, 0), rot(POOLS.interior, 1), rot(POOLS.kitchen, 2), rot(POOLS.interior, 4), POOLS.bedroom[0]!, rot(POOLS.exterior, 5)]
    case 'flat':
      // Only three building shots exist, so alternate covers to avoid look-alike cards.
      return i % 2
        ? [rot(POOLS.interior, 0), rot(POOLS.building, 1), rot(POOLS.kitchen, 2), POOLS.bedroom[0]!, rot(POOLS.interior, 3)]
        : [rot(POOLS.building, 0), rot(POOLS.interior, 1), rot(POOLS.kitchen, 2), POOLS.bedroom[0]!, rot(POOLS.interior, 3)]
    case 'shortlet':
      return [rot(POOLS.interior, 0), POOLS.bedroom[0]!, rot(POOLS.kitchen, 1), rot(POOLS.interior, 2), rot(POOLS.exterior, 3)]
    case 'land':
      return [rot(POOLS.land, 0), rot(POOLS.land, 1), rot(POOLS.land, 2)]
    case 'office':
      return [rot(POOLS.office, 0), rot(POOLS.office, 1), rot(POOLS.building, 2)]
    case 'shop':
      return [POOLS.shop[0]!, rot(POOLS.building, 1), rot(POOLS.office, 2)]
    case 'event':
      return [rot(POOLS.event, 0), rot(POOLS.event, 1), rot(POOLS.event, 2)]
  }
}

const furnishing = (): Furnishing => (chance(0.68) ? 'Unfurnished' : chance(0.6) ? 'Semi-Furnished' : 'Furnished')
const condition = (): Condition => (chance(0.42) ? 'Newly-Built' : chance(0.55) ? 'Renovated' : 'Fairly Used')

interface Draft extends Partial<Listing> {
  category: CategorySlug
  propertyType: string
  title: string
  price: number
  priceUnit: PriceUnit
  description: string
  images: string[]
}

const bedsFor = (type: string) => {
  switch (type) {
    case 'Self Contain':
    case 'Mini Flat':
    case 'Room & Parlour':
    case 'Studio Apartment':
      return 1
    case 'Apartment':
      return int(1, 4)
    case 'Bungalow':
      return int(2, 4)
    case 'Block of Flats':
      return int(2, 3)
    case 'Mansion':
      return int(6, 8)
    case 'Penthouse':
      return int(3, 4)
    case 'Duplex':
    case 'Detached Duplex':
      return int(4, 6)
    default:
      return int(3, 5)
  }
}

const homeLabel = (type: string, beds: number) => {
  if (['Self Contain', 'Mini Flat', 'Room & Parlour', 'Studio Apartment'].includes(type)) return type
  if (type === 'Apartment') return `${beds} Bedroom Flat`
  if (type === 'Block of Flats') return `Block of ${int(4, 8)} × ${beds} Bedroom Flats`
  return `${beds} Bedroom ${type}`
}

function rentDraft(area: string, mult: number): Draft {
  const type = pick(['Self Contain', 'Mini Flat', 'Apartment', 'Apartment', 'Apartment', 'Bungalow', 'Duplex', 'Terraced Duplex', 'Block of Flats', 'Studio Apartment', 'Room & Parlour', 'Penthouse'])
  const beds = bedsFor(type)
  const base: Record<string, number> = {
    'Self Contain': between(350, 650) * 1000,
    'Mini Flat': between(600, 1000) * 1000,
    'Room & Parlour': between(450, 700) * 1000,
    'Studio Apartment': between(800, 1400) * 1000,
    Apartment: beds * between(650, 1150) * 1000,
    Bungalow: beds * between(600, 1000) * 1000,
    Duplex: beds * between(1200, 2200) * 1000,
    'Terraced Duplex': beds * between(1000, 1800) * 1000,
    'Block of Flats': between(6, 12) * 1_000_000,
    Penthouse: between(8, 15) * 1_000_000,
  }
  const price = roundTo(base[type]! * mult, 50_000)
  const f = furnishing()
  const c = condition()
  const label = homeLabel(type, beds)
  const title = pick([
    `${c === 'Newly-Built' ? 'Newly Built ' : ''}${label} in ${area}`,
    `Spacious ${label} for Rent — ${area}`,
    `${label} to Let in ${area}`,
    `${f === 'Furnished' ? 'Furnished ' : ''}${label} at ${area}`,
  ])
  const facilities = sample(HOME_FACILITIES, int(4, 9)).concat(type === 'Duplex' || type === 'Penthouse' ? sample(LUX_FACILITIES, 2) : [])
  const agentFee = pick([5, 10, 10, 10])
  const caution = roundTo(price * pick([0.1, 0.1, 0.05, 0]), 10_000)
  const description = [
    `${pick(['Tastefully finished', 'Clean and spacious', 'Well-maintained', 'Beautifully finished'])} ${label.toLowerCase()} available for rent in ${area}.`,
    `\nFeatures:\n${facilities.slice(0, 6).map((x) => `• ${x}`).join('\n')}\n• ${beds > 1 ? `All ${beds} rooms en-suite` : 'En-suite bathroom'}`,
    `\nRent: ${new Intl.NumberFormat('en-NG').format(price)} per annum\nAgency: ${agentFee}%  •  Legal: ${agentFee}%${caution ? `  •  Caution: ₦${new Intl.NumberFormat('en-NG').format(caution)}` : ''}`,
    `\n${pick(['Inspection fee applies.', 'Inspection is free on weekdays.', 'Kindly call to book an inspection.', 'Serious tenants only, please.'])}`,
  ].join('\n')
  return {
    category: 'houses-apartments-for-rent',
    propertyType: type,
    title,
    price,
    priceUnit: 'per annum',
    bedrooms: beds,
    bathrooms: beds + (chance(0.4) ? 1 : 0),
    toilets: beds + 1,
    parking: type === 'Self Contain' || type === 'Room & Parlour' ? int(0, 1) : int(1, 4),
    furnishing: f,
    condition: c,
    facilities,
    agentFee,
    cautionFee: caution || undefined,
    serviceCharge: chance(0.3) ? roundTo(between(150, 600) * 1000, 10_000) : undefined,
    description,
    images: [],
  }
}

function saleDraft(area: string, mult: number, newBuild: boolean): Draft {
  const type = newBuild
    ? pick(['Terraced Duplex', 'Semi-Detached Duplex', 'Detached Duplex', 'Apartment', 'Bungalow'])
    : pick(['Bungalow', 'Bungalow', 'Detached Duplex', 'Semi-Detached Duplex', 'Terraced Duplex', 'Block of Flats', 'Apartment', 'Mansion', 'Penthouse'])
  const beds = bedsFor(type)
  const base: Record<string, number> = {
    Bungalow: beds * between(12, 25),
    'Detached Duplex': beds * between(30, 60),
    'Semi-Detached Duplex': beds * between(24, 42),
    'Terraced Duplex': beds * between(20, 35),
    'Block of Flats': between(80, 300),
    Apartment: beds * between(15, 30),
    Mansion: between(400, 1200),
    Penthouse: between(150, 400),
  }
  const price = roundTo(base[type]! * mult * 1_000_000, 1_000_000)
  const c: Condition = newBuild ? (chance(0.45) ? 'Off-Plan' : 'Newly-Built') : condition()
  const label = homeLabel(type, beds)
  const size = roundTo(type === 'Mansion' ? between(1200, 2500) : between(300, 1100), 5)
  const document = pick(['Certificate of Occupancy (C of O)', "Governor's Consent", 'Deed of Assignment', 'Deed of Conveyance'])
  const facilities = sample(HOME_FACILITIES, int(5, 9)).concat(sample(LUX_FACILITIES, type === 'Mansion' || type === 'Penthouse' ? 4 : int(0, 2)))
  const estate = chance(0.5) ? pick(ESTATES) : undefined
  const title = newBuild
    ? pick([`${c === 'Off-Plan' ? 'Off-Plan ' : 'Brand New '}${label} — ${estate ?? area}`, `Contemporary ${label} in ${area} (Payment Plan)`, `${label} Selling at ${estate ?? area}`])
    : pick([`${label} for Sale in ${area}`, `${c === 'Newly-Built' ? 'Newly Built ' : ''}${label} — ${estate ?? area}`, `Lovely ${label} with ${document.includes('C of O') ? 'C of O' : 'Good Title'} in ${area}`])
  const description = [
    `${pick(['Contemporary', 'Well-built', 'Elegant', 'Exquisitely finished'])} ${label.toLowerCase()} ${newBuild ? 'by a trusted developer ' : ''}located in ${estate ? `${estate}, ` : ''}${area}.`,
    `\nThe house sits on about ${size} sqm and comes with:\n${facilities.slice(0, 7).map((x) => `• ${x}`).join('\n')}`,
    `\nTitle: ${document}`,
    newBuild
      ? `\nPayment plan: ${pick(['30% initial deposit, balance spread over 12 months', '40% deposit, balance over 18 months', '50% deposit, balance at completion'])}. Completion: ${pick(['Q2 2027', 'Q4 2026', 'Q1 2027', 'December 2026'])}.`
      : `\n${pick(['Price is slightly negotiable after inspection.', 'Distress sale — owner relocating.', 'Ready for immediate occupation.', 'Ideal for family living or rental income.'])}`,
  ].join('\n')
  return {
    category: newBuild ? 'new-builds' : 'houses-apartments-for-sale',
    propertyType: type,
    title,
    price,
    priceUnit: 'total',
    bedrooms: beds,
    bathrooms: beds + 1,
    toilets: beds + 1,
    parking: int(2, type === 'Mansion' ? 10 : 6),
    sizeSqm: size,
    furnishing: newBuild ? 'Unfurnished' : furnishing(),
    condition: c,
    document,
    estate,
    facilities,
    agentFee: newBuild ? undefined : pick([5, 5, 10]),
    description,
    images: [],
  }
}

function landDraft(area: string, mult: number, lease: boolean, citySlug: string): Draft {
  const type = lease ? pick(['Commercial Land', 'Farmland', 'Open Yard', 'Residential Land']) : pick(['Residential Land', 'Residential Land', 'Estate Plot', 'Estate Plot', 'Commercial Land', 'Mixed-Use Land', 'Farmland'])
  const plots = type === 'Farmland' ? int(4, 40) : pick([1, 1, 1, 2, 2, 3, 4, 6])
  const plotSqm = citySlug === 'lagos' ? 600 : 465
  const estate = type === 'Estate Plot' || chance(0.3) ? pick(ESTATES) : undefined
  const document = pick(LAND_DOCUMENTS)
  const features = sample(LAND_FEATURES, int(3, 6))
  if (lease) {
    const price = roundTo(between(1.5, 12) * mult * 1_000_000, 100_000)
    return {
      category: 'land-plots-for-rent',
      propertyType: type,
      title: pick([`${plots} Plot${plots > 1 ? 's' : ''} for Lease in ${area}`, `${type} Available for Lease — ${area}`, `Fenced ${type} for Lease at ${area}`]),
      price,
      priceUnit: 'per annum',
      plots,
      sizeSqm: plots * plotSqm,
      facilities: features,
      description: `${plots} plot${plots > 1 ? 's' : ''} of ${type.toLowerCase()} available on lease in ${area}.\n\nSuitable for: ${pick(['car park or mechanic yard', 'warehouse or storage yard', 'block industry', 'crop farming or poultry', 'event ground or shop containers'])}.\n\n${features.map((x) => `• ${x}`).join('\n')}\n\nMinimum lease: ${pick(['2 years', '3 years', '5 years'])}.`,
      images: [],
    }
  }
  const perPlot = roundTo(between(type === 'Farmland' ? 0.6 : 3, type === 'Commercial Land' ? 60 : 35) * mult * 1_000_000, 500_000)
  const perPlotPricing = chance(0.65)
  const title = pick([
    `${plots} Plot${plots > 1 ? 's' : ''} of Land at ${estate ?? area}`,
    `${type} for Sale in ${area} (${document.split(' (')[0]})`,
    `${plots > 1 ? `${plots} Plots` : 'Plot'} in ${estate ?? area} — ${pick(['Dry Land', 'Instant Allocation', 'Good Title', 'Corner Piece'])}`,
    `Affordable ${type} — ${area}, ${plots * plotSqm} sqm`,
  ])
  return {
    category: 'land-plots-for-sale',
    propertyType: type,
    title,
    price: perPlotPricing ? perPlot : perPlot * plots,
    priceUnit: perPlotPricing ? 'per plot' : 'total',
    plots,
    sizeSqm: plots * plotSqm,
    document,
    estate,
    facilities: features,
    agentFee: chance(0.6) ? pick([5, 10]) : undefined,
    description: `${plots} plot${plots > 1 ? 's' : ''} (${plots * plotSqm} sqm) of ${type.toLowerCase()} for sale${estate ? ` inside ${estate}` : ''}, ${area}.\n\nTitle: ${document}\n\nFeatures:\n${features.map((x) => `• ${x}`).join('\n')}\n\n${pick(['Free site inspection every Saturday.', 'Survey and documents available for verification at your lawyer’s office.', 'Buy and build immediately — no family wahala.', 'Allocation within 7 days of full payment.'])}`,
    images: [],
  }
}

function shortletDraft(area: string, mult: number): Draft {
  const type = pick(['Studio Apartment', 'Apartment', 'Apartment', 'Mini Flat', 'Duplex', 'Penthouse'])
  const beds = type === 'Duplex' ? int(3, 5) : type === 'Penthouse' ? int(3, 4) : type === 'Apartment' ? int(1, 3) : 1
  const base: Record<string, number> = {
    'Studio Apartment': between(35, 60),
    'Mini Flat': between(40, 70),
    Apartment: beds * between(35, 65),
    Duplex: between(150, 350),
    Penthouse: between(250, 500),
  }
  const price = roundTo(base[type]! * mult * 1000, 5000)
  const facilities = sample(SHORTLET_FACILITIES, int(5, 8)).concat(chance(0.3) ? ['Swimming Pool'] : [])
  const label = type === 'Apartment' ? `${beds} Bedroom Apartment` : beds > 1 ? `${beds} Bedroom ${type}` : type
  return {
    category: 'short-let',
    propertyType: type,
    title: pick([`Cozy ${label} Short Let — ${area}`, `Luxury ${label} (Short Let) in ${area}`, `Serviced ${label} for Short Stay at ${area}`]),
    price,
    priceUnit: 'per day',
    bedrooms: beds,
    bathrooms: beds,
    toilets: beds + 1,
    parking: int(1, 3),
    furnishing: 'Furnished',
    condition: chance(0.6) ? 'Newly-Built' : 'Renovated',
    facilities,
    cautionFee: roundTo(price * pick([0.5, 1, 1.5]), 5000),
    description: `Fully serviced ${label.toLowerCase()} in a quiet part of ${area}.\n\nWhat you get:\n${facilities.map((x) => `• ${x}`).join('\n')}\n\nCheck-in: 2pm  •  Check-out: 12 noon\nRefundable caution deposit applies. ${pick(['No parties.', 'Small gatherings allowed with prior approval.', 'Weekly and monthly discounts available.'])}`,
    images: [],
  }
}

function commercialDraft(area: string, mult: number, sale: boolean): Draft {
  const type = sale ? pick(['Office Space', 'Shop', 'Warehouse', 'Plaza', 'Hotel', 'School Building']) : pick(['Office Space', 'Office Space', 'Shop', 'Shop', 'Warehouse', 'Plaza', 'Filling Station', 'Hotel'])
  const sqm: Record<string, [number, number]> = {
    'Office Space': [50, 500],
    Shop: [15, 80],
    Warehouse: [500, 3000],
    Plaza: [600, 2000],
    'Filling Station': [1200, 2500],
    Hotel: [1500, 4000],
    'School Building': [1200, 3000],
  }
  const [lo, hi] = sqm[type]!
  const size = roundTo(between(lo, hi), 5)
  const rentBase: Record<string, [number, number]> = {
    'Office Space': [2, 25], Shop: [0.6, 4], Warehouse: [8, 40], Plaza: [30, 80], 'Filling Station': [15, 40], Hotel: [25, 60],
  }
  const saleBase: Record<string, [number, number]> = {
    'Office Space': [150, 900], Shop: [15, 60], Warehouse: [120, 600], Plaza: [250, 1500], Hotel: [300, 1200], 'School Building': [150, 500],
  }
  const [pl, ph] = (sale ? saleBase : rentBase)[type]!
  const price = roundTo(between(pl, ph) * mult * 1_000_000, sale ? 1_000_000 : 50_000)
  const facilities = sample(COMMERCIAL_FACILITIES, int(4, 7))
  return {
    category: sale ? 'commercial-property-for-sale' : 'commercial-property-for-rent',
    propertyType: type,
    title: pick([`${type} ${sale ? 'for Sale' : 'to Let'} on ${pick(STREETS)}, ${area}`, `${size} sqm ${type} — ${area}`, `Prime ${type} ${sale ? 'for Sale' : 'for Rent'} in ${area}`]),
    price,
    priceUnit: sale ? 'total' : 'per annum',
    sizeSqm: size,
    parking: int(2, 30),
    toilets: int(2, 12),
    condition: condition(),
    document: sale ? pick(['Certificate of Occupancy (C of O)', "Governor's Consent", 'Deed of Assignment']) : undefined,
    facilities,
    agentFee: pick([5, 10]),
    serviceCharge: !sale && type !== 'Warehouse' ? roundTo(between(300, 2500) * 1000, 50_000) : undefined,
    description: `${size} sqm ${type.toLowerCase()} ${sale ? 'for sale' : 'available to let'} in a high-traffic part of ${area}.\n\n${facilities.map((x) => `• ${x}`).join('\n')}\n\n${pick(['Ideal for banks, telecoms and corporate offices.', 'Good for supermarket, pharmacy or showroom.', 'Suitable for logistics, FMCG and oil & gas servicing.', 'Currently yielding rental income.'])}`,
    images: [],
  }
}

function eventDraft(area: string, mult: number): Draft {
  const type = pick(['Event Hall', 'Event Hall', 'Conference Room', 'Co-working Space', 'Outdoor Venue'])
  const cap = type === 'Event Hall' ? int(200, 1500) : type === 'Conference Room' ? int(15, 120) : type === 'Co-working Space' ? 1 : int(300, 2000)
  const base: Record<string, [number, number]> = { 'Event Hall': [250, 1500], 'Conference Room': [50, 200], 'Co-working Space': [8, 20], 'Outdoor Venue': [150, 600] }
  const [lo, hi] = base[type]!
  const price = roundTo(between(lo, hi) * mult * 1000, 5000)
  const facilities = sample(['Air Conditioning', 'Generator', 'Parking Space', 'Security', 'Projector & Screen', 'Sound System', 'Wi-Fi', 'Changing Room', 'Kitchen Space', 'Tables & Chairs'], int(4, 7))
  return {
    category: 'event-centres-venues',
    propertyType: type,
    title: type === 'Co-working Space' ? `Co-working Desk & Meeting Pods — ${area}` : `${cap}-Capacity ${type} in ${area}`,
    price,
    priceUnit: 'per day',
    sizeSqm: type === 'Co-working Space' ? undefined : roundTo(cap * 1.4, 10),
    parking: type === 'Co-working Space' ? int(5, 15) : int(20, 150),
    facilities,
    cautionFee: type === 'Co-working Space' ? undefined : roundTo(price * 0.3, 5000),
    description: `${type === 'Co-working Space' ? 'Flexible desks for freelancers and remote teams' : `${type} that seats up to ${cap} guests`} in ${area}.\n\n${facilities.map((x) => `• ${x}`).join('\n')}\n\nBook by the day. ${pick(['Weekend bookings fill fast — reserve early.', 'Corporate discounts available.', 'Decor and catering partners on request.'])}`,
    images: [],
  }
}

const CATEGORY_COUNTS: [CategorySlug, number][] = [
  ['houses-apartments-for-rent', 52],
  ['houses-apartments-for-sale', 36],
  ['land-plots-for-sale', 38],
  ['land-plots-for-rent', 8],
  ['short-let', 22],
  ['new-builds', 12],
  ['commercial-property-for-rent', 14],
  ['commercial-property-for-sale', 8],
  ['event-centres-venues', 8],
]

// The original five launch cities, named explicitly so their seeded adverts never change.
const LAUNCH_CITIES = ['port-harcourt', 'lagos', 'abuja', 'owerri', 'uyo']
const [PH, LAGOS, ABUJA, OWERRI, UYO] = LAUNCH_CITIES.map((s) => cityBySlug(s)!)

function pickCity() {
  const r = rand()
  if (r < 0.66) return PH!
  if (r < 0.79) return LAGOS!
  if (r < 0.91) return ABUJA!
  if (r < 0.96) return OWERRI!
  return UYO!
}

function makeListing(cat: CategorySlug, city: City, i: number, now: number): Listing {
      const area = pick(city.areas)
      const mult = (CITY_MULT[city.slug] ?? DEFAULT_MULT) * areaMult(area)
      let d: Draft
      let kind: Parameters<typeof photos>[0]
      switch (cat) {
        case 'houses-apartments-for-rent':
          d = rentDraft(area, mult)
          kind = ['Apartment', 'Block of Flats', 'Self Contain', 'Mini Flat', 'Room & Parlour', 'Studio Apartment'].includes(d.propertyType) ? 'flat' : 'home'
          break
        case 'houses-apartments-for-sale':
          d = saleDraft(area, mult, false)
          kind = d.propertyType === 'Block of Flats' || d.propertyType === 'Apartment' ? 'flat' : 'home'
          break
        case 'new-builds':
          d = saleDraft(area, mult, true)
          kind = d.propertyType === 'Apartment' ? 'flat' : 'home'
          break
        case 'land-plots-for-sale':
          d = landDraft(area, mult, false, city.slug)
          kind = 'land'
          break
        case 'land-plots-for-rent':
          d = landDraft(area, mult, true, city.slug)
          kind = 'land'
          break
        case 'short-let':
          d = shortletDraft(area, mult)
          kind = 'shortlet'
          break
        case 'commercial-property-for-rent':
        case 'commercial-property-for-sale':
          d = commercialDraft(area, mult, cat === 'commercial-property-for-sale')
          kind = d.propertyType === 'Shop' ? 'shop' : 'office'
          break
        default:
          d = eventDraft(area, mult)
          kind = 'event'
      }
      // Skew posting times toward the last few days.
      const hoursAgo = Math.floor(Math.pow(rand(), 2.2) * 24 * 75) + 1
      const tierRoll = rand()
      const tier: Tier | undefined = tierRoll < 0.1 ? 'featured' : tierRoll < 0.18 ? 'top' : tierRoll < 0.25 ? 'boost' : undefined
      return {
        ...d,
        id: `p${1000 + i}`,
        slug: slugify(d.title),
        negotiable: chance(0.55),
        city: city.slug,
        area,
        address: d.category.startsWith('land') ? undefined : `${int(2, 48)} ${pick(city.slug === 'port-harcourt' ? STREETS : GENERIC_STREETS)}, ${area}`,
        facilities: d.facilities ?? [],
        images: photos(kind, i),
        sellerId: sellerFor(cat, city.slug),
        postedAt: new Date(now - hoursAgo * 3600_000).toISOString(),
        views: int(12, 2400),
        tier,
        status: 'active',
        lat: city.lat + between(-0.05, 0.05),
        lng: city.lng + between(-0.05, 0.05),
      }
}

// Every other city gets a few adverts so no state is empty: 4 in each capital, 2 elsewhere.
const CAPITAL_MIX: CategorySlug[] = ['houses-apartments-for-rent', 'land-plots-for-sale', 'houses-apartments-for-sale', 'short-let']
const TOWN_MIX: CategorySlug[] = ['houses-apartments-for-rent', 'land-plots-for-sale']

function generate(): Listing[] {
  const out: Listing[] = []
  const now = Date.now()
  let i = 0
  for (const [cat, count] of CATEGORY_COUNTS) {
    for (let k = 0; k < count; k++, i++) {
      const city = cat === 'event-centres-venues' ? (chance(0.8) ? PH! : pickCity()) : pickCity()
      out.push(makeListing(cat, city, i, now))
    }
  }
  for (const st of STATES) {
    st.cities.forEach((slug, idx) => {
      if (LAUNCH_CITIES.includes(slug)) return
      for (const cat of idx === 0 ? CAPITAL_MIX : TOWN_MIX) out.push(makeListing(cat, cityBySlug(slug)!, i++, now))
    })
  }
  return out
}

export const SEED_LISTINGS: Listing[] = generate()
