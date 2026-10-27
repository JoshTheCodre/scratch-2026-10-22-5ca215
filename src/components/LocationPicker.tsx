import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, MapPin, Search } from 'lucide-react'
import type { Listing } from '../types'
import { ALL_CITIES, CITIES, STATES, cityBySlug, stateBySlug } from '../data/locations'
import { countBy } from '../lib/filters'
import { Modal } from './ui'

interface Props {
  open: boolean
  onClose: () => void
  /** Listings already narrowed to the current category (any place). */
  pool: Listing[]
  /** Current place: "nigeria", a state slug or a city slug. */
  city: string
  onSelect: (place: string, area?: string) => void
}

type View = { level: 'states' } | { level: 'state'; slug: string } | { level: 'city'; slug: string }

export function LocationPicker({ open, onClose, pool, city, onSelect }: Props) {
  const [view, setView] = useState<View>({ level: 'states' })
  const [q, setQ] = useState('')
  useEffect(() => {
    if (!open) return
    setQ('')
    if (cityBySlug(city)) setView({ level: 'city', slug: city })
    else if (stateBySlug(city)) setView({ level: 'state', slug: city })
    else setView({ level: 'states' })
  }, [open, city])

  const byCity = useMemo(() => countBy(pool, (l) => l.city), [pool])
  const byState = useMemo(() => countBy(pool, (l) => cityBySlug(l.city)?.stateSlug), [pool])
  const byArea = useMemo(() => countBy(pool, (l) => `${l.city}|${l.area}`), [pool])
  const term = q.trim().toLowerCase()

  if (view.level === 'city') {
    const cityObj = cityBySlug(view.slug)!
    const st = stateBySlug(cityObj.stateSlug)!
    const areas = cityObj.areas.filter((a) => a.toLowerCase().includes(term))
    return (
      <Modal open={open} onClose={onClose} title={cityObj.name}>
        <button className="link-btn back-link" onClick={() => (setQ(''), setView({ level: 'state', slug: st.slug }))}>
          <ChevronLeft size={16} /> {st.label}
        </button>
        <label className="input-icon">
          <Search size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Find an area in ${cityObj.name}`} />
        </label>
        <ul className="loc-list">
          <li>
            <button onClick={() => onSelect(cityObj.slug)}>
              <strong>All {cityObj.name}</strong>
              <span>{byCity.get(cityObj.slug) ?? 0} ads</span>
            </button>
          </li>
          {areas.map((a) => (
            <li key={a}>
              <button onClick={() => onSelect(cityObj.slug, a)}>
                <span>{a}</span>
                <span>{byArea.get(`${cityObj.slug}|${a}`) ?? 0} ads</span>
              </button>
            </li>
          ))}
        </ul>
      </Modal>
    )
  }

  if (view.level === 'state') {
    const st = stateBySlug(view.slug)!
    return (
      <Modal open={open} onClose={onClose} title={st.label}>
        <button className="link-btn back-link" onClick={() => (setQ(''), setView({ level: 'states' }))}>
          <ChevronLeft size={16} /> All states
        </button>
        <ul className="loc-list">
          <li>
            <button onClick={() => onSelect(st.slug)}>
              <strong>All {st.label}</strong>
              <span>{byState.get(st.slug) ?? 0} ads</span>
            </button>
          </li>
          {st.cities.map((slug) => {
            const cityObj = cityBySlug(slug)!
            return (
              <li key={slug}>
                <button onClick={() => (setQ(''), setView({ level: 'city', slug }))}>
                  <span>{cityObj.name}</span>
                  <span>
                    {byCity.get(slug) ?? 0} ads <ChevronRight size={15} />
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </Modal>
    )
  }

  // Top level: every state, plus a search across states and cities.
  const states = STATES.filter((s) => s.name.toLowerCase().includes(term) || s.label.toLowerCase().includes(term))
  const cityHits = term ? CITIES.filter((x) => x.name.toLowerCase().includes(term)).slice(0, 8) : []
  return (
    <Modal open={open} onClose={onClose} title="Choose location">
      <label className="input-icon">
        <Search size={16} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a state or city" autoFocus />
      </label>
      <ul className="loc-list">
        {!term && (
          <li>
            <button onClick={() => onSelect(ALL_CITIES)}>
              <strong>
                <MapPin size={15} /> All Nigeria
              </strong>
              <span>{pool.length} ads</span>
            </button>
          </li>
        )}
        {cityHits.map((x) => (
          <li key={`city-${x.slug}`}>
            <button onClick={() => (setQ(''), setView({ level: 'city', slug: x.slug }))}>
              <span>
                {x.name} <small className="muted">{x.state === 'FCT' ? 'FCT' : `${x.state} State`}</small>
              </span>
              <span>
                {byCity.get(x.slug) ?? 0} ads <ChevronRight size={15} />
              </span>
            </button>
          </li>
        ))}
        {states.map((s) => (
          <li key={s.slug}>
            <button onClick={() => (setQ(''), setView({ level: 'state', slug: s.slug }))}>
              <span>{s.label}</span>
              <span>
                {byState.get(s.slug) ?? 0} ads <ChevronRight size={15} />
              </span>
            </button>
          </li>
        ))}
        {term && states.length === 0 && cityHits.length === 0 && <li className="loc-empty muted">No state or city matches “{q}”.</li>}
      </ul>
    </Modal>
  )
}
