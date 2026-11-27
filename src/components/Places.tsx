import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Car, Church, Dumbbell, Footprints, GraduationCap, Home, LocateFixed, MapPin, Moon, Navigation, Plus, type LucideIcon } from 'lucide-react'
import type { Listing, Place, PlaceLabel } from '../types'
import { CITIES, STATES, cityBySlug } from '../data/locations'
import { useStore } from '../lib/store'
import { areaPoint, commute, distanceKm, formatMinutes, isMappedArea } from '../lib/geo'
import { Modal } from './ui'

export const PLACE_ICONS: Record<PlaceLabel, LucideIcon> = {
  Church,
  Mosque: Moon,
  Work: Briefcase,
  School: GraduationCap,
  Family: Home,
  Gym: Dumbbell,
  Other: MapPin,
}
const LABELS = Object.keys(PLACE_ICONS) as PlaceLabel[]
const NAME_HINT: Record<PlaceLabel, string> = {
  Church: 'e.g. Living Faith Church',
  Mosque: 'e.g. Central Mosque',
  Work: 'e.g. My office',
  School: "e.g. Kids' school",
  Family: "e.g. Mum's house",
  Gym: 'e.g. Fitness centre',
  Other: 'e.g. Market',
}

/** Commute from an advert to a saved place, or undefined when they are far apart. */
export function commuteTo(l: Pick<Listing, 'lat' | 'lng' | 'city'>, p: Place) {
  const c = commute(l, p, l.city)
  return c.km > 120 ? undefined : c
}

/** Add or edit a place the user travels to often. */
export function PlaceEditor({ open, onClose, place, defaultCity }: { open: boolean; onClose: () => void; place?: Place; defaultCity?: string }) {
  const { savePlace, toast } = useStore()
  const [label, setLabel] = useState<PlaceLabel>(place?.label ?? 'Church')
  const [name, setName] = useState(place?.name ?? '')
  const [city, setCity] = useState(place?.city ?? (cityBySlug(defaultCity) ? defaultCity! : 'port-harcourt'))
  const [area, setArea] = useState(place?.area ?? '')
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(place && !place.area ? { lat: place.lat, lng: place.lng } : null)
  const [locating, setLocating] = useState(false)
  const areas = cityBySlug(city)?.areas ?? []

  const locate = () => {
    if (!navigator.geolocation) return toast('Location is not available on this device', 'warn')
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        const nearest = [...CITIES].sort((a, b) => distanceKm(here, a) - distanceKm(here, b))[0]!
        setGps(here)
        setCity(nearest.slug)
        setArea('')
        toast(`Location found near ${nearest.name}`)
      },
      () => {
        setLocating(false)
        toast('Could not get your location — pick the area instead', 'warn')
      },
      { enableHighAccuracy: false, timeout: 10000 },
    )
  }

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const point = gps ?? areaPoint(city, area || undefined)
    savePlace({ id: place?.id ?? `pl${Date.now().toString(36)}`, label, name: name.trim() || label, city, area: gps ? undefined : area || undefined, ...point })
    toast(place ? 'Place updated' : `${name.trim() || label} saved`)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={place ? 'Edit place' : 'Add a place you visit often'}>
      <form className="form" onSubmit={save}>
        <div className="field">
          <span className="field-label">What is it?</span>
          <div className="chip-row">
            {LABELS.map((x) => {
              const Icon = PLACE_ICONS[x]
              return (
                <button type="button" key={x} className={`chip ${label === x ? 'on' : ''}`} aria-pressed={label === x} onClick={() => setLabel(x)}>
                  <Icon size={15} /> {x}
                </button>
              )
            })}
          </div>
        </div>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={NAME_HINT[label]} maxLength={60} />
        </label>
        <div className="form-row pair">
          <label>
            City
            <select
              value={city}
              onChange={(e) => {
                setCity(e.target.value)
                setArea('')
                setGps(null)
              }}
            >
              {STATES.map((s) => (
                <optgroup key={s.slug} label={s.label}>
                  {s.cities.map((slug) => (
                    <option key={slug} value={slug}>
                      {cityBySlug(slug)?.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label>
            Area
            <select
              value={gps ? '__gps' : area}
              onChange={(e) => {
                setArea(e.target.value)
                setGps(null)
              }}
            >
              {gps && <option value="__gps">My current location</option>}
              <option value="">City centre</option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button type="button" className="link-btn" onClick={locate} disabled={locating}>
          <LocateFixed size={16} /> {locating ? 'Finding you…' : gps ? 'Location set — use it again' : "I'm there now — use my location"}
        </button>
        <p className="muted small">Saved on this device only. We use it to estimate travel times; it is never shown to sellers.</p>
        <button className="btn btn-primary block">{place ? 'Save changes' : 'Save place'}</button>
      </form>
    </Modal>
  )
}

/** Commute times from one advert to each saved place. */
export function CommuteList({ l }: { l: Listing }) {
  const { places } = useStore()
  const [adding, setAdding] = useState(false)
  const rows = places.map((p) => ({ p, c: commuteTo(l, p) }))
  return (
    <div className="commute">
      {places.length === 0 ? (
        <div className="commute-empty">
          <Navigation size={20} />
          <div>
            <strong>How far is this from your church, office or school?</strong>
            <p className="muted small">Add the places you go to often and we'll estimate the drive and keke time from every advert.</p>
          </div>
        </div>
      ) : (
        <ul className="commute-list">
          {rows.map(({ p, c }) => {
            const Icon = PLACE_ICONS[p.label]
            return (
              <li key={p.id}>
                <span className="commute-icon">
                  <Icon size={18} />
                </span>
                <div className="commute-place">
                  <strong>{p.name}</strong>
                  <small>{p.area ? `${p.area}, ${cityBySlug(p.city)?.name}` : cityBySlug(p.city)?.name}</small>
                  {c && !c.intercity && (
                    <small className="commute-alt">
                      {c.walk !== undefined ? (
                        <>
                          <Footprints size={12} /> {formatMinutes(c.walk)} walk
                        </>
                      ) : (
                        <>Rush hour ~{formatMinutes(c.driveRush)} · keke ~{formatMinutes(c.keke)}</>
                      )}
                    </small>
                  )}
                </div>
                {c ? (
                  <div className="commute-times">
                    <span className="commute-main">
                      <Car size={15} /> {formatMinutes(c.drive)}
                    </span>
                    <small>{c.km} km</small>
                  </div>
                ) : (
                  <div className="commute-times">
                    <small className="muted">Too far to estimate</small>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
      <div className="commute-actions">
        <button className="btn btn-soft sm" onClick={() => setAdding(true)}>
          <Plus size={16} /> Add a place
        </button>
        {places.length > 0 && (
          <Link to="/places" className="link-btn">
            Manage places
          </Link>
        )}
      </div>
      <p className="muted small">
        Estimates from the {isMappedArea(l.city, l.area) ? 'area centre' : 'approximate area'} using typical traffic. Confirm the exact address with the seller.
      </p>
      {adding && <PlaceEditor open onClose={() => setAdding(false)} defaultCity={l.city} />}
    </div>
  )
}

/** "12 min to Church" — the first saved place in range, for listing cards. */
export function CommuteChip({ l }: { l: Listing }) {
  const { places } = useStore()
  for (const p of places) {
    const c = commuteTo(l, p)
    if (c && !c.intercity) {
      const Icon = PLACE_ICONS[p.label]
      return (
        <span className="commute-chip" title={`About ${formatMinutes(c.drive)} drive to ${p.name} (${c.km} km)`}>
          <Icon size={13} /> {formatMinutes(c.drive)} to {p.label === 'Other' ? p.name : p.label.toLowerCase()}
        </span>
      )
    }
  }
  return null
}
