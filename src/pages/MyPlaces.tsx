import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPinned, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Place } from '../types'
import { ALL_CATEGORIES } from '../data/categories'
import { cityBySlug } from '../data/locations'
import { useStore } from '../lib/store'
import { PLACE_ICONS, PlaceEditor } from '../components/Places'
import { Breadcrumbs, EmptyState } from '../components/ui'

export default function MyPlaces() {
  const { places, removePlace, toast } = useStore()
  const [editing, setEditing] = useState<Place | 'new' | null>(null)
  return (
    <div className="container page-simple">
      <Breadcrumbs items={[{ label: 'House4Rent', to: '/' }, { label: 'My places' }]} />
      <div className="page-head-row">
        <div>
          <h1 className="page-title">My places</h1>
          <p className="muted">Church, work, school — we show how long it takes to get there from every advert.</p>
        </div>
        {places.length > 0 && (
          <button className="btn btn-primary" onClick={() => setEditing('new')}>
            <Plus size={17} /> Add place
          </button>
        )}
      </div>

      {places.length === 0 ? (
        <EmptyState
          icon={MapPinned}
          title="No places yet"
          text="Add your church, office or children's school. Adverts will then show the drive time, and you can sort results by what's closest."
          action={
            <button className="btn btn-primary" onClick={() => setEditing('new')}>
              <Plus size={17} /> Add your first place
            </button>
          }
        />
      ) : (
        <ul className="place-list">
          {places.map((p) => {
            const Icon = PLACE_ICONS[p.label]
            const city = cityBySlug(p.city)
            return (
              <li key={p.id} className="place-item">
                <span className="commute-icon">
                  <Icon size={20} />
                </span>
                <div className="place-info">
                  <strong>{p.name}</strong>
                  <small>
                    {p.label} · {p.area ? `${p.area}, ${city?.name}` : city?.name}
                  </small>
                  <Link to={`/${p.city}/${ALL_CATEGORIES}?sort=near-${p.id}`} className="link-btn">
                    Homes closest to {p.name} →
                  </Link>
                </div>
                <div className="place-actions">
                  <button className="icon-pill" onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`}>
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-pill"
                    onClick={() => {
                      removePlace(p.id)
                      toast(`${p.name} removed`)
                    }}
                    aria-label={`Remove ${p.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {editing && <PlaceEditor open onClose={() => setEditing(null)} place={editing === 'new' ? undefined : editing} />}
    </div>
  )
}
