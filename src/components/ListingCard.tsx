import { Link } from 'react-router-dom'
import { BedDouble, Bath, Camera, FileCheck2, LandPlot, MapPin, Ruler, Sofa } from 'lucide-react'
import type { Listing } from '../types'
import { sellerById } from '../data/sellers'
import { cityName } from '../data/locations'
import { listingPath, naira, timeAgo, unitLabel, yearsOn } from '../lib/format'
import { Img, SaveButton, TierTag, VerifiedBadge } from './ui'

export function listingAttrs(l: Listing) {
  const out: { icon: typeof Ruler; text: string }[] = []
  if (l.plots) out.push({ icon: LandPlot, text: `${l.plots} plot${l.plots > 1 ? 's' : ''}` })
  if (l.sizeSqm) out.push({ icon: Ruler, text: `${l.sizeSqm.toLocaleString()} sqm` })
  if (l.bedrooms) out.push({ icon: BedDouble, text: `${l.bedrooms} bed${l.bedrooms > 1 ? 's' : ''}` })
  if (l.bathrooms && !l.plots) out.push({ icon: Bath, text: `${l.bathrooms} bath${l.bathrooms > 1 ? 's' : ''}` })
  if (l.furnishing) out.push({ icon: Sofa, text: l.furnishing })
  if (l.document && l.category.startsWith('land')) out.push({ icon: FileCheck2, text: l.document.replace(/ \(.*\)/, '') })
  return out
}

export function ListingCard({ l, view = 'grid' }: { l: Listing; view?: 'grid' | 'list' }) {
  const seller = sellerById(l.sellerId)
  const attrs = listingAttrs(l).slice(0, view === 'list' ? 5 : 3)
  const unit = unitLabel(l.priceUnit, l.category)
  return (
    <article className={`lcard lcard-${view} ${l.tier ? `is-${l.tier}` : ''}`}>
      <div className="lcard-media">
        <Img src={l.images[0]} alt={l.title} width={view === 'list' ? 420 : 520} />
        <TierTag tier={l.tier} />
        <div className="lcard-badges">
          {l.isUserAd ? <span className="badge badge-years">Your ad</span> : <VerifiedBadge seller={seller} compact />}
          {seller && seller.joinedYear <= new Date().getFullYear() - 3 && <span className="badge badge-years">{yearsOn(seller.joinedYear)}</span>}
        </div>
        <span className="lcard-count">
          <Camera size={12} /> {l.images.length}
        </span>
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
        <p className="lcard-desc">{l.description.split('\n')[0]}</p>
        {attrs.length > 0 && (
          <div className="lcard-attrs">
            {attrs.map(({ icon: Icon, text }) => (
              <span key={text}>
                <Icon size={13} /> {text}
              </span>
            ))}
          </div>
        )}
        <div className="lcard-foot">
          <span className="lcard-loc">
            <MapPin size={13} /> {l.area}, {cityName(l.city)}
          </span>
          <span className="muted">{timeAgo(l.postedAt)}</span>
        </div>
      </div>
    </article>
  )
}
