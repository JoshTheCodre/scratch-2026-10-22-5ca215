import type { City, NgState, Zone } from '../types'

// All 36 states + the FCT, each with its capital first and other major cities.
// Coordinates are approximate city centres (used for the "approximate location" map);
// area lists are popular neighbourhoods — extend them as real listings come in.

export const ALL_CITIES = 'nigeria'
export const DEFAULT_CITY = 'port-harcourt'

type RawCity = Omit<City, 'state' | 'stateSlug'>
const c = (slug: string, name: string, lat: number, lng: number, areas: string[]): RawCity => ({ slug, name, lat, lng, areas })

const RAW: { slug: string; name: string; zone: Zone; cities: RawCity[] }[] = [
  { slug: 'abia-state', name: 'Abia', zone: 'SE', cities: [
    c('umuahia', 'Umuahia', 5.532, 7.486, ['Government Station', 'Ibeku', 'Afara', 'Ndume', 'Isi Court', 'Umuahia Town']),
    c('aba', 'Aba', 5.1066, 7.3667, ['Ogbor Hill', 'Ariaria', 'Eziukwu', 'Osisioma', 'Abayi', 'Asa Road']),
  ] },
  { slug: 'adamawa-state', name: 'Adamawa', zone: 'NE', cities: [
    c('yola', 'Yola', 9.2035, 12.4954, ['Jimeta', 'Karewa', 'Doubeli', 'Bekaji', 'Yola Town']),
    c('mubi', 'Mubi', 10.2676, 13.2644, ['Mubi Town', 'Lokuwa', 'Kolere']),
  ] },
  { slug: 'akwa-ibom-state', name: 'Akwa Ibom', zone: 'SS', cities: [
    c('uyo', 'Uyo', 5.0377, 7.9128, ['Ewet Housing', 'Shelter Afrique', 'Osongama', 'Nwaniba Road', 'Oron Road', 'Ikot Ekpene Road']),
    c('eket', 'Eket', 4.6423, 7.9244, ['Eket Town', 'Atabong', 'Afaha', 'Idua']),
  ] },
  { slug: 'anambra-state', name: 'Anambra', zone: 'SE', cities: [
    c('awka', 'Awka', 6.2104, 7.0741, ['Amawbia', 'Ifite', 'Okpuno', 'Agu-Awka', 'Nkwelle']),
    c('onitsha', 'Onitsha', 6.1413, 6.784, ['GRA', 'Fegge', 'Woliwo', 'Odoakpu', '3-3']),
    c('nnewi', 'Nnewi', 6.0174, 6.917, ['Otolo', 'Uruagu', 'Umudim', 'Nnewichi']),
  ] },
  { slug: 'bauchi-state', name: 'Bauchi', zone: 'NE', cities: [
    c('bauchi', 'Bauchi', 10.3158, 9.8442, ['GRA', 'Federal Lowcost', 'Yelwa', 'Wunti', 'Fadaman Mada']),
  ] },
  { slug: 'bayelsa-state', name: 'Bayelsa', zone: 'SS', cities: [
    c('yenagoa', 'Yenagoa', 4.9267, 6.2676, ['Amarata', 'Opolo', 'Kpansia', 'Edepie', 'Okaka', 'Swali']),
  ] },
  { slug: 'benue-state', name: 'Benue', zone: 'NC', cities: [
    c('makurdi', 'Makurdi', 7.7337, 8.5214, ['High Level', 'Wurukum', 'North Bank', 'Wadata', 'Judges Quarters']),
    c('gboko', 'Gboko', 7.3253, 9.0005, ['Gboko Town', 'Yandev']),
  ] },
  { slug: 'borno-state', name: 'Borno', zone: 'NE', cities: [
    c('maiduguri', 'Maiduguri', 11.8311, 13.151, ['GRA', 'Pompomari', 'Bulumkutu', 'Old Maiduguri', 'Gwange']),
  ] },
  { slug: 'cross-river-state', name: 'Cross River', zone: 'SS', cities: [
    c('calabar', 'Calabar', 4.9757, 8.3417, ['Marian', 'State Housing', 'Akim', 'Diamond Hill', 'Satellite Town', 'Ikot Ansa']),
  ] },
  { slug: 'delta-state', name: 'Delta', zone: 'SS', cities: [
    c('asaba', 'Asaba', 6.1983, 6.7313, ['Okpanam Road', 'GRA', 'Cable Point', 'DBS Road', 'Infant Jesus']),
    c('warri', 'Warri', 5.5167, 5.75, ['Effurun', 'GRA', 'Okumagba Layout', 'Airport Road', 'Jakpa Road']),
  ] },
  { slug: 'ebonyi-state', name: 'Ebonyi', zone: 'SE', cities: [
    c('abakaliki', 'Abakaliki', 6.3249, 8.1137, ['Kpirikpiri', 'Azuiyiokwu', 'Presco', 'Mile 50', 'Ogoja Road']),
  ] },
  { slug: 'edo-state', name: 'Edo', zone: 'SS', cities: [
    c('benin-city', 'Benin City', 6.335, 5.6037, ['GRA', 'Ugbowo', 'Ikpoba Hill', 'Sapele Road', 'Uselu', 'Ekenwan Road']),
    c('auchi', 'Auchi', 7.0667, 6.2667, ['Auchi Town', 'Iyakpi', 'Jattu']),
  ] },
  { slug: 'ekiti-state', name: 'Ekiti', zone: 'SW', cities: [
    c('ado-ekiti', 'Ado-Ekiti', 7.6211, 5.2214, ['Basiri', 'Ajilosun', 'Oke-Ila', 'GRA', 'Adebayo']),
  ] },
  { slug: 'enugu-state', name: 'Enugu', zone: 'SE', cities: [
    c('enugu', 'Enugu', 6.4584, 7.5464, ['Independence Layout', 'GRA', 'Trans-Ekulu', 'Achara Layout', 'New Haven', 'Emene']),
    c('nsukka', 'Nsukka', 6.8567, 7.3958, ['Nsukka Town', 'University Area', 'Odenigbo']),
  ] },
  { slug: 'fct-abuja', name: 'FCT', zone: 'NC', cities: [
    c('abuja', 'Abuja', 9.0765, 7.3986, ['Maitama', 'Asokoro', 'Wuse 2', 'Gwarinpa', 'Jabi', 'Lokogoma', 'Katampe', 'Kubwa', 'Lugbe', 'Guzape', 'Life Camp']),
    c('gwagwalada', 'Gwagwalada', 8.943, 7.083, ['Gwagwalada Town', 'University Area', 'Dagiri']),
  ] },
  { slug: 'gombe-state', name: 'Gombe', zone: 'NE', cities: [
    c('gombe', 'Gombe', 10.2897, 11.1673, ['Federal Lowcost', 'Tumfure', 'Pantami', 'GRA', 'Jekadafari']),
  ] },
  { slug: 'imo-state', name: 'Imo', zone: 'SE', cities: [
    c('owerri', 'Owerri', 5.4836, 7.0333, ['New Owerri', 'Ikenegbu', 'World Bank', 'Egbu Road', 'Aladinma', 'Irete']),
    c('orlu', 'Orlu', 5.7957, 7.0351, ['Orlu Town', 'Umuowa', 'Okporo']),
  ] },
  { slug: 'jigawa-state', name: 'Jigawa', zone: 'NW', cities: [
    c('dutse', 'Dutse', 11.7562, 9.3388, ['Dutse Town', 'Takur', 'Yalwawa', 'GRA']),
  ] },
  { slug: 'kaduna-state', name: 'Kaduna', zone: 'NW', cities: [
    c('kaduna', 'Kaduna', 10.5105, 7.4165, ['Barnawa', 'Malali', 'Ungwan Rimi', 'Sabon Tasha', 'Kakuri', 'Narayi']),
    c('zaria', 'Zaria', 11.0855, 7.7199, ['Samaru', 'Tudun Wada', 'GRA', 'Sabon Gari']),
  ] },
  { slug: 'kano-state', name: 'Kano', zone: 'NW', cities: [
    c('kano', 'Kano', 12.0022, 8.592, ['Nassarawa GRA', 'Bompai', 'Tarauni', 'Sabon Gari', 'Hotoro', 'Gyadi-Gyadi']),
  ] },
  { slug: 'katsina-state', name: 'Katsina', zone: 'NW', cities: [
    c('katsina', 'Katsina', 12.9908, 7.6018, ['GRA', 'Kofar Kaura', 'Kofar Marusa', 'Filin Samji']),
  ] },
  { slug: 'kebbi-state', name: 'Kebbi', zone: 'NW', cities: [
    c('birnin-kebbi', 'Birnin Kebbi', 12.4539, 4.1975, ['GRA', 'Gesse', 'Birnin Kebbi Town']),
  ] },
  { slug: 'kogi-state', name: 'Kogi', zone: 'NC', cities: [
    c('lokoja', 'Lokoja', 7.8023, 6.7333, ['Lokongoma', 'Felele', 'Adankolo', 'GRA', 'Ganaja']),
  ] },
  { slug: 'kwara-state', name: 'Kwara', zone: 'NC', cities: [
    c('ilorin', 'Ilorin', 8.4966, 4.5421, ['GRA', 'Tanke', 'Fate', 'Basin', 'Adewole', 'Gaa-Akanbi']),
  ] },
  { slug: 'lagos-state', name: 'Lagos', zone: 'SW', cities: [
    c('lagos', 'Lagos', 6.4698, 3.5852, ['Lekki Phase 1', 'Ikoyi', 'Victoria Island', 'Ajah', 'Yaba', 'Ikeja GRA', 'Magodo', 'Surulere', 'Sangotedo', 'Ibeju-Lekki', 'Chevron', 'Gbagada']),
    c('ikorodu', 'Ikorodu', 6.6194, 3.5105, ['Ikorodu Town', 'Ebute', 'Igbogbo', 'Ijede', 'Agric']),
  ] },
  { slug: 'nasarawa-state', name: 'Nasarawa', zone: 'NC', cities: [
    c('lafia', 'Lafia', 8.4939, 8.515, ['Bukan Sidi', 'Tudun Gwandara', 'GRA', 'Shabu']),
    c('karu', 'Karu', 8.99, 7.6, ['New Karu', 'Mararaba', 'Masaka', 'One Man Village']),
    c('keffi', 'Keffi', 8.8486, 7.8736, ['Keffi Town', 'GRA']),
  ] },
  { slug: 'niger-state', name: 'Niger', zone: 'NC', cities: [
    c('minna', 'Minna', 9.6139, 6.5569, ['Tunga', 'Bosso', 'Chanchaga', 'Maitumbi', 'GRA']),
    c('suleja', 'Suleja', 9.1806, 7.1794, ['Suleja Town', 'Madalla', 'Maje']),
  ] },
  { slug: 'ogun-state', name: 'Ogun', zone: 'SW', cities: [
    c('abeokuta', 'Abeokuta', 7.1557, 3.3451, ['Ibara', 'Oke-Mosan', 'Kuto', 'Asero', 'Panseke', 'Adigbe']),
    c('ijebu-ode', 'Ijebu-Ode', 6.8196, 3.9173, ['Ijebu-Ode Town', 'Molipa', 'Ibadan Road']),
    c('ota', 'Sango-Ota', 6.6919, 3.2331, ['Sango', 'Ota Town', 'Iyana Iyesi', 'Agbara']),
  ] },
  { slug: 'ondo-state', name: 'Ondo', zone: 'SW', cities: [
    c('akure', 'Akure', 7.2571, 5.2058, ['Alagbaka', 'Ijapo Estate', 'Oba-Ile', 'Shagari Village', 'Arakale']),
  ] },
  { slug: 'osun-state', name: 'Osun', zone: 'SW', cities: [
    c('osogbo', 'Osogbo', 7.7827, 4.5418, ['Oke-Fia', 'Ota-Efun', 'Ogo-Oluwa', 'Alekuwodo', 'Ayetoro']),
    c('ile-ife', 'Ile-Ife', 7.4824, 4.5603, ['OAU Area', 'Mayfair', 'Lagere', 'Moore']),
  ] },
  { slug: 'oyo-state', name: 'Oyo', zone: 'SW', cities: [
    c('ibadan', 'Ibadan', 7.3775, 3.947, ['Bodija', 'Jericho', 'Ring Road', 'Oluyole', 'Akobo', 'Challenge', 'Iwo Road']),
    c('ogbomosho', 'Ogbomosho', 8.1335, 4.2402, ['Ogbomosho Town', 'Takie', 'Owode', 'Under G']),
  ] },
  { slug: 'plateau-state', name: 'Plateau', zone: 'NC', cities: [
    c('jos', 'Jos', 9.8965, 8.8583, ['Rayfield', 'Bukuru', 'Tudun Wada', 'Lamingo', 'Old Airport Road', 'Angwan Rukuba']),
  ] },
  { slug: 'rivers-state', name: 'Rivers', zone: 'SS', cities: [
    c('port-harcourt', 'Port Harcourt', 4.8156, 7.0498, [
      'GRA Phase 2', 'Old GRA', 'Woji', 'Trans Amadi', 'Peter Odili Road', 'Eneka', 'Rumuokoro', 'Rumuola',
      'Ada George', 'D-Line', 'Elelenwo', 'Choba', 'Eliozu', 'Rukpokwu', 'Rumuibekwe', 'Rumuigbo',
      'Borokiri', 'Mile 1', 'Rumuodara', 'Shell Location', 'Aba Road', 'Igwuruta', 'Oyigbo', 'Rumuogba',
    ]),
  ] },
  { slug: 'sokoto-state', name: 'Sokoto', zone: 'NW', cities: [
    c('sokoto', 'Sokoto', 13.0059, 5.2476, ['Gidan Dare', 'Mabera', 'Arkilla', 'GRA', 'Runjin Sambo']),
  ] },
  { slug: 'taraba-state', name: 'Taraba', zone: 'NE', cities: [
    c('jalingo', 'Jalingo', 8.8833, 11.3667, ['Jalingo Town', 'Mayo Gwoi', 'Magami', 'Sabon Gari']),
  ] },
  { slug: 'yobe-state', name: 'Yobe', zone: 'NE', cities: [
    c('damaturu', 'Damaturu', 11.747, 11.9608, ['Damaturu Town', 'Nayinawa', 'GRA']),
  ] },
  { slug: 'zamfara-state', name: 'Zamfara', zone: 'NW', cities: [
    c('gusau', 'Gusau', 12.1628, 6.6614, ['Tudun Wada', 'Sabon Gari', 'GRA', 'Samaru']),
  ] },
]

export const STATES: NgState[] = RAW.map((s) => ({
  slug: s.slug,
  name: s.name,
  label: s.name === 'FCT' ? 'Abuja (FCT)' : `${s.name} State`,
  zone: s.zone,
  cities: s.cities.map((x) => x.slug),
}))

export const CITIES: City[] = RAW.flatMap((s) => s.cities.map((x) => ({ ...x, state: s.name, stateSlug: s.slug })))

/** Cities shown as quick links (header menu, footer, home). */
export const POPULAR_CITIES = ['lagos', 'abuja', 'port-harcourt', 'ibadan', 'kano', 'enugu', 'benin-city', 'owerri', 'uyo', 'kaduna']

const cityIndex = new Map(CITIES.map((x) => [x.slug, x]))
const stateIndex = new Map(STATES.map((x) => [x.slug, x]))

export const cityBySlug = (slug?: string) => (slug ? cityIndex.get(slug) : undefined)
export const stateBySlug = (slug?: string) => (slug ? stateIndex.get(slug) : undefined)
export const stateOfCity = (citySlug?: string) => stateBySlug(cityBySlug(citySlug)?.stateSlug)

/** A "place" in a URL is all of Nigeria, a whole state or a single city. */
export const isPlace = (slug: string) => slug === ALL_CITIES || stateIndex.has(slug) || cityIndex.has(slug)

/** Does a listing in `citySlug` fall inside `place`? */
export function inPlace(citySlug: string, place: string) {
  if (place === ALL_CITIES) return true
  if (citySlug === place) return true
  return cityIndex.get(citySlug)?.stateSlug === place
}

/** Human name for a place: "Nigeria", "Kano State", "Abuja (FCT)" or a city name. */
export function placeName(slug?: string) {
  if (!slug || slug === ALL_CITIES) return 'Nigeria'
  return stateIndex.get(slug)?.label ?? cityIndex.get(slug)?.name ?? 'Nigeria'
}

/** Kept for existing callers — works for cities and states. */
export const cityName = placeName

/** "Woji, Port Harcourt, Rivers" style line for a listing. */
export function fullLocation(citySlug: string, area?: string) {
  const city = cityIndex.get(citySlug)
  if (!city) return area ?? ''
  return [area, city.name, city.state === 'FCT' ? 'FCT' : city.state].filter(Boolean).join(', ')
}
