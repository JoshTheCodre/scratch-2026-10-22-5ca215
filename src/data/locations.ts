import type { City } from '../types'

export const ALL_CITIES = 'nigeria'
export const DEFAULT_CITY = 'port-harcourt'

export const CITIES: City[] = [
  {
    slug: 'port-harcourt',
    name: 'Port Harcourt',
    state: 'Rivers',
    lat: 4.8156,
    lng: 7.0498,
    areas: [
      'GRA Phase 2', 'Old GRA', 'Woji', 'Trans Amadi', 'Peter Odili Road', 'Eneka', 'Rumuokoro', 'Rumuola',
      'Ada George', 'D-Line', 'Elelenwo', 'Choba', 'Eliozu', 'Rukpokwu', 'Rumuibekwe', 'Rumuigbo',
      'Borokiri', 'Mile 1', 'Rumuodara', 'Shell Location', 'Aba Road', 'Igwuruta', 'Oyigbo', 'Rumuogba',
    ],
  },
  {
    slug: 'lagos',
    name: 'Lagos',
    state: 'Lagos',
    lat: 6.4698,
    lng: 3.5852,
    areas: ['Lekki Phase 1', 'Ikoyi', 'Victoria Island', 'Ajah', 'Yaba', 'Ikeja GRA', 'Magodo', 'Surulere', 'Sangotedo', 'Ibeju-Lekki', 'Chevron', 'Gbagada'],
  },
  {
    slug: 'abuja',
    name: 'Abuja',
    state: 'FCT',
    lat: 9.0765,
    lng: 7.3986,
    areas: ['Maitama', 'Asokoro', 'Wuse 2', 'Gwarinpa', 'Jabi', 'Lokogoma', 'Katampe', 'Kubwa', 'Lugbe', 'Guzape', 'Life Camp'],
  },
  {
    slug: 'owerri',
    name: 'Owerri',
    state: 'Imo',
    lat: 5.4836,
    lng: 7.0333,
    areas: ['New Owerri', 'Ikenegbu', 'World Bank', 'Egbu Road', 'Aladinma', 'Irete'],
  },
  {
    slug: 'uyo',
    name: 'Uyo',
    state: 'Akwa Ibom',
    lat: 5.0377,
    lng: 7.9128,
    areas: ['Ewet Housing', 'Shelter Afrique', 'Osongama', 'Nwaniba Road', 'Oron Road', 'Ikot Ekpene Road'],
  },
]

export const cityBySlug = (slug?: string) => CITIES.find((c) => c.slug === slug)

export const cityName = (slug?: string) => (slug === ALL_CITIES || !slug ? 'Nigeria' : cityBySlug(slug)?.name ?? 'Nigeria')
