import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Award, ChevronDown, ChevronRight, MapPin, Search, TrendingUp } from 'lucide-react'
import type { Listing } from '../types'
import { ALL_CATEGORIES, CATEGORIES, CONDITIONS, FURNISHING, LAND_DOCUMENTS, categoryBySlug } from '../data/categories'
import { ALL_CITIES, cityName } from '../data/locations'
import { applyFilters, countBy, POSTED_OPTIONS, priceBands, type Filters } from '../lib/filters'
import { nairaCompact } from '../lib/format'
import { sellerById } from '../data/sellers'

export type SetParams = (patch: Record<string, string | string[] | number | undefined | null>) => void

interface Props {
  city: string
  category: string
  /** Active listings in this city (all categories) — for category counts. */
  cityPool: Listing[]
  /** Listings in the city + category scope. */
  scope: Listing[]
  f: Filters
  set: SetParams
  onPickLocation: () => void
}

function Section({ title, active, children, defaultOpen = true }: { title: string; active?: boolean; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen || !!active)
  return (
    <section className="fsec">
      <button className="fsec-head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span>
          {title}
          {active && <i className="fsec-dot" aria-label="filter active" />}
        </span>
        <ChevronDown size={17} className={open ? 'flip' : ''} />
      </button>
      {open && <div className="fsec-body">{children}</div>}
    </section>
  )
}

const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])

function CheckList({ options, selected, counts, onChange, searchable }: { options: string[]; selected: string[]; counts: Map<string, number>; onChange: (v: string[]) => void; searchable?: boolean }) {
  const [q, setQ] = useState('')
  const [all, setAll] = useState(false)
  const shown = options.filter((o) => o.toLowerCase().includes(q.toLowerCase()))
  const visible = all || q ? shown : shown.slice(0, 6)
  return (
    <>
      {searchable && options.length > 6 && (
        <label className="input-icon small">
          <Search size={14} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" />
        </label>
      )}
      <ul className="checklist">
        {visible.map((o) => (
          <li key={o}>
            <label className={!counts.get(o) && !selected.includes(o) ? 'dim' : ''}>
              <input type="checkbox" checked={selected.includes(o)} onChange={() => onChange(toggle(selected, o))} />
              <span>{o}</span>
              <small>{counts.get(o) ?? 0}</small>
            </label>
          </li>
        ))}
      </ul>
      {!q && shown.length > 6 && (
        <button className="link-btn" onClick={() => setAll((v) => !v)}>
          {all ? 'Show less' : `Show all ${shown.length}`}
        </button>
      )}
    </>
  )
}

export function FilterSidebar({ city, category, cityPool, scope, f, set, onPickLocation }: Props) {
  const cat = categoryBySlug(category)
  const [min, setMin] = useState(f.min?.toString() ?? '')
  const [max, setMax] = useState(f.max?.toString() ?? '')
  const [showAllCats, setShowAllCats] = useState(false)
  useEffect(() => {
    setMin(f.min?.toString() ?? '')
    setMax(f.max?.toString() ?? '')
  }, [f.min, f.max])

  const catCounts = useMemo(() => countBy(cityPool, (l) => l.category), [cityPool])
  const bands = useMemo(() => priceBands(applyFilters(scope, f, ['min', 'max', 'page'])), [scope, f])
  const facet = (skip: keyof Filters, get: (l: Listing) => string | string[] | undefined) => countBy(applyFilters(scope, f, [skip]), get)

  const typeOptions = cat ? cat.types : [...new Set(scope.map((l) => l.propertyType))].sort()
  const residential = !cat || cat.group === 'residential'
  const showDocs = !cat || cat.group === 'land' || cat.deal === 'sale'
  const facilityOptions = useMemo(() => {
    const counts = countBy(scope, (l) => l.facilities)
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k).slice(0, 14)
  }, [scope])
  const verifiedCount = applyFilters(scope, f, ['verified']).filter((l) => l.isUserAd || sellerById(l.sellerId)?.verified).length
  const postedCounts = (p: Filters['posted']) => applyFilters(scope, { ...f, posted: p }).length
  const bedCounts = countBy(applyFilters(scope, f, ['beds']), (l) => (l.bedrooms ? String(Math.min(5, l.bedrooms)) : undefined))
  const bathCounts = countBy(applyFilters(scope, f, ['baths']), (l) => (l.bathrooms ? String(Math.min(4, l.bathrooms)) : undefined))
  const cats = showAllCats || !!cat ? CATEGORIES : CATEGORIES.slice(0, 5)
  const bandKey = (b: { min?: number; max?: number }) => `${b.min ?? ''}-${b.max ?? ''}`
  const activeBand = `${f.min ?? ''}-${f.max ?? ''}`

  return (
    <div className="filters">
      <section className="fsec fcats">
        <h4 className="fsec-label">Category</h4>
        <Link to={`/${city}/${ALL_CATEGORIES}`} className={`fcat ${category === ALL_CATEGORIES ? 'active' : ''}`}>
          All property <small>{cityPool.length.toLocaleString()}</small>
        </Link>
        {cats.map((c) => (
          <Link key={c.slug} to={`/${city}/${c.slug}`} className={`fcat ${c.slug === category ? 'active' : ''}`}>
            {c.name} <small>{(catCounts.get(c.slug) ?? 0).toLocaleString()}</small>
          </Link>
        ))}
        {!cat && (
          <button className="link-btn" onClick={() => setShowAllCats((v) => !v)}>
            {showAllCats ? 'Show less' : `Show all ${CATEGORIES.length}`}
          </button>
        )}
      </section>

      <button className="fsec floc" onClick={onPickLocation}>
        <MapPin size={18} />
        <span>
          <span className="floc-label">Location</span>
          <span className="floc-value">
            {f.area ? `${f.area}, ` : ''}
            {city === ALL_CITIES ? 'All Nigeria' : cityName(city)}
          </span>
        </span>
        <ChevronRight size={18} />
      </button>

      <Section title="Price" active={f.min !== undefined || f.max !== undefined}>
        <div className="price-inputs">
          <input inputMode="numeric" placeholder="Min ₦" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ''))} aria-label="Minimum price" />
          <span>–</span>
          <input inputMode="numeric" placeholder="Max ₦" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ''))} aria-label="Maximum price" />
        </div>
        <ul className="radios">
          {bands.map((b) => (
            <li key={bandKey(b)}>
              <label>
                <input type="radio" name="band" checked={activeBand === bandKey(b)} onChange={() => set({ min: b.min, max: b.max })} />
                <span>
                  {b.min === undefined ? `Under ${nairaCompact(b.max!)}` : b.max === undefined ? `Over ${nairaCompact(b.min)}` : `${nairaCompact(b.min)} – ${nairaCompact(b.max)}`}
                </span>
                <small>{b.count}</small>
              </label>
            </li>
          ))}
        </ul>
        <div className="fsec-actions">
          <button className="link-btn muted" onClick={() => set({ min: undefined, max: undefined })}>
            Clear
          </button>
          <button className="btn btn-soft sm" onClick={() => set({ min: min || undefined, max: max || undefined })}>
            Apply
          </button>
        </div>
      </Section>

      <Section title="Property type" active={f.types.length > 0}>
        <CheckList options={typeOptions} selected={f.types} counts={facet('types', (l) => l.propertyType)} onChange={(v) => set({ type: v })} searchable />
      </Section>

      {residential && (
        <Section title="Bedrooms" active={f.beds.length > 0}>
          <div className="pills">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} className={`pill ${f.beds.includes(n) ? 'on' : ''}`} onClick={() => set({ beds: toggle(f.beds, n).map(String) })} disabled={!bedCounts.get(String(n)) && !f.beds.includes(n)}>
                {n === 5 ? '5+' : n}
              </button>
            ))}
          </div>
        </Section>
      )}

      {residential && (
        <Section title="Bathrooms" active={f.baths.length > 0} defaultOpen={false}>
          <div className="pills">
            {[1, 2, 3, 4].map((n) => (
              <button key={n} className={`pill ${f.baths.includes(n) ? 'on' : ''}`} onClick={() => set({ baths: toggle(f.baths, n).map(String) })} disabled={!bathCounts.get(String(n)) && !f.baths.includes(n)}>
                {n === 4 ? '4+' : n}
              </button>
            ))}
          </div>
        </Section>
      )}

      {residential && (
        <Section title="Furnishing" active={f.furnishing.length > 0} defaultOpen={false}>
          <CheckList options={[...FURNISHING]} selected={f.furnishing} counts={facet('furnishing', (l) => l.furnishing)} onChange={(v) => set({ furnishing: v })} />
        </Section>
      )}

      {cat?.group !== 'land' && (
        <Section title="Condition" active={f.condition.length > 0} defaultOpen={false}>
          <CheckList options={[...CONDITIONS]} selected={f.condition} counts={facet('condition', (l) => l.condition)} onChange={(v) => set({ condition: v })} />
        </Section>
      )}

      {showDocs && (
        <Section title="Title document" active={f.docs.length > 0} defaultOpen={cat?.group === 'land'}>
          <CheckList options={[...new Set([...LAND_DOCUMENTS, 'Certificate of Occupancy (C of O)'])]} selected={f.docs} counts={facet('docs', (l) => l.document)} onChange={(v) => set({ docs: v })} />
        </Section>
      )}

      <Section title={cat?.group === 'land' ? 'Land features' : 'Facilities'} active={f.facilities.length > 0} defaultOpen={false}>
        <CheckList options={facilityOptions} selected={f.facilities} counts={countBy(applyFilters(scope, f, ['facilities']), (l) => l.facilities)} onChange={(v) => set({ facilities: v })} />
      </Section>

      <Section title="Posted" active={!!f.posted} defaultOpen={false}>
        <ul className="radios">
          {POSTED_OPTIONS.map(([k, label]) => (
            <li key={k || 'any'}>
              <label>
                <input type="radio" name="posted" checked={f.posted === k} onChange={() => set({ posted: k || undefined })} />
                <span>{label}</span>
                <small>{postedCounts(k)}</small>
              </label>
            </li>
          ))}
        </ul>
      </Section>

      <section className="fsec">
        <label className="switch-row">
          <span>
            Verified sellers only
            <small>{verifiedCount} adverts</small>
          </span>
          <input type="checkbox" role="switch" className="switch" checked={f.verified} onChange={(e) => set({ verified: e.target.checked ? '1' : undefined })} />
        </label>
      </section>

      <nav className="ftools">
        <Link to={`/agents${city !== ALL_CITIES ? `?city=${city}` : ''}`}>
          <Award size={16} /> Trusted agents
        </Link>
        <Link to={`/price-check?city=${city}&category=${category}`}>
          <TrendingUp size={16} /> Price check
        </Link>
      </nav>
    </div>
  )
}
