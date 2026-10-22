import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useStore } from '../lib/store'
import { ListingCard } from '../components/ListingCard'
import { Breadcrumbs, EmptyState } from '../components/ui'
import type { Listing } from '../types'

export default function Saved() {
  const { saved, byId } = useStore()
  const items = saved.map((id) => byId(id)).filter(Boolean) as Listing[]
  return (
    <div className="container page-simple">
      <Breadcrumbs items={[{ label: 'House4Rent', to: '/' }, { label: 'Saved adverts' }]} />
      <h1 className="page-title">Saved adverts</h1>
      {items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Nothing saved yet"
          text="Tap the heart on any advert to keep it here and compare later."
          action={
            <Link to="/port-harcourt/real-estate" className="btn btn-primary">
              Browse properties
            </Link>
          }
        />
      ) : (
        <div className="card-grid four">
          {items.map((l) => (
            <ListingCard key={l.id} l={l} />
          ))}
        </div>
      )}
    </div>
  )
}
