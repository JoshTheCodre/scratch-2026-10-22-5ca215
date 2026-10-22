import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, MapPin, Search } from 'lucide-react'
import type { Listing } from '../types'
import { ALL_CITIES, CITIES, cityBySlug } from '../data/locations'
import { countBy } from '../lib/filters'
import { Modal } from './ui'

interface Props {
  open: boolean
  onClose: () => void
  /** Listings already narrowed to the current category (any city). */
  pool: Listing[]
  city: string
  onSelect: (city: string, area?: string) => void
}

export function LocationPicker({ open, onClose, pool, city, onSelect }: Props) {
  const [step, setStep] = useState<string | null>(null)
  const [q, setQ] = useState('')
  useEffect(() => {
    if (open) {
      setStep(city !== ALL_CITIES ? city : null)
      setQ('')
    }
  }, [open, city])

  const byCity = useMemo(() => countBy(pool, (l) => l.city), [pool])
  const current = step ? cityBySlug(step) : undefined
  const byArea = useMemo(() => countBy(pool.filter((l) => l.city === step), (l) => l.area), [pool, step])
  const areas = (current?.areas ?? []).filter((a) => a.toLowerCase().includes(q.toLowerCase()))

  return (
    <Modal open={open} onClose={onClose} title={current ? current.name : 'Choose location'}>
      {current ? (
        <>
          <button className="link-btn back-link" onClick={() => setStep(null)}>
            <ChevronLeft size={16} /> All cities
          </button>
          <label className="input-icon">
            <Search size={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Find an area in ${current.name}`} autoFocus />
          </label>
          <ul className="loc-list">
            <li>
              <button onClick={() => onSelect(current.slug)}>
                <strong>All {current.name}</strong>
                <span>{byCity.get(current.slug) ?? 0} ads</span>
              </button>
            </li>
            {areas.map((a) => (
              <li key={a}>
                <button onClick={() => onSelect(current.slug, a)}>
                  <span>{a}</span>
                  <span>{byArea.get(a) ?? 0} ads</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <ul className="loc-list">
          <li>
            <button onClick={() => onSelect(ALL_CITIES)}>
              <strong>
                <MapPin size={15} /> All Nigeria
              </strong>
              <span>{pool.length} ads</span>
            </button>
          </li>
          {CITIES.map((c) => (
            <li key={c.slug}>
              <button onClick={() => setStep(c.slug)}>
                <span>
                  {c.name} <small className="muted">{c.state} State</small>
                </span>
                <span>
                  {byCity.get(c.slug) ?? 0} ads <ChevronRight size={15} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
