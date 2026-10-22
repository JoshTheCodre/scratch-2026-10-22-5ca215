import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import type { Listing } from '../types'
import { ALL_CATEGORIES, CATEGORIES, categoryBySlug } from '../data/categories'
import { ALL_CITIES, CITIES, cityName } from '../data/locations'
import { useStore } from '../lib/store'
import { naira, nairaCompact, unitLabel } from '../lib/format'
import { Breadcrumbs } from '../components/ui'

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2
}

export default function PriceCheck() {
  const { listings } = useStore()
  const [sp, setSp] = useSearchParams()
  const city = sp.get('city') || 'port-harcourt'
  const category = sp.get('category') && sp.get('category') !== ALL_CATEGORIES ? sp.get('category')! : 'houses-apartments-for-rent'
  const type = sp.get('type') ?? ''
  const beds = sp.get('beds') ?? ''
  const cat = categoryBySlug(category)!

  const update = (k: string, v: string) => {
    const next = new URLSearchParams(sp)
    v ? next.set(k, v) : next.delete(k)
    if (k === 'category') next.delete('type')
    setSp(next, { replace: true })
  }

  const pool = useMemo(
    () =>
      listings.filter(
        (l) =>
          l.status === 'active' &&
          l.category === category &&
          (city === ALL_CITIES || l.city === city) &&
          (!type || l.propertyType === type) &&
          (!beds || l.bedrooms === Number(beds)),
      ),
    [listings, category, city, type, beds],
  )

  // Compare like with like: group by the most common price unit.
  const unit = useMemo(() => {
    const m = new Map<string, number>()
    pool.forEach((l) => m.set(l.priceUnit, (m.get(l.priceUnit) ?? 0) + 1))
    return [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] as Listing['priceUnit'] | undefined
  }, [pool])
  const same = pool.filter((l) => l.priceUnit === unit)
  const prices = same.map((l) => l.price)

  const byArea = useMemo(() => {
    const m = new Map<string, number[]>()
    same.forEach((l) => m.set(l.area, [...(m.get(l.area) ?? []), l.price]))
    return [...m.entries()].map(([area, ps]) => ({ area, n: ps.length, min: Math.min(...ps), med: median(ps), max: Math.max(...ps) })).sort((a, b) => b.med - a.med)
  }, [same])

  return (
    <div className="container page-simple">
      <Breadcrumbs items={[{ label: 'House4Rent', to: '/' }, { label: 'Price check' }]} />
      <div className="page-intro">
        <TrendingUp size={32} />
        <div>
          <h1 className="page-title">Price check</h1>
          <p className="muted">See what similar properties are listed for before you inspect or make an offer. Based on live asking prices on House4Rent.ng.</p>
        </div>
      </div>

      <div className="card pc-filters">
        <label>
          City
          <select value={city} onChange={(e) => update('city', e.target.value)}>
            <option value={ALL_CITIES}>All Nigeria</option>
            {CITIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Category
          <select value={category} onChange={(e) => update('category', e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Property type
          <select value={type} onChange={(e) => update('type', e.target.value)}>
            <option value="">Any type</option>
            {cat.types.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        {cat.group === 'residential' && (
          <label>
            Bedrooms
            <select value={beds} onChange={(e) => update('beds', e.target.value)}>
              <option value="">Any</option>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {prices.length === 0 ? (
        <div className="card empty">
          <h3>Not enough data yet</h3>
          <p className="muted">No live adverts match this combination. Try another city or widen the property type.</p>
        </div>
      ) : (
        <>
          <div className="stat-row">
            <Stat label="Lowest asking" value={naira(Math.min(...prices))} />
            <Stat label="Median asking" value={naira(median(prices))} strong />
            <Stat label="Average asking" value={naira(prices.reduce((a, b) => a + b, 0) / prices.length)} />
            <Stat label="Highest asking" value={naira(Math.max(...prices))} />
          </div>
          <p className="muted small">
            {same.length} adverts · {cat.name}
            {type ? ` · ${type}` : ''}
            {beds ? ` · ${beds} bed` : ''} · {cityName(city)} · prices {unit === 'total' ? 'outright' : unitLabel(unit!, category)}
          </p>

          <div className="card table-card">
            <table className="price-table">
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Adverts</th>
                  <th>Lowest</th>
                  <th>Median</th>
                  <th>Highest</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {byArea.map((r) => (
                  <tr key={r.area}>
                    <td>{r.area}</td>
                    <td>{r.n}</td>
                    <td>{nairaCompact(r.min)}</td>
                    <td>
                      <strong>{nairaCompact(r.med)}</strong>
                    </td>
                    <td>{nairaCompact(r.max)}</td>
                    <td>
                      <Link
                        to={`/${city === ALL_CITIES ? ALL_CITIES : city}/${category}?area=${encodeURIComponent(r.area)}${type ? `&type=${encodeURIComponent(type)}` : ''}${beds ? `&beds=${beds}` : ''}`}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`card stat ${strong ? 'strong' : ''}`}>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  )
}
