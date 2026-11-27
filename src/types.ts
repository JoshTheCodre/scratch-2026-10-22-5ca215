export type CategorySlug =
  | 'houses-apartments-for-rent'
  | 'houses-apartments-for-sale'
  | 'land-plots-for-sale'
  | 'land-plots-for-rent'
  | 'short-let'
  | 'commercial-property-for-rent'
  | 'event-centres-venues'

export type Deal = 'rent' | 'sale' | 'shortlet'
export type CategoryGroup = 'residential' | 'land' | 'commercial' | 'venue'

export interface Category {
  slug: CategorySlug
  name: string
  short: string
  deal: Deal
  group: CategoryGroup
  types: string[]
  blurb: string
}

export type PriceUnit = 'total' | 'per annum' | 'per month' | 'per day' | 'per plot' | 'per sqm'

export type Furnishing = 'Furnished' | 'Semi-Furnished' | 'Unfurnished'
export type Condition = 'Newly-Built' | 'Renovated' | 'Fairly Used' | 'Off-Plan'

export interface City {
  slug: string
  name: string
  /** State name, e.g. "Rivers" or "FCT". */
  state: string
  stateSlug: string
  lat: number
  lng: number
  areas: string[]
}

/** Nigeria's six geopolitical zones. */
export type Zone = 'NC' | 'NE' | 'NW' | 'SE' | 'SS' | 'SW'

export interface NgState {
  slug: string
  name: string
  /** Display label, e.g. "Kano State" or "Abuja (FCT)". */
  label: string
  zone: Zone
  /** City slugs, capital first. */
  cities: string[]
}

export type SellerType = 'Agent' | 'Developer' | 'Owner' | 'Company'

export interface Seller {
  id: string
  name: string
  type: SellerType
  verified: boolean
  enterprise: boolean
  joinedYear: number
  rating: number
  reviews: number
  responseTime: string
  phone: string
  color: string
  city: string
  bio: string
}

export type Tier = 'featured' | 'top' | 'boost'

export interface Listing {
  id: string
  slug: string
  title: string
  category: CategorySlug
  propertyType: string
  price: number
  priceUnit: PriceUnit
  negotiable: boolean
  city: string
  area: string
  address?: string
  estate?: string
  bedrooms?: number
  bathrooms?: number
  toilets?: number
  parking?: number
  sizeSqm?: number
  plots?: number
  furnishing?: Furnishing
  condition?: Condition
  document?: string
  facilities: string[]
  agentFee?: number
  cautionFee?: number
  serviceCharge?: number
  description: string
  images: string[]
  sellerId: string
  postedAt: string
  views: number
  tier?: Tier
  status: 'active' | 'unavailable'
  lat: number
  lng: number
  isUserAd?: boolean
  /** When the owner takes inspections. Seed adverts derive this from their id. */
  inspection?: Availability
}

/** Weekly inspection window: days are 0 (Sun) – 6 (Sat), hours in 24h. */
export interface Availability {
  days: number[]
  from: number
  to: number
}

export type PlaceLabel = 'Church' | 'Mosque' | 'Work' | 'School' | 'Family' | 'Gym' | 'Other'

/** A place the user cares about, used for commute times. */
export interface Place {
  id: string
  label: PlaceLabel
  name: string
  city: string
  area?: string
  lat: number
  lng: number
}

export type BookingStatus = 'requested' | 'confirmed' | 'cancelled'

export interface Booking {
  id: string
  listingId: string
  sellerId: string
  /** Local date, YYYY-MM-DD. */
  date: string
  /** Hour of day, 24h. */
  hour: number
  name: string
  phone: string
  note?: string
  status: BookingStatus
  createdAt: string
}

export interface User {
  name: string
  phone: string
  email?: string
  sellerId: string
}

export interface ChatMessage {
  from: 'me' | 'them'
  text: string
  at: string
}

export interface Thread {
  id: string
  listingId: string
  sellerId: string
  messages: ChatMessage[]
  unread: number
}
