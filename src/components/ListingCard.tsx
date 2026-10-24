import { Link } from 'react-router-dom'
import { BadgeCheck, MapPin } from 'lucide-react'
import type { Listing } from '../types'
import { sellerById } from '../data/sellers'
import { cityName } from '../data/locations'
import { listingPath, naira, timeAgo, unitLabel } from '../lib/format'
import { Img, SaveButton } from './ui'

/** Short facts for a card, e.g. "3 beds · 3 baths · 465 sqm". */
export function listingFacts(l: Listing): string[] {
  const out: string[] = []
  if (l.bedrooms) out.push(`${l.bedrooms} bed${l.bedrooms > 1 ? 's' : ''}`)
  if (l.bathrooms && !l.plots) out.push(`${l.bathrooms} bath${l.bathrooms > 1 ? 's' : ''}`)
  if (l.plots) out.push(`${l.plots} plot${l.plots > 1 ? 's' : ''}`)
  if (l.sizeSqm) out.push(`${l.sizeSqm.toLocaleString()} sqm`)
  if (!l.bedrooms && !l.plots) out.push(l.propertyType)
  if (l.document && l.category.startsWith('land')) out.push(l.document.replace(/ \(.*\)/, ''))
  else if (l.furnishing && l.furnishing !== 'Unfurnished') out.push(l.furnishing)
  return out
}

export function ListingCard({ l, view = 'grid' }: { l: Listing; view?: 'grid' | 'list' }) {
  const seller = sellerById(l.sellerId)
  const unit = unitLabel(l.priceUnit, l.category)
  const facts = listingFacts(l).slice(0, view === 'list' ? 5 : 3)
  const flag = l.isUserAd ? 'Your ad' : l.tier === 'featured' ? 'Featured' : null
  return (
    <article className={`lcard lcard-${view}`}>
      <div className="lcard-media">
        <Img src={l.images[0]} alt={l.title} width={view === 'list' ? 420 : 560} />
        {flag && <span className="lcard-flag">{flag}</span>}
        <SaveButton id={l.id} />
      </div>
      <div className="lcard-body">
        <div className="lcard-price">
          {naira(l.price)} {unit && <small>{unit}</small>}
        </div>
        <h3 className="lcard-title">
          <Link to={listingPath(l)} className="stretched">
            {l.title}
          </Link>
        </h3>
        {view === 'list' && <p className="lcard-desc">{l.description.split('\n')[0]}</p>}
        {facts.length > 0 && <p className="lcard-facts">{facts.join(' · ')}</p>}
        <p className="lcard-loc">
          <MapPin size={13} />
          <span>
            {l.area}, {cityName(l.city)}
          </span>
          {seller?.verified && <BadgeCheck size={15} className="lcard-verified" aria-label="Verified seller" />}
          {view === 'list' && <span className="lcard-time">{timeAgo(l.postedAt)}</span>}
        </p>
      </div>
    </article>
  )
}
