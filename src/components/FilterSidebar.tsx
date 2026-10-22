import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Minus, Plus, Search } from 'lucide-react'
import type { Listing } from '../types'
import { ALL_CATEGORIES, CATEGORIES, CONDITIONS, FURNISHING, LAND_DOCUMENTS, categoryBySlug } from '../data/categories'
import { cityName } from '../data/locations'
import { applyFilters, countBy, priceBands, type Filters } from '../lib/filters'
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

function Section({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="card fsec">
      <button className="fsec-head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span>{title}</span>
        {open ? <Minus size={16} /> : <Plus size={16} />}
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
  const bedCounts = countBy(applyFilters(scope, f, ['beds']), (l) => (l.bedrooms ? String(Math.min(5, l.bedrooms)) : undefined))
  const bathCounts = countBy(applyFilters(scope, f, ['baths']), (l) => (l.bathrooms ? String(Math.min(4, l.bathrooms)) : undefined))
  const cats = showAllCats ? CATEGORIES : CATEGORIES.slice(0, 5)
  const bandKey = (b: { min?: number; max?: number }) => `${b.min ?? ''}-${b.max ?? ''}`
  const activeBand = `${f.min ?? ''}-${f.max ?? ''}`

  return (
    <div className="filters">
      <section className="card fcats">
        <h4 className="fcats-head">Categories</h4>
        <Link to={`/${city}/${ALL_CATEGORIES}`} className={`fcats-root ${category === ALL_CATEGORIES ? 'active' : ''}`}>
          Property <small>{cityPool.length.toLocaleString()}</small>
        </Link>
        <ul>
          {cats.map((c) => (
            <li key={c.slug}>
              <Link to={`/${city}/${c.slug}`} className={c.slug === category ? 'active' : ''}>
                {c.name} <small>{(catCounts.get(c.slug) ?? 0).toLocaleString()}</small>
              </Link>
            </li>
          ))}
        </ul>
        <button className="link-btn" onClick={() => setShowAllCats((v) => !v)}>
          {showAllCats ? 'Show less' : `Show all ${CATEGORIES.length}`}
        </button>
      </section>

      <button className="card floc" onClick={onPickLocation}>
        <span>
          <span className="floc-label">Location</span>
          <span className="floc-value">
            {f.area ? `${f.area}, ` : ''}
            {cityName(city)}
          </span>
        </span>
        <ChevronRight size={18} />
      </button>

      <Section title="Price, ₦">
        <div className="price-inputs">
          <input inputMode="numeric" placeholder="min" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ''))} aria-label="Minimum price" />
          <span>–</span>
          <input inputMode="numeric" placeholder="max" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ''))} aria-label="Maximum price" />
        </div>
        <ul className="radios">
          {bands.map((b) => (
            <li key={bandKey(b)}>
              <label>
                <input type="radio" name="band" checked={activeBand === bandKey(b)} onChange={() => set({ min: b.min, max: b.max })} />
                <span>
                  {b.min === undefined ? `Under ${nairaCompact(b.max!)}` : b.max === undefined ? `More than ${nairaCompact(b.min)}` : `${nairaCompact(b.min)} – ${nairaCompact(b.max)}`}
                </span>
                <small>{b.count} ads</small>
              </label>
            </li>
          ))}
        </ul>
        <div className="fsec-actions">
          <button className="link-btn muted" onClick={() => set({ min: undefined, max: undefined })}>
            Clear
          </button>
          <button className="link-btn" onClick={() => set({ min: min || undefined, max: max || undefined })}>
            Save
          </button>
        </div>
      </Section>

      <Section title="Property type">
        <CheckList options={typeOptions} selected={f.types} counts={facet('types', (l) => l.propertyType)} onChange={(v) => set({ type: v })} searchable />
      </Section>

      {residential && (
        <Section title="Bedrooms">
          <div className="pills">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} className={`pill ${f.beds.includes(n) ? 'on' : ''}`} onClick={() => set({ beds: toggle(f.beds, n).map(String) })} disabled={!bedCounts.get(String(n)) && !f.beds.includes(n)}>
                {n === 5 ? '5+' : n}
                <small>{bedCounts.get(String(n)) ?? 0}</small>
              </button>
            ))}
          </div>
        </Section>
      )}

      {residential && (
        <Section title="Bathrooms" defaultOpen={false}>
          <div className="pills">
            {[1, 2, 3, 4].map((n) => (
              <button key={n} className={`pill ${f.baths.includes(n) ? 'on' : ''}`} onClick={() => set({ baths: toggle(f.baths, n).map(String) })} disabled={!bathCounts.get(String(n)) && !f.baths.includes(n)}>
                {n === 4 ? '4+' : n}
                <small>{bathCounts.get(String(n)) ?? 0}</small>
              </button>
            ))}
          </div>
        </Section>
      )}

      {residential && (
        <Section title="Furnishing">
          <CheckList options={[...FURNISHING]} selected={f.furnishing} counts={facet('furnishing', (l) => l.furnishing)} onChange={(v) => set({ furnishing: v })} />
        </Section>
      )}

      {cat?.group !== 'land' && (
        <Section title="Condition" defaultOpen={false}>
          <CheckList options={[...CONDITIONS]} selected={f.condition} counts={facet('condition', (l) => l.condition)} onChange={(v) => set({ condition: v })} />
        </Section>
      )}

      {showDocs && (
        <Section title="Title document" defaultOpen={cat?.group === 'land'}>
          <CheckList options={[...new Set([...LAND_DOCUMENTS, 'Certificate of Occupancy (C of O)'])]} selected={f.docs} counts={facet('docs', (l) => l.document)} onChange={(v) => set({ docs: v })} />
        </Section>
      )}

      <Section title={cat?.group === 'land' ? 'Land features' : 'Facilities'} defaultOpen={false}>
        <CheckList options={facilityOptions} selected={f.facilities} counts={countBy(applyFilters(scope, f, ['facilities']), (l) => l.facilities)} onChange={(v) => set({ facilities: v })} />
      </Section>

      <Section title="Verified sellers">
        <label className="check-row">
          <input type="checkbox" checked={f.verified} onChange={(e) => set({ verified: e.target.checked ? '1' : undefined })} />
          <span>Verified sellers</span>
          <small>{verifiedCount} ads</small>
        </label>
      </Section>
    </div>
  )
}
