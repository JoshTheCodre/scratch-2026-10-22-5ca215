import type { Seller } from '../types'

// Fictional sellers used as demo data. Phone numbers use the 555 range on purpose.
export const SELLERS: Seller[] = [
  { id: 's1', name: 'Tamuno Homes & Properties', type: 'Company', verified: true, enterprise: true, joinedYear: 2016, rating: 4.8, reviews: 214, responseTime: 'Replies within an hour', phone: '+234 803 555 0101', color: '#0b7a5c', city: 'port-harcourt', bio: 'Residential lettings and sales across GRA, Woji and Peter Odili Road. Physical office on Olu Obasanjo Road.' },
  { id: 's2', name: 'Ibiso Realty', type: 'Agent', verified: true, enterprise: false, joinedYear: 2019, rating: 4.6, reviews: 88, responseTime: 'Replies within a few hours', phone: '+234 806 555 0102', color: '#7c3aed', city: 'port-harcourt', bio: 'Family homes and short lets in Woji, Elelenwo and Trans Amadi. Inspections daily except Sunday.' },
  { id: 's3', name: 'GreenField Land Co.', type: 'Company', verified: true, enterprise: true, joinedYear: 2017, rating: 4.7, reviews: 156, responseTime: 'Replies within an hour', phone: '+234 809 555 0103', color: '#15803d', city: 'port-harcourt', bio: 'Verified estate plots and dry land in Eneka, Rukpokwu, Igwuruta and Oyigbo. Free site inspection every Saturday.' },
  { id: 's4', name: 'Chidi Okafor', type: 'Agent', verified: true, enterprise: false, joinedYear: 2020, rating: 4.4, reviews: 41, responseTime: 'Replies within a day', phone: '+234 802 555 0104', color: '#c2410c', city: 'port-harcourt', bio: 'Affordable flats and self-contains around Choba, Rumuokoro and Ada George.' },
  { id: 's5', name: 'Blessing Amadi', type: 'Owner', verified: false, enterprise: false, joinedYear: 2023, rating: 4.2, reviews: 7, responseTime: 'Replies within a day', phone: '+234 805 555 0105', color: '#be185d', city: 'port-harcourt', bio: 'Landlord letting directly — no agency fee on my apartments.' },
  { id: 's6', name: 'Rivers Prime Realtors', type: 'Company', verified: true, enterprise: true, joinedYear: 2015, rating: 4.9, reviews: 302, responseTime: 'Replies within an hour', phone: '+234 807 555 0106', color: '#1d4ed8', city: 'port-harcourt', bio: 'Commercial lettings, plazas and warehouses in Trans Amadi, Aba Road and Mile 1.' },
  { id: 's7', name: 'Nengi Briggs', type: 'Agent', verified: true, enterprise: false, joinedYear: 2018, rating: 4.5, reviews: 63, responseTime: 'Replies within a few hours', phone: '+234 813 555 0107', color: '#0e7490', city: 'port-harcourt', bio: 'Luxury short lets and serviced apartments in Old GRA and GRA Phase 2.' },
  { id: 's8', name: 'Opara & Sons Developers', type: 'Developer', verified: true, enterprise: true, joinedYear: 2014, rating: 4.7, reviews: 129, responseTime: 'Replies within a few hours', phone: '+234 814 555 0108', color: '#a16207', city: 'port-harcourt', bio: 'Building terraces and semi-detached duplexes since 2009. Flexible 12–24 month payment plans.' },
  { id: 's9', name: 'Sotonye George', type: 'Agent', verified: false, enterprise: false, joinedYear: 2022, rating: 4.1, reviews: 12, responseTime: 'Replies within a day', phone: '+234 816 555 0109', color: '#4d7c0f', city: 'port-harcourt', bio: 'Rooms, mini flats and shops around D-Line, Mile 1 and Borokiri.' },
  { id: 's10', name: 'Lekki Keys Properties', type: 'Company', verified: true, enterprise: true, joinedYear: 2016, rating: 4.6, reviews: 187, responseTime: 'Replies within an hour', phone: '+234 818 555 0110', color: '#9333ea', city: 'lagos', bio: 'Homes, short lets and land on the Lekki–Epe corridor.' },
  { id: 's11', name: 'Kemi Adeyemi', type: 'Agent', verified: true, enterprise: false, joinedYear: 2019, rating: 4.5, reviews: 54, responseTime: 'Replies within a few hours', phone: '+234 810 555 0111', color: '#db2777', city: 'lagos', bio: 'Mainland rentals — Yaba, Surulere, Gbagada and Ikeja GRA.' },
  { id: 's12', name: 'Abuja Haven Realty', type: 'Company', verified: true, enterprise: true, joinedYear: 2017, rating: 4.7, reviews: 143, responseTime: 'Replies within an hour', phone: '+234 817 555 0112', color: '#0369a1', city: 'abuja', bio: 'Maitama, Asokoro, Guzape and Katampe — homes, offices and land.' },
  { id: 's13', name: 'Emeka Nwosu', type: 'Owner', verified: true, enterprise: false, joinedYear: 2021, rating: 4.3, reviews: 9, responseTime: 'Replies within a day', phone: '+234 812 555 0113', color: '#b45309', city: 'owerri', bio: 'Selling family land and letting flats in New Owerri.' },
  { id: 's14', name: 'Ebi Douglas Estates', type: 'Developer', verified: true, enterprise: false, joinedYear: 2018, rating: 4.4, reviews: 37, responseTime: 'Replies within a few hours', phone: '+234 815 555 0114', color: '#be123c', city: 'uyo', bio: 'New builds in Ewet Housing and Shelter Afrique, Uyo.' },
  { id: 's15', name: 'Venue Hub PH', type: 'Company', verified: true, enterprise: false, joinedYear: 2020, rating: 4.6, reviews: 71, responseTime: 'Replies within an hour', phone: '+234 819 555 0115', color: '#6d28d9', city: 'port-harcourt', bio: 'Event halls, conference rooms and co-working desks bookable by the day.' },
  { id: 's16', name: 'Ifeoma Eze', type: 'Agent', verified: false, enterprise: false, joinedYear: 2024, rating: 4.0, reviews: 3, responseTime: 'Replies within a day', phone: '+234 811 555 0116', color: '#047857', city: 'port-harcourt', bio: 'New on House4Rent.ng — rentals around Rumuola, Rumuigbo and Rumuogba.' },
]

export const sellerById = (id?: string) => SELLERS.find((s) => s.id === id)

export const REVIEWS = [
  { name: 'Tonye A.', rating: 5, text: 'Inspection was on time and the apartment matched the photos exactly. Smooth process.', ago: '2 weeks ago' },
  { name: 'Grace O.', rating: 4, text: 'Helpful and patient. Took me to three places before I found the right one.', ago: '1 month ago' },
  { name: 'Ikenna U.', rating: 5, text: 'Documents were genuine and the survey checked out. Would buy again.', ago: '2 months ago' },
  { name: 'Fatima B.', rating: 4, text: 'Quick replies. Price was slightly negotiable after inspection.', ago: '3 months ago' },
  { name: 'Daniel E.', rating: 3, text: 'Good property but the agent fee was not mentioned until the end.', ago: '5 months ago' },
]
