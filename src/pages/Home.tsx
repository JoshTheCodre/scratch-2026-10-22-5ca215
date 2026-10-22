import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, BadgeCheck, MapPin, Megaphone, Search, ShieldCheck, TrendingUp } from 'lucide-react'
import { ALL_CATEGORIES, CATEGORIES } from '../data/categories'
import { ALL_CITIES, CITIES, DEFAULT_CITY, cityBySlug } from '../data/locations'
import { useStore } from '../lib/store'
import { countBy, sortListings } from '../lib/filters'
import { ListingCard } from '../components/ListingCard'
import { CATEGORY_ICONS, SAFETY_TIPS } from '../components/ui'

export default function Home() {
  const { listings, recent, byId } = useStore()
  const navigate = useNavigate()
  const [city, setCity] = useState(DEFAULT_CITY)
  const [category, setCategory] = useState<string>(ALL_CATEGORIES)
  const [q, setQ] = useState('')
  const active = useMemo(() => listings.filter((l) => l.status === 'active'), [listings])
  const inCity = useMemo(() => active.filter((l) => city === ALL_CITIES || l.city === city), [active, city])
  const catCounts = useMemo(() => countBy(inCity, (l) => l.category), [inCity])
  const areaCounts = useMemo(() => countBy(inCity, (l) => l.area), [inCity])
  const topAreas = [...areaCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14)

  const featured = useMemo(() => sortListings(inCity.filter((l) => l.tier), 'recommended').slice(0, 8), [inCity])
  const land = useMemo(() => sortListings(inCity.filter((l) => l.category === 'land-plots-for-sale'), 'newest').slice(0, 4), [inCity])
  const rentals = useMemo(() => sortListings(inCity.filter((l) => l.category === 'houses-apartments-for-rent'), 'newest').slice(0, 4), [inCity])
  const shortlets = useMemo(() => sortListings(inCity.filter((l) => l.category === 'short-let'), 'recommended').slice(0, 4), [inCity])
  const recentItems = recent.map((id) => byId(id)).filter(Boolean).slice(0, 4)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(`/${city}/${category}${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`)
  }
  const cityLabel = city === ALL_CITIES ? 'Nigeria' : cityBySlug(city)?.name

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <h1>
            Find homes, land &amp; spaces in <span>{cityLabel}</span>
          </h1>
          <p>Rentals, houses for sale, plots with verified titles, short lets and offices — straight from owners, agents and developers.</p>
          <form className="hero-search" onSubmit={submit} role="search">
            <label className="hs-field">
              <MapPin size={18} />
              <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="City">
                <option value={ALL_CITIES}>All Nigeria</option>
                {CITIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="hs-field">
              <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
                <option value={ALL_CATEGORIES}>All property</option>
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="hs-field hs-q">
              <Search size={18} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. 3 bedroom flat in Woji" aria-label="Keywords" />
            </label>
            <button className="btn btn-accent">Search</button>
          </form>
          <div className="hero-stats">
            <span>
              <strong>{active.length.toLocaleString()}</strong> live adverts
            </span>
            <span>
              <strong>{CITIES.length}</strong> cities
            </span>
            <span>
              <BadgeCheck size={16} /> Verified sellers
            </span>
          </div>
        </div>
      </section>

      <div className="container home">
        <section className="cat-grid">
          {CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICONS[c.slug]
            return (
              <Link key={c.slug} to={`/${city}/${c.slug}`} className={`cat-tile g-${c.group}`}>
                <span className="cat-icon">
                  <Icon size={26} />
                </span>
                <strong>{c.name}</strong>
                <small>{(catCounts.get(c.slug) ?? 0).toLocaleString()} ads</small>
              </Link>
            )
          })}
        </section>

        {featured.length > 0 && (
          <Shelf title={`Featured in ${cityLabel}`} to={`/${city}/${ALL_CATEGORIES}`}>
            {featured.map((l) => (
              <ListingCard key={l.id} l={l} />
            ))}
          </Shelf>
        )}

        {topAreas.length > 0 && (
          <section className="block">
            <div className="block-head">
              <h2>Popular areas</h2>
            </div>
            <div className="area-chips">
              {topAreas.map(([area, n]) => {
                const c = inCity.find((l) => l.area === area)!.city
                return (
                  <Link key={area} to={`/${c}/${ALL_CATEGORIES}?area=${encodeURIComponent(area)}`} className="chip">
                    <MapPin size={14} /> {area} <small>{n}</small>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {rentals.length > 0 && (
          <Shelf title="Fresh rentals" to={`/${city}/houses-apartments-for-rent?sort=newest`}>
            {rentals.map((l) => (
              <ListingCard key={l.id} l={l} />
            ))}
          </Shelf>
        )}

        <section className="cta-band">
          <div>
            <Megaphone size={34} />
            <div>
              <h2>Got a property to let or sell?</h2>
              <p>Post in two minutes. Reach tenants, buyers and investors across Nigeria — free.</p>
            </div>
          </div>
          <Link to="/sell" className="btn btn-accent lg">
            Post a property <ArrowRight size={18} />
          </Link>
        </section>

        {land.length > 0 && (
          <Shelf title="Land & plots just listed" to={`/${city}/land-plots-for-sale?sort=newest`}>
            {land.map((l) => (
              <ListingCard key={l.id} l={l} />
            ))}
          </Shelf>
        )}

        {shortlets.length > 0 && (
          <Shelf title="Short lets for your next stay" to={`/${city}/short-let`}>
            {shortlets.map((l) => (
              <ListingCard key={l.id} l={l} />
            ))}
          </Shelf>
        )}

        {recentItems.length > 0 && (
          <Shelf title="Recently viewed">
            {recentItems.map((l) => (
              <ListingCard key={l!.id} l={l!} />
            ))}
          </Shelf>
        )}

        <section className="trust">
          <div className="trust-item">
            <BadgeCheck size={28} />
            <h3>Verified sellers</h3>
            <p>Agents and developers with a Verified ID badge have shown us a valid government ID and business details.</p>
            <Link to="/agents">See trusted agents</Link>
          </div>
          <div className="trust-item">
            <TrendingUp size={28} />
            <h3>Know the price</h3>
            <p>Compare asking prices by area, property type and bedrooms before you pay for an inspection.</p>
            <Link to="/price-check">Open price check</Link>
          </div>
          <div className="trust-item">
            <ShieldCheck size={28} />
            <h3>Stay safe</h3>
            <p>{SAFETY_TIPS[0]}</p>
            <Link to="/safety">Read all safety tips</Link>
          </div>
        </section>
      </div>
    </>
  )
}

function Shelf({ title, to, children }: { title: string; to?: string; children: React.ReactNode }) {
  return (
    <section className="block">
      <div className="block-head">
        <h2>{title}</h2>
        {to && (
          <Link to={to} className="see-all">
            See all <ArrowRight size={16} />
          </Link>
        )}
      </div>
      <div className="card-grid four">{children}</div>
    </section>
  )
}
