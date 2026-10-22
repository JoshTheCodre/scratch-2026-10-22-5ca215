import type { Category, CategorySlug } from '../types'

export const ALL_CATEGORIES = 'real-estate'

export const CATEGORIES: Category[] = [
  {
    slug: 'houses-apartments-for-rent',
    name: 'Houses & Apartments For Rent',
    short: 'For Rent',
    deal: 'rent',
    group: 'residential',
    types: ['Self Contain', 'Mini Flat', 'Apartment', 'Bungalow', 'Duplex', 'Terraced Duplex', 'Block of Flats', 'Studio Apartment', 'Room & Parlour', 'Penthouse'],
    blurb: 'Flats, duplexes, self-contains and more — paid yearly or monthly.',
  },
  {
    slug: 'houses-apartments-for-sale',
    name: 'Houses & Apartments For Sale',
    short: 'For Sale',
    deal: 'sale',
    group: 'residential',
    types: ['Bungalow', 'Detached Duplex', 'Semi-Detached Duplex', 'Terraced Duplex', 'Block of Flats', 'Apartment', 'Mansion', 'Penthouse'],
    blurb: 'Own a home — bungalows, duplexes, mansions and blocks of flats.',
  },
  {
    slug: 'land-plots-for-sale',
    name: 'Land & Plots for Sale',
    short: 'Land for Sale',
    deal: 'sale',
    group: 'land',
    types: ['Residential Land', 'Commercial Land', 'Mixed-Use Land', 'Farmland', 'Estate Plot'],
    blurb: 'Dry land, estate plots, farmland and commercial land with documents.',
  },
  {
    slug: 'land-plots-for-rent',
    name: 'Land & Plots for Lease',
    short: 'Land for Lease',
    deal: 'rent',
    group: 'land',
    types: ['Commercial Land', 'Farmland', 'Open Yard', 'Residential Land'],
    blurb: 'Lease land for yards, farms, car parks and business sites.',
  },
  {
    slug: 'short-let',
    name: 'Short Let',
    short: 'Short Let',
    deal: 'shortlet',
    group: 'residential',
    types: ['Studio Apartment', 'Apartment', 'Duplex', 'Penthouse', 'Mini Flat'],
    blurb: 'Serviced apartments by the night — for trips, staycations and events.',
  },
  {
    slug: 'new-builds',
    name: 'New Builds',
    short: 'New Builds',
    deal: 'sale',
    group: 'residential',
    types: ['Terraced Duplex', 'Semi-Detached Duplex', 'Detached Duplex', 'Apartment', 'Bungalow'],
    blurb: 'Off-plan and just-completed homes direct from developers.',
  },
  {
    slug: 'commercial-property-for-rent',
    name: 'Commercial Property for Rent',
    short: 'Commercial Rent',
    deal: 'rent',
    group: 'commercial',
    types: ['Office Space', 'Shop', 'Warehouse', 'Plaza', 'Filling Station', 'Hotel'],
    blurb: 'Offices, shops, warehouses and plazas to let.',
  },
  {
    slug: 'commercial-property-for-sale',
    name: 'Commercial Property for Sale',
    short: 'Commercial Sale',
    deal: 'sale',
    group: 'commercial',
    types: ['Office Space', 'Shop', 'Warehouse', 'Plaza', 'Hotel', 'School Building'],
    blurb: 'Income-earning buildings, plazas, hotels and warehouses.',
  },
  {
    slug: 'event-centres-venues',
    name: 'Event Centres & Workspaces',
    short: 'Event Centres',
    deal: 'shortlet',
    group: 'venue',
    types: ['Event Hall', 'Conference Room', 'Co-working Space', 'Outdoor Venue'],
    blurb: 'Halls, conference rooms and co-working desks by the day.',
  },
]

export const categoryBySlug = (slug?: string) => CATEGORIES.find((c) => c.slug === slug)

export const isCategorySlug = (slug: string): slug is CategorySlug => CATEGORIES.some((c) => c.slug === slug)

export const FACILITIES = [
  '24-hour Electricity',
  'Borehole Water',
  'Security',
  'Gated Estate',
  'Parking Space',
  'POP Ceiling',
  'Tiled Floor',
  'Fitted Kitchen',
  'Wardrobe',
  'Air Conditioning',
  'Swimming Pool',
  'Gym',
  'Boys Quarters (BQ)',
  'CCTV',
  'Inverter / Solar',
  'Prepaid Meter',
  'Wi-Fi',
  'Smart Home',
  'Balcony',
  'Tarred Road',
]

export const LAND_DOCUMENTS = [
  'Certificate of Occupancy (C of O)',
  'Deed of Conveyance',
  "Governor's Consent",
  'Registered Survey Plan',
  'Deed of Assignment',
  'Gazette / Excision',
]

export const FURNISHING = ['Furnished', 'Semi-Furnished', 'Unfurnished'] as const
export const CONDITIONS = ['Newly-Built', 'Renovated', 'Fairly Used', 'Off-Plan'] as const
