import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, BadgeCheck, MapPin, Search, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react'
import { ALL_CATEGORIES, CATEGORIES } from '../data/categories'
import { ALL_CITIES, DEFAULT_CITY, STATES, cityBySlug, inPlace, placeName } from '../data/locations'
import { useStore } from '../lib/store'
import { countBy, sortListings } from '../lib/filters'
import { parseSearch, searchUrl, SEARCH_EXAMPLES } from '../lib/nlsearch'
import { ListingCard } from '../components/ListingCard'
import { CATEGORY_ICONS, SAFETY_TIPS } from '../components/ui'

export default function Home() {
  const { listings, recent, byId, places } = useStore()
  const navigate = useNavigate()
  const [city, setCity] = useState(DEFAULT_CITY)
  const [q, setQ] = useState('')
  const active = useMemo(() => listings.filter((l) => l.status === 'active'), [listings])
  const inCity = useMemo(() => active.filter((l) => inPlace(l.city, city)), [active, city])
  const catCounts = useMemo(() => countBy(inCity, (l) => l.category), [inCity])
  const areaCounts = useMemo(() => countBy(inCity, (l) => l.area), [inCity])
  const topAreas = [...areaCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)

  const featured = useMemo(() => sortListings(inCity.filter((l) => l.tier), 'recommended').slice(0, 4), [inCity])
  const rentals = useMemo(() => sortListings(inCity.filter((l) => l.category === 'houses-apartments-for-rent'), 'newest').slice(0, 4), [inCity])
  const land = useMemo(() => sortListings(inCity.filter((l) => l.category === 'land-plots-for-sale'), 'newest').slice(0, 4), [inCity])
  const shortlets = useMemo(() => sortListings(inCity.filter((l) => l.category === 'short-let'), 'recommended').slice(0, 4), [inCity])
  const recentItems = recent.map((id) => byId(id)).filter(Boolean).slice(0, 4)

  // Read the sentence as you type so people can see what we understood.
  const parsed = useMemo(() => (q.trim().length > 2 ? parseSearch(q, listings) : null), [q, listings])
  const run = (text: string) => {
    const t = text.trim()
    if (!t) return navigate(`/${city}/${ALL_CATEGORIES}`)
    navigate(searchUrl(parseSearch(t, listings), t, city, places))
  }
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    run(q)
  }
  const cityLabel = placeName(city)

  return (
    <div className="container home">
      <section className="hero">
        <h1>
          Find your next home in <span>{cityLabel}</span>
        </h1>
        <p>Rentals, homes for sale, land with verified titles, short lets and offices — straight from owners and trusted agents.</p>
        <form className="hero-search" onSubmit={submit} role="search">
          <label className="hs-city">
            <MapPin size={18} />
            <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="City">
              <option value={ALL_CITIES}>All Nigeria</option>
              {STATES.map((s) => (
                <optgroup key={s.slug} label={s.label}>
                  <option value={s.slug}>All {s.label}</option>
                  {s.cities.map((slug) => (
                    <option key={slug} value={slug}>
                      {cityBySlug(slug)?.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="hs-q">
            <Search size={18} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Describe it: “3 bed flat in Woji under 2.5m”" aria-label="Describe the property you want" enterKeyHint="search" />
          </label>
          <button className="btn btn-accent">Search</button>
        </form>
        {parsed && parsed.understood.length > 0 ? (
          <p className="hero-understood" aria-live="polite">
            <Sparkles size={15} /> <span>We'll look for</span>
            {parsed.understood.map((u) => (
              <span key={u} className="u-chip">
                {u}
              </span>
            ))}
          </p>
        ) : (
          <div className="hero-examples">
            <span>Try:</span>
            {SEARCH_EXAMPLES.slice(0, 4).map((ex) => (
              <button key={ex} type="button" onClick={() => run(ex)}>
                {ex}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="cat-grid" aria-label="Categories">
        {CATEGORIES.map((c) => {
          const Icon = CATEGORY_ICONS[c.slug]
          return (
            <Link key={c.slug} to={`/${city}/${c.slug}`} className={`cat-tile g-${c.group}`}>
              <span className="cat-icon">
                <Icon size={22} />
              </span>
              <span>
                <strong>{c.short}</strong>
                <small>{(catCounts.get(c.slug) ?? 0).toLocaleString()} ads</small>
              </span>
            </Link>
          )
        })}
      </section>

      {featured.length > 0 && (
        <Shelf title="Featured" to={`/${city}/${ALL_CATEGORIES}`}>
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
                  {area} <small>{n}</small>
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
        <div className="cta-copy">
          <h2>Have a property to let or sell?</h2>
          <p>Post it in two minutes. It's free.</p>
          <Link to="/sell" className="btn btn-accent lg">
            Post a property <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {land.length > 0 && (
        <Shelf title="Land just listed" to={`/${city}/land-plots-for-sale?sort=newest`}>
          {land.map((l) => (
            <ListingCard key={l.id} l={l} />
          ))}
        </Shelf>
      )}

      {shortlets.length > 0 && (
        <Shelf title="Short lets" to={`/${city}/short-let`}>
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
        <Link to="/agents" className="trust-item">
          <BadgeCheck size={22} />
          <strong>Verified sellers</strong>
          <span>Agents with a Verified ID have shown us valid ID and business details.</span>
        </Link>
        <Link to="/price-check" className="trust-item">
          <TrendingUp size={22} />
          <strong>Know the price</strong>
          <span>Compare asking prices by area before you pay for an inspection.</span>
        </Link>
        <Link to="/safety" className="trust-item">
          <ShieldCheck size={22} />
          <strong>Stay safe</strong>
          <span>{SAFETY_TIPS[0]}</span>
        </Link>
      </section>
    </div>
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
