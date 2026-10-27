import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, MapPin, Search } from 'lucide-react'
import type { Zone } from '../types'
import { ALL_CATEGORIES } from '../data/categories'
import { STATES, cityBySlug } from '../data/locations'
import { useStore } from '../lib/store'
import { countBy } from '../lib/filters'
import { Breadcrumbs, EmptyState } from '../components/ui'

const ZONES: [Zone, string][] = [
  ['NC', 'North Central'],
  ['NE', 'North East'],
  ['NW', 'North West'],
  ['SE', 'South East'],
  ['SS', 'South South'],
  ['SW', 'South West'],
]

export default function States() {
  const { listings } = useStore()
  const [q, setQ] = useState('')
  const active = useMemo(() => listings.filter((l) => l.status === 'active'), [listings])
  const byState = useMemo(() => countBy(active, (l) => cityBySlug(l.city)?.stateSlug), [active])
  const byCity = useMemo(() => countBy(active, (l) => l.city), [active])
  const term = q.trim().toLowerCase()
  const matches = (slug: string) => {
    const st = STATES.find((s) => s.slug === slug)!
    return !term || st.label.toLowerCase().includes(term) || st.cities.some((c) => cityBySlug(c)!.name.toLowerCase().includes(term))
  }
  const shown = STATES.filter((s) => matches(s.slug))

  return (
    <div className="container page-simple">
      <Breadcrumbs items={[{ label: 'House4Rent', to: '/' }, { label: 'All states' }]} />
      <div className="page-intro">
        <MapPin size={32} />
        <div>
          <h1 className="page-title">Property in every state</h1>
          <p className="muted">All 36 states and the FCT. Pick a state to see every listing in it, or jump straight to a city.</p>
        </div>
      </div>
      <label className="input-icon states-search">
        <Search size={16} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a state or city" aria-label="Search states and cities" />
      </label>

      {shown.length === 0 && <EmptyState icon={MapPin} title="No match" text={`No state or city matches “${q}”.`} />}

      {ZONES.map(([zone, label]) => {
        const states = shown.filter((s) => s.zone === zone)
        if (!states.length) return null
        return (
          <section key={zone} className="block zone-block">
            <div className="block-head">
              <h2>{label}</h2>
            </div>
            <div className="state-grid">
              {states.map((s) => (
                <article key={s.slug} className="card state-card">
                  <Link to={`/${s.slug}/${ALL_CATEGORIES}`} className="state-card-head">
                    <span>
                      <strong>{s.label}</strong>
                      <small>{(byState.get(s.slug) ?? 0).toLocaleString()} adverts</small>
                    </span>
                    <ChevronRight size={18} />
                  </Link>
                  <div className="state-cities">
                    {s.cities.map((slug) => (
                      <Link key={slug} to={`/${slug}/${ALL_CATEGORIES}`} className="chip">
                        {cityBySlug(slug)!.name} <small>{byCity.get(slug) ?? 0}</small>
                      </Link>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
