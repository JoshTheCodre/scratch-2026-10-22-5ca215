import { useCallback, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, LayoutGrid, List, MapPinned, SearchX, SlidersHorizontal, Sparkles, X } from 'lucide-react'
import { ALL_CATEGORIES, CATEGORIES, RETIRED_CATEGORIES, categoryBySlug, isCategorySlug } from '../data/categories'
import { ALL_CITIES, isPlace, placeName } from '../data/locations'
import { useStore } from '../lib/store'
import { applyFilters, PAGE_SIZE, parseFilters, POSTED_OPTIONS, scopeListings, SORT_OPTIONS, sortListings, type Filters } from '../lib/filters'
import { listingPath, naira, nairaCompact, plural, unitLabel } from '../lib/format'
import { similarity } from '../lib/similar'
import { commuteTo, PLACE_ICONS } from '../components/Places'
import { ListingCard } from '../components/ListingCard'
import { FilterSidebar, type SetParams } from '../components/FilterSidebar'
import { LocationPicker } from '../components/LocationPicker'
import { CATEGORY_ICONS, EmptyState, Img, typeIcon } from '../components/ui'
import NotFound from './NotFound'

export default function Listings() {
  const { city = '', category = '' } = useParams()
  const retired = RETIRED_CATEGORIES[category]
  if (retired && isPlace(city)) return <Navigate to={`/${city}/${retired.to}?${new URLSearchParams(retired.filter)}`} replace />
  const valid = isPlace(city) && (category === ALL_CATEGORIES || isCategorySlug(category))
  return valid ? <ListingsView key={`${city}/${category}`} city={city} category={category} /> : <NotFound />
}

function ListingsView({ city, category }: { city: string; category: string }) {
  const { listings, byId, places } = useStore()
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const f = useMemo(() => parseFilters(sp), [sp])
  const [pickLoc, setPickLoc] = useState(false)
  const [mobileFilters, setMobileFilters] = useState(false)
  const cat = categoryBySlug(category)
  const place = f.area ? `${f.area}, ${placeName(city)}` : placeName(city)

  const cityPool = useMemo(() => scopeListings(listings, city, ALL_CATEGORIES), [listings, city])
  const catPool = useMemo(() => scopeListings(listings, ALL_CITIES, category), [listings, category])
  const scope = useMemo(() => scopeListings(listings, city, category), [listings, city, category])
  const nl = sp.get('nl') ?? ''
  const nearLabel = sp.get('nearlabel')
  const like = byId(sp.get('like') ?? undefined)
  const nearPlace = f.sort.startsWith('near-') ? places.find((p) => `near-${p.id}` === f.sort) : undefined
  const results = useMemo(() => {
    const filtered = applyFilters(scope, f)
    if (nearPlace) {
      const mins = (l: (typeof filtered)[number]) => commuteTo(l, nearPlace)?.drive ?? Infinity
      return [...filtered].sort((a, b) => mins(a) - mins(b))
    }
    if (like && f.sort === 'recommended') {
      return filtered
        .filter((x) => x.id !== like.id)
        .map((x) => ({ x, s: similarity(like, x) }))
        .filter((r) => r.s >= 35)
        .sort((a, b) => b.s - a.s)
        .map((r) => r.x)
    }
    return sortListings(filtered, f.sort)
  }, [scope, f, nearPlace, like])
  // No exact match: loosen one filter at a time until something turns up, and say what changed.
  const close = useMemo(() => {
    if (results.length) return null
    const steps: [string, Partial<Filters>][] = [
      [f.facilities.length ? `without ${f.facilities.join(', ')}` : '', { facilities: [] }],
      [f.furnishing.length || f.condition.length ? 'any condition or furnishing' : '', { furnishing: [], condition: [] }],
      [f.area ? `anywhere in ${placeName(city)}` : '', { area: '' }],
      [f.max !== undefined ? `up to ${nairaCompact(f.max * 1.3)}` : '', { max: f.max !== undefined ? f.max * 1.3 : undefined }],
      [f.types.length ? 'any property type' : '', { types: [] }],
      [f.beds.length || f.baths.length ? 'any number of rooms' : '', { beds: [], baths: [] }],
      [f.min !== undefined || f.max !== undefined ? 'any price' : '', { min: undefined, max: undefined }],
    ]
    let cur: Filters = { ...f, q: '', docs: [], verified: false, posted: '' }
    const notes: string[] = []
    for (const [note, patch] of steps) {
      if (!note) continue
      cur = { ...cur, ...patch }
      notes.push(note)
      const found = applyFilters(scope, cur)
      if (found.length) return { items: sortListings(found, 'recommended').slice(0, 8), notes }
    }
    return null
  }, [results.length, f, scope, city])
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

          {like && (
            <div className="search-banner like-banner">
              <Link to={listingPath(like)} className="like-thumb">
                <Img src={like.images[0]} alt={like.title} width={160} />
              </Link>
              <div>
                <span className="muted small">Homes similar to</span>
                <Link to={listingPath(like)} className="like-title">
                  {like.title}
                </Link>
                <small className="muted">
                  {naira(like.price)} {unitLabel(like.priceUnit, like.category)} · {like.area}
                </small>
              </div>
              <button className="icon-btn" onClick={() => set({ like: undefined })} aria-label="Stop showing similar homes">
                <X size={18} />
              </button>
            </div>
          )}
          {nl && (
            <div className="search-banner nl-banner">
              <Sparkles size={18} className="nl-spark" />
              <div className="nl-body">
                <p>
                  <span className="muted">Results for</span> <strong>“{nl}”</strong>
                </p>
                {chips.length > 0 && (
                  <div className="nl-chips">
                    {chips.map((c) => (
                      <button key={c.label} className="achip" onClick={c.clear} aria-label={`Remove ${c.label}`}>
                        {c.label} <X size={13} />
                      </button>
                    ))}
                  </div>
                )}
                {sp.get('nlu') === '0' && (
                  <p className="small muted">We couldn’t pick out a place, budget or property type, so here is everything. Try “2 bedroom flat in Woji under 2m”.</p>
                )}
                {nearLabel && !nearPlace && (
                  <p className="small">
                    <MapPinned size={14} /> Add your {nearLabel.toLowerCase()} in <Link to="/places">My places</Link> to sort these by travel time.
                  </p>
                )}
              </div>
              <button className="icon-btn" onClick={() => set({ nl: undefined, nearlabel: undefined, nlu: undefined })} aria-label="Dismiss">
                <X size={18} />
              </button>
            </div>
          )}

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
            {chips.length > 0 && !nl && (
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
                      {k === 'recommended' && like ? 'Most similar' : v}
                    </option>
                  ))}
                  {places.map((p) => (
                    <option key={p.id} value={`near-${p.id}`}>
                      Closest to {p.name}
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

          {nearPlace && (
            <p className="sort-note">
              {(() => {
                const Icon = PLACE_ICONS[nearPlace.label]
                return <Icon size={15} />
              })()}
              <span>
                Sorted by drive time to <strong>{nearPlace.name}</strong>. Times are estimates.
              </span>
            </p>
          )}
          {pageItems.length === 0 && close ? (
            <section className="close-matches">
              <div className="close-head">
                <SearchX size={20} />
                <div>
                  <strong>No exact matches — here are the closest</strong>
                  <p className="muted small">Showing homes {close.notes.join(' · ')}.</p>
                </div>
              </div>
              <div className={f.view === 'list' ? 'card-list' : 'card-grid'}>
                {close.items.map((l) => (
                  <ListingCard key={l.id} l={l} view={f.view} />
                ))}
              </div>
            </section>
          ) : pageItems.length === 0 ? (
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
