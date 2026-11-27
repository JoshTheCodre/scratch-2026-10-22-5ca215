import { cityBySlug } from '../data/locations'

// Approximate neighbourhood centres for the launch cities. Areas without an entry are
// spread around their city centre at a stable offset, so estimates stay consistent.
const AREA_COORDS: Record<string, Record<string, [number, number]>> = {
  'port-harcourt': {
    'GRA Phase 2': [4.818, 7.008],
    'Old GRA': [4.781, 7.012],
    Woji: [4.832, 7.062],
    'Trans Amadi': [4.811, 7.041],
    'Peter Odili Road': [4.807, 7.066],
    Eneka: [4.879, 7.036],
    Rumuokoro: [4.869, 7.001],
    Rumuola: [4.833, 7.017],
    'Ada George': [4.846, 6.975],
    'D-Line': [4.801, 7.006],
    Elelenwo: [4.842, 7.082],
    Choba: [4.894, 6.911],
    Eliozu: [4.864, 7.041],
    Rukpokwu: [4.889, 7.011],
    Rumuibekwe: [4.836, 7.046],
    Rumuigbo: [4.851, 6.996],
    Borokiri: [4.748, 7.041],
    'Mile 1': [4.795, 6.996],
    Rumuodara: [4.851, 7.052],
    'Shell Location': [4.826, 7.034],
    'Aba Road': [4.824, 7.021],
    Igwuruta: [4.951, 7.011],
    Oyigbo: [4.879, 7.141],
    Rumuogba: [4.821, 7.026],
  },
  lagos: {
    'Lekki Phase 1': [6.447, 3.472],
    Ikoyi: [6.454, 3.435],
    'Victoria Island': [6.428, 3.422],
    Ajah: [6.468, 3.585],
    Yaba: [6.51, 3.371],
    'Ikeja GRA': [6.58, 3.35],
    Magodo: [6.62, 3.385],
    Surulere: [6.5, 3.353],
    Sangotedo: [6.47, 3.63],
    'Ibeju-Lekki': [6.46, 3.78],
    Chevron: [6.44, 3.53],
    Gbagada: [6.555, 3.39],
  },
  abuja: {
    Maitama: [9.088, 7.493],
    Asokoro: [9.043, 7.525],
    'Wuse 2': [9.078, 7.47],
    Gwarinpa: [9.11, 7.41],
    Jabi: [9.067, 7.43],
    Lokogoma: [8.98, 7.47],
    Katampe: [9.115, 7.46],
    Kubwa: [9.15, 7.34],
    Lugbe: [8.98, 7.36],
    Guzape: [9.015, 7.505],
    'Life Camp': [9.07, 7.397],
  },
  owerri: {
    'New Owerri': [5.47, 7.02],
    Ikenegbu: [5.49, 7.04],
    'World Bank': [5.462, 7.03],
    'Egbu Road': [5.495, 7.05],
    Aladinma: [5.485, 7.03],
    Irete: [5.51, 6.99],
  },
  uyo: {
    'Ewet Housing': [5.02, 7.93],
    'Shelter Afrique': [5.03, 7.95],
    Osongama: [5.045, 7.93],
    'Nwaniba Road': [5.03, 7.96],
    'Oron Road': [5.025, 7.945],
    'Ikot Ekpene Road': [5.045, 7.89],
  },
}

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return (h >>> 0) / 4294967296
}

export interface Point {
  lat: number
  lng: number
}

/** Centre of an area, or of the city when no area is given. */
export function areaPoint(citySlug: string, area?: string): Point {
  const known = area ? AREA_COORDS[citySlug]?.[area] : undefined
  if (known) return { lat: known[0], lng: known[1] }
  const city = cityBySlug(citySlug)
  const base = { lat: city?.lat ?? 9.06, lng: city?.lng ?? 7.49 }
  if (!area) return base
  // Unknown area: a stable point 1–4.5 km from the centre.
  const angle = hash(`${citySlug}:${area}`) * Math.PI * 2
  const km = 1 + hash(`${area}:${citySlug}`) * 3.5
  return { lat: base.lat + (Math.sin(angle) * km) / 111, lng: base.lng + (Math.cos(angle) * km) / (111 * Math.cos((base.lat * Math.PI) / 180)) }
}

/** True when we have a measured centre for this area rather than an estimate. */
export const isMappedArea = (citySlug: string, area?: string) => Boolean(area && AREA_COORDS[citySlug]?.[area])

export function distanceKm(a: Point, b: Point) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

// Average door-to-door driving speeds (km/h) outside rush hour.
const CITY_SPEED: Record<string, number> = { lagos: 21, 'port-harcourt': 25, abuja: 36, owerri: 28, uyo: 30 }
const RUSH_FACTOR = 1.7

export interface Commute {
  /** Road distance estimate in km. */
  km: number
  drive: number
  driveRush: number
  keke: number
  walk?: number
  intercity: boolean
}

/** Rough commute estimate between two points. Roads are ~1.3× the straight line. */
export function commute(from: Point, to: Point, citySlug: string): Commute {
  const km = distanceKm(from, to) * 1.3 + 0.3
  const intercity = km > 45
  const speed = intercity ? 60 : CITY_SPEED[citySlug] ?? 30
  const drive = Math.max(3, Math.round((km / speed) * 60 + 3))
  return {
    km: Math.round(km * 10) / 10,
    drive,
    driveRush: intercity ? Math.round(drive * 1.2) : Math.round(drive * RUSH_FACTOR),
    keke: Math.round((km / 16) * 60 + 7),
    walk: km <= 3 ? Math.round((km / 4.5) * 60) : undefined,
    intercity,
  }
}

export function formatMinutes(min: number) {
  if (min < 60) return `${min} min`
  const rounded = Math.round(min / 5) * 5
  const h = Math.floor(rounded / 60)
  const m = rounded % 60
  return m ? `${h} h ${m} min` : `${h} h`
}
