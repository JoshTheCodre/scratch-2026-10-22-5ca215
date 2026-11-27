import { Link } from 'react-router-dom'
import { BadgeCheck, ChevronRight } from 'lucide-react'
import type { Listing } from '../types'
import { cityName } from '../data/locations'
import { sellerById } from '../data/sellers'
import { useStore } from '../lib/store'
import { comparePrices, yearlyPrice } from '../lib/similar'
import { listingPath, naira, nairaCompact, unitLabel } from '../lib/format'
import { Avatar } from './ui'

/** Like-for-like asking prices from different agents, cheapest first. */
export function PriceCompare({ l, sellerName }: { l: Listing; sellerName: string }) {
  const { listings, user } = useStore()
  const cmp = comparePrices(l, listings)
  if (!cmp) return null
  const mine = yearlyPrice(l)
  const pct = Math.round(Math.abs(cmp.vsMedian) * 100)
  const verdict = pct < 5 ? 'about the typical price' : cmp.vsMedian < 0 ? `${pct}% below the typical price` : `${pct}% above the typical price`
  const tone = pct < 5 ? 'even' : cmp.vsMedian < 0 ? 'good' : 'high'
  const pos = cmp.high === cmp.low ? 50 : ((mine - cmp.low) / (cmp.high - cmp.low)) * 100
  const where = cmp.scope === 'area' ? l.area : cmp.scope === 'city' ? cityName(l.city) : 'this state'
  const unit = unitLabel(l.priceUnit === 'per month' ? 'per annum' : l.priceUnit, l.category)
  const t = l.propertyType.toLowerCase()
  const what = `${l.bedrooms ? `${l.bedrooms}-bed ` : ''}${l.category.startsWith('land') ? `${t} plots` : t.endsWith('s') ? t : `${t}s`}`
  const rows = cmp.rows.slice(0, 6)
  if (!rows.some((r) => r.listing.id === l.id)) rows[rows.length - 1] = cmp.rows.find((r) => r.listing.id === l.id) ?? rows[rows.length - 1]!

  return (
    <section className="detail-section compare">
      <h2>Compare prices from agents</h2>
      <p className="muted">
        {cmp.rows.length} agents list {what} in {where}. This one is <strong className={`verdict ${tone}`}>{verdict}</strong>.
      </p>
      <div className="range-bar" aria-hidden="true">
        <span className="range-fill" />
        <span className="range-median" style={{ left: `${cmp.high === cmp.low ? 50 : ((cmp.median - cmp.low) / (cmp.high - cmp.low)) * 100}%` }} />
        <span className="range-dot" style={{ left: `${Math.min(100, Math.max(0, pos))}%` }} />
      </div>
      <div className="range-labels">
        <span>{nairaCompact(cmp.low)}</span>
        <span>Typical {nairaCompact(cmp.median)}</span>
        <span>{nairaCompact(cmp.high)}</span>
      </div>
      <ul className="compare-list">
        {rows
          .sort((a, b) => yearlyPrice(a.listing) - yearlyPrice(b.listing))
          .map(({ listing: x }) => {
            const s = x.isUserAd ? null : sellerById(x.sellerId)
            const name = x.id === l.id ? sellerName : s?.name ?? user?.name ?? 'Owner'
            const diff = yearlyPrice(x) - mine
            const self = x.id === l.id
            return (
              <li key={x.id} className={self ? 'self' : ''}>
                <Avatar name={name} color={s?.color ?? 'var(--accent)'} size={34} />
                <div className="compare-who">
                  <strong>
                    {name} {s?.verified && <BadgeCheck size={14} className="lcard-verified" aria-label="Verified" />}
                  </strong>
                  <small>
                    {self ? 'This advert' : `${x.propertyType}${x.bedrooms ? ` · ${x.bedrooms} bed` : ''} · ${x.area}`}
                  </small>
                </div>
                <div className="compare-price">
                  <strong>{naira(yearlyPrice(x))}</strong>
                  {!self && <small className={diff < 0 ? 'cheaper' : diff > 0 ? 'dearer' : ''}>{diff === 0 ? 'Same price' : `${nairaCompact(Math.abs(diff))} ${diff < 0 ? 'cheaper' : 'more'}`}</small>}
                </div>
                {!self && (
                  <Link to={listingPath(x)} className="compare-go" aria-label={`View ${x.title}`}>
                    <ChevronRight size={18} />
                  </Link>
                )}
              </li>
            )
          })}
      </ul>
      <p className="muted small">
        {unit ? `Prices ${unit}. ` : ''}Closest match from each agent, same type and bedrooms. Asking prices — always negotiate.
      </p>
    </section>
  )
}
