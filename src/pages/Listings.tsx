import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, LayoutGrid, List, SearchX, SlidersHorizontal, X } from 'lucide-react'
import { ALL_CATEGORIES, CATEGORIES, categoryBySlug, isCategorySlug } from '../data/categories'
import { ALL_CITIES, cityBySlug, cityName } from '../data/locations'
import { useStore } from '../lib/store'
import { applyFilters, PAGE_SIZE, parseFilters, POSTED_OPTIONS, scopeListings, SORT_OPTIONS, sortListings } from '../lib/filters'
import { nairaCompact, plural } from '../lib/format'
import { ListingCard } from '../components/ListingCard'
import { FilterSidebar, type SetParams } from '../components/FilterSidebar'
import { LocationPicker } from '../components/LocationPicker'
import { CATEGORY_ICONS, EmptyState, typeIcon } from '../components/ui'
import NotFound from './NotFound'

export default function Listings() {
  const { city = '', category = '' } = useParams()
  const valid = (city === ALL_CITIES || !!cityBySlug(city)) && (category === ALL_CATEGORIES || isCategorySlug(category))
  return valid ? <ListingsView key={`${city}/${category}`} city={city} category={category} /> : <NotFound />
}

function ListingsView({ city, category }: { city: string; category: string }) {
  const { listings } = useStore()
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const f = useMemo(() => parseFilters(sp), [sp])
  const [pickLoc, setPickLoc] = useState(false)
  const [mobileFilters, setMobileFilters] = useState(false)
  const cat = categoryBySlug(category)
  const place = f.area ? `${f.area}, ${cityName(city)}` : cityName(city)

  const cityPool = useMemo(() => scopeListings(listings, city, ALL_CATEGORIES), [listings, city])
  const catPool = useMemo(() => scopeListings(listings, ALL_CITIES, category), [listings, category])
  const scope = useMemo(() => scopeListings(listings, city, category), [listings, city, category])
  const results = useMemo(() => sortListings(applyFilters(scope, f), f.sort), [scope, f])
  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const page = Math.min(f.page, pages)
  const pageItems = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const set: SetParams = useCallback(
    (patch) => {
      setSp((prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(patch)) {
          const val = Array.isArray(v) ? v.join(',') : v
          val === undefined || val === null || val === '' ? next.delete(k) : next.set(k, String(val))
        }
        if (!('page' in patch)) next.delete('page')
        return next
      })
    },
    [setSp],
  )

  const goPage = (p: number) => {
    set({ page: p > 1 ? p : undefined })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Only filters the user added — the city and category already live in the title.
  const chips: { label: string; clear: () => void }[] = []
  if (f.area) chips.push({ label: f.area, clear: () => set({ area: undefined }) })
  if (f.q) chips.push({ label: `“${f.q}”`, clear: () => set({ q: undefined }) })
  if (f.min !== undefined || f.max !== undefined)
    chips.push({ label: `${f.min !== undefined ? nairaCompact(f.min) : '₦0'} – ${f.max !== undefined ? nairaCompact(f.max) : 'any'}`, clear: () => set({ min: undefined, max: undefined }) })
  f.types.forEach((t) => chips.push({ label: t, clear: () => set({ type: f.types.filter((x) => x !== t) }) }))
  f.beds.forEach((b) => chips.push({ label: `${b >= 5 ? '5+' : b} bed`, clear: () => set({ beds: f.beds.filter((x) => x !== b).map(String) }) }))
  f.baths.forEach((b) => chips.push({ label: `${b >= 4 ? '4+' : b} bath`, clear: () => set({ baths: f.baths.filter((x) => x !== b).map(String) }) }))
  ;[...f.furnishing, ...f.condition].forEach((v) =>
    chips.push({ label: v, clear: () => set({ furnishing: f.furnishing.filter((x) => x !== v), condition: f.condition.filter((x) => x !== v) }) }),
  )
  f.docs.forEach((d) => chips.push({ label: d.replace(/ \(.*\)/, ''), clear: () => set({ docs: f.docs.filter((x) => x !== d) }) }))
  f.facilities.forEach((d) => chips.push({ label: d, clear: () => set({ facilities: f.facilities.filter((x) => x !== d) }) }))
  if (f.verified) chips.push({ label: 'Verified sellers', clear: () => set({ verified: undefined }) })
  if (f.posted) chips.push({ label: POSTED_OPTIONS.find(([k]) => k === f.posted)![1], clear: () => set({ posted: undefined }) })

  const clearAll = () => navigate(`/${city}/${category}`)
  const sidebar = (
    <FilterSidebar city={city} category={category} cityPool={cityPool} scope={scope} f={f} set={set} onPickLocation={() => setPickLoc(true)} />
  )

  return (
    <div className="container page-listings">
      <div className="listings-layout">
        <aside className="listings-side">{sidebar}</aside>

        <main className="listings-main">
          <header className="listings-head">
            <h1 className="page-title">
              {cat ? cat.name : 'Property'} <span className="title-place">in {place}</span>
            </h1>
            <p className="muted">{plural(results.length, 'advert')}</p>
          </header>

          <div className="type-chips">
            {cat
              ? cat.types.map((t) => {
                  const Icon = typeIcon(t)
                  const on = f.types.includes(t)
                  return (
                    <button key={t} className={`tchip ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => set({ type: on ? f.types.filter((x) => x !== t) : [...f.types, t] })}>
                      <Icon size={16} /> {t}
                    </button>
                  )
                })
              : CATEGORIES.map((c) => {
                  const Icon = CATEGORY_ICONS[c.slug]
                  return (
                    <Link key={c.slug} to={`/${city}/${c.slug}`} className="tchip">
                      <Icon size={16} /> {c.short}
                    </Link>
                  )
                })}
          </div>

          <div className="toolbar">
            <button className="btn btn-outline sm show-md" onClick={() => setMobileFilters(true)}>
              <SlidersHorizontal size={16} /> Filters{chips.length > 0 ? ` · ${chips.length}` : ''}
            </button>
            {chips.length > 0 && (
              <div className="active-chips hide-md">
                {chips.map((c) => (
                  <button key={c.label} className="achip" onClick={c.clear} aria-label={`Remove ${c.label}`}>
                    {c.label} <X size={13} />
                  </button>
                ))}
                <button className="link-btn" onClick={clearAll}>
                  Clear all
                </button>
              </div>
            )}
            <div className="toolbar-right">
              <label className="select-pill">
                <span>Sort</span>
                <select value={f.sort} onChange={(e) => set({ sort: e.target.value === 'recommended' ? undefined : e.target.value })} aria-label="Sort">
                  {SORT_OPTIONS.map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <div className="view-toggle" role="group" aria-label="Layout">
                <button className={f.view === 'grid' ? 'on' : ''} onClick={() => set({ view: undefined, page: f.page > 1 ? f.page : undefined })} aria-label="Grid view">
                  <LayoutGrid size={16} />
                </button>
                <button className={f.view === 'list' ? 'on' : ''} onClick={() => set({ view: 'list', page: f.page > 1 ? f.page : undefined })} aria-label="List view">
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {pageItems.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No adverts match your filters"
              text="Try removing a filter, widening the price range or searching all of Nigeria."
              action={
                <button className="btn btn-primary" onClick={clearAll}>
                  Clear filters
                </button>
              }
            />
          ) : (
            <div className={f.view === 'list' ? 'card-list' : 'card-grid'}>
              {pageItems.map((l) => (
                <ListingCard key={l.id} l={l} view={f.view} />
              ))}
            </div>
          )}

          {pages > 1 && (
            <nav className="pager" aria-label="Pages">
              <button disabled={page <= 1} onClick={() => goPage(page - 1)} aria-label="Previous page">
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: pages }, (_, k) => k + 1)
                .filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1)
                .map((p, k, arr) => (
                  <span key={p} className="pager-group">
                    {k > 0 && p - arr[k - 1]! > 1 && <span className="pager-gap">…</span>}
                    <button className={p === page ? 'on' : ''} onClick={() => goPage(p)} aria-current={p === page ? 'page' : undefined}>
                      {p}
                    </button>
                  </span>
                ))}
              <button disabled={page >= pages} onClick={() => goPage(page + 1)} aria-label="Next page">
                <ChevronRight size={18} />
              </button>
            </nav>
          )}
        </main>
      </div>

      <LocationPicker
        open={pickLoc}
        onClose={() => setPickLoc(false)}
        pool={catPool}
        city={city}
        onSelect={(c, area) => {
          setPickLoc(false)
          const next = new URLSearchParams(sp)
          area ? next.set('area', area) : next.delete('area')
          next.delete('page')
          navigate(`/${c}/${category}?${next}`)
        }}
      />

      <div className={`sheet ${mobileFilters ? 'open' : ''}`} aria-hidden={!mobileFilters}>
        <div className="sheet-head">
          <button className="icon-btn" onClick={() => setMobileFilters(false)} aria-label="Close filters">
            <X size={22} />
          </button>
          <strong>Filters</strong>
          <button className="link-btn" onClick={clearAll}>
            Reset
          </button>
        </div>
        <div className="sheet-body">
          {chips.length > 0 && (
            <div className="active-chips">
              {chips.map((c) => (
                <button key={c.label} className="achip" onClick={c.clear}>
                  {c.label} <X size={13} />
                </button>
              ))}
            </div>
          )}
          {mobileFilters && sidebar}
        </div>
        <div className="sheet-foot">
          <button className="btn btn-primary block" onClick={() => setMobileFilters(false)}>
            Show {plural(results.length, 'result')}
          </button>
        </div>
      </div>
    </div>
  )
}
