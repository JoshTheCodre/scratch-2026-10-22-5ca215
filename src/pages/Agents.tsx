import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Award, Search } from 'lucide-react'
import { SELLERS } from '../data/sellers'
import { CITIES, cityName } from '../data/locations'
import { useStore } from '../lib/store'
import { countBy } from '../lib/filters'
import { yearsOn } from '../lib/format'
import { Avatar, Breadcrumbs, Stars, VerifiedBadge } from '../components/ui'

export default function Agents() {
  const { listings } = useStore()
  const [sp, setSp] = useSearchParams()
  const [q, setQ] = useState('')
  const [verifiedOnly, setVerifiedOnly] = useState(true)
  const city = sp.get('city') ?? ''
  const adCounts = useMemo(() => countBy(listings.filter((l) => l.status === 'active'), (l) => l.sellerId), [listings])
  const agents = SELLERS.filter(
    (s) => (!city || city === 'nigeria' || s.city === city) && (!verifiedOnly || s.verified) && s.name.toLowerCase().includes(q.toLowerCase()),
  ).sort((a, b) => Number(b.enterprise) - Number(a.enterprise) || b.rating - a.rating)

  return (
    <div className="container page-simple">
      <Breadcrumbs items={[{ label: 'House4Rent', to: '/' }, { label: 'Trusted agents' }]} />
      <div className="page-intro">
        <Award size={32} />
        <div>
          <h1 className="page-title">Trusted agents &amp; developers</h1>
          <p className="muted">Sellers with a Verified ID have shown us valid identification and business registration. Ratings come from people who inspected or paid.</p>
        </div>
      </div>
      <div className="agent-filters">
        <label className="input-icon">
          <Search size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search agents" />
        </label>
        <select value={city} onChange={(e) => setSp(e.target.value ? { city: e.target.value } : {})} aria-label="City">
          <option value="">All cities</option>
          {CITIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <label className="check-row">
          <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
          <span>Verified only</span>
        </label>
      </div>
      <div className="agent-grid">
        {agents.map((s) => (
          <Link key={s.id} to={`/seller/${s.id}`} className="card agent-card">
            <Avatar name={s.name} color={s.color} size={60} />
            <strong>{s.name}</strong>
            <div className="seller-sub">
              <VerifiedBadge seller={s} compact />
              {s.enterprise && <span className="badge badge-enterprise">Enterprise</span>}
            </div>
            <span>
              <Stars value={s.rating} /> {s.rating.toFixed(1)} <small className="muted">({s.reviews})</small>
            </span>
            <small className="muted">
              {s.type} · {cityName(s.city)} · {yearsOn(s.joinedYear)}
            </small>
            <span className="agent-ads">{adCounts.get(s.id) ?? 0} active adverts</span>
          </Link>
        ))}
        {agents.length === 0 && <p className="muted">No agents match your search.</p>}
      </div>
    </div>
  )
}
