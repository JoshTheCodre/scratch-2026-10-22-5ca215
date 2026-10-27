import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, ImagePlus, Trash2, Star } from 'lucide-react'
import type { CategorySlug, Condition, Furnishing, Listing, PriceUnit } from '../types'
import { CATEGORIES, CONDITIONS, FACILITIES, FURNISHING, LAND_DOCUMENTS, categoryBySlug } from '../data/categories'
import { STATES, cityBySlug, stateBySlug, stateOfCity } from '../data/locations'
import { useStore } from '../lib/store'
import { listingPath, naira, slugify, unitLabel } from '../lib/format'
import { CATEGORY_ICONS, Img } from '../components/ui'

interface Draft {
  category: CategorySlug | ''
  city: string
  area: string
  propertyType: string
  title: string
  bedrooms: string
  bathrooms: string
  toilets: string
  parking: string
  sizeSqm: string
  plots: string
  furnishing: Furnishing | ''
  condition: Condition | ''
  document: string
  estate: string
  address: string
  facilities: string[]
  description: string
  images: string[]
  price: string
  priceUnit: PriceUnit
  negotiable: boolean
  agentFee: string
  cautionFee: string
  serviceCharge: string
  name: string
  phone: string
}

const STEPS = ['Category & location', 'Property details', 'Photos', 'Price & contact', 'Review']
const LAND_FEATURES = ['Dry Land', 'Fenced', 'Gated Estate', 'Tarred Road', 'Electricity Available', 'Good Drainage', 'Corner Piece', 'Instant Allocation', 'Security']
const DRAFT_KEY = 'h4r:v1:draft'

const defaultUnit = (cat?: string): PriceUnit => {
  const c = categoryBySlug(cat)
  if (!c) return 'per annum'
  if (c.deal === 'shortlet') return 'per day'
  if (c.slug === 'land-plots-for-sale') return 'per plot'
  return c.deal === 'rent' ? 'per annum' : 'total'
}

const UNITS: PriceUnit[] = ['total', 'per annum', 'per month', 'per day', 'per plot', 'per sqm']

function fromListing(l: Listing, name: string, phone: string): Draft {
  const s = (n?: number) => (n === undefined ? '' : String(n))
  return {
    category: l.category, city: l.city, area: l.area, propertyType: l.propertyType, title: l.title,
    bedrooms: s(l.bedrooms), bathrooms: s(l.bathrooms), toilets: s(l.toilets), parking: s(l.parking), sizeSqm: s(l.sizeSqm), plots: s(l.plots),
    furnishing: l.furnishing ?? '', condition: l.condition ?? '', document: l.document ?? '', estate: l.estate ?? '', address: l.address ?? '',
    facilities: l.facilities, description: l.description, images: l.images, price: s(l.price), priceUnit: l.priceUnit, negotiable: l.negotiable,
    agentFee: s(l.agentFee), cautionFee: s(l.cautionFee), serviceCharge: s(l.serviceCharge), name, phone,
  }
}

/** Downscale an uploaded photo to a JPEG data URL so it fits in localStorage. */
function shrink(file: File, max = 1100): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.72))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read image'))
    }
    img.src = url
  })
}

export default function PostAd() {
  const { user, login, myAds, addAd, updateAd, toast } = useStore()
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const editing = myAds.find((a) => a.id === sp.get('edit'))
  const fileRef = useRef<HTMLInputElement>(null)

  const [d, setD] = useState<Draft>(() => {
    if (editing) return fromListing(editing, user?.name ?? '', user?.phone ?? '')
    const preCat = categoryBySlug(sp.get('category') ?? '')?.slug ?? ''
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved && !preCat) return JSON.parse(saved) as Draft
    } catch {
      /* ignore */
    }
    return {
      category: preCat, city: 'port-harcourt', area: '', propertyType: '', title: '', bedrooms: '', bathrooms: '', toilets: '', parking: '',
      sizeSqm: '', plots: '', furnishing: '', condition: '', document: '', estate: '', address: '', facilities: [], description: '', images: [],
      price: '', priceUnit: defaultUnit(preCat), negotiable: true, agentFee: '', cautionFee: '', serviceCharge: '', name: user?.name ?? '', phone: user?.phone ?? '',
    }
  })
  const [step, setStep] = useState(d.category ? 1 : 0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [allFacilities, setAllFacilities] = useState(false)

  const cat = categoryBySlug(d.category)
  const city = cityBySlug(d.city)
  const isLand = cat?.group === 'land'
  const residential = cat?.group === 'residential'
  const facilityOptions = isLand ? LAND_FEATURES : FACILITIES

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setD((prev) => {
      const next = { ...prev, [k]: v }
      if (!editing) {
        try {
          // Photos are left out so the draft never blows the storage quota.
          localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...next, images: [] }))
        } catch {
          /* ignore */
        }
      }
      return next
    })

  const suggestedTitle = useMemo(() => {
    if (!d.propertyType || !d.area) return ''
    const beds = Number(d.bedrooms)
    if (isLand) return `${d.plots || 1} Plot${Number(d.plots) > 1 ? 's' : ''} of ${d.propertyType} in ${d.area}`
    const deal = cat?.deal === 'sale' ? 'for Sale' : cat?.deal === 'shortlet' ? '(Short Let)' : 'for Rent'
    return `${beds ? `${beds} Bedroom ` : ''}${d.propertyType} ${deal} in ${d.area}`
  }, [d.propertyType, d.area, d.bedrooms, d.plots, isLand, cat])

  const validate = (s: number) => {
    const e: Record<string, string> = {}
    if (s === 0) {
      if (!d.category) e.category = 'Choose a category'
      if (!d.city) e.city = 'Choose a city'
      if (!d.area) e.area = 'Choose an area'
    }
    if (s === 1) {
      if (!d.propertyType) e.propertyType = 'Choose the property type'
      if (d.title.trim().length < 10) e.title = 'Title should be at least 10 characters'
      if (residential && !d.bedrooms) e.bedrooms = 'How many bedrooms?'
      if (isLand && !d.plots && !d.sizeSqm) e.plots = 'Enter number of plots or size'
      if (d.description.trim().length < 30) e.description = 'Describe the property in at least 30 characters'
    }
    if (s === 2 && d.images.length === 0) e.images = 'Add at least one photo — ads with photos get 5× more calls'
    if (s === 3) {
      if (!Number(d.price)) e.price = 'Enter a price'
      if (d.name.trim().length < 2) e.name = 'Enter your name'
      if (d.phone.replace(/\D/g, '').length < 10) e.phone = 'Enter a valid phone number'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (!validate(step)) return
    if (step === 1 && !d.title) set('title', suggestedTitle)
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const back = () => setStep((s) => Math.max(0, s - 1))

  const addFiles = async (files: FileList | null) => {
    if (!files) return
    setBusy(true)
    const room = 10 - d.images.length
    const out: string[] = []
    for (const f of Array.from(files).slice(0, room)) {
      if (!f.type.startsWith('image/')) continue
      try {
        out.push(await shrink(f))
      } catch {
        toast(`Couldn't read ${f.name}`, 'warn')
      }
    }
    set('images', [...d.images, ...out])
    setBusy(false)
  }

  const publish = () => {
    for (const s of [0, 1, 2, 3]) {
      if (!validate(s)) {
        setStep(s)
        return
      }
    }
    if (!user) login({ name: d.name.trim(), phone: d.phone.trim() })
    const n = (v: string) => (v ? Number(v) : undefined)
    const listing: Listing = {
      id: editing?.id ?? `u${Date.now().toString(36)}`,
      slug: slugify(d.title),
      title: d.title.trim(),
      category: d.category as CategorySlug,
      propertyType: d.propertyType,
      price: Number(d.price),
      priceUnit: d.priceUnit,
      negotiable: d.negotiable,
      city: d.city,
      area: d.area,
      address: d.address || undefined,
      estate: d.estate || undefined,
      bedrooms: n(d.bedrooms),
      bathrooms: n(d.bathrooms),
      toilets: n(d.toilets),
      parking: n(d.parking),
      sizeSqm: n(d.sizeSqm),
      plots: n(d.plots),
      furnishing: d.furnishing || undefined,
      condition: d.condition || undefined,
      document: d.document || undefined,
      facilities: d.facilities,
      agentFee: n(d.agentFee),
      cautionFee: n(d.cautionFee),
      serviceCharge: n(d.serviceCharge),
      description: d.description.trim(),
      images: d.images,
      sellerId: 'me',
      postedAt: editing?.postedAt ?? new Date().toISOString(),
      views: editing?.views ?? 0,
      status: 'active',
      lat: (city?.lat ?? 4.8) + (Math.random() - 0.5) * 0.06,
      lng: (city?.lng ?? 7) + (Math.random() - 0.5) * 0.06,
      isUserAd: true,
    }
    try {
      if (editing) updateAd(editing.id, listing)
      else addAd(listing)
      localStorage.removeItem(DRAFT_KEY)
    } catch {
      /* ignore */
    }
    toast(editing ? 'Advert updated' : 'Your advert is live!')
    navigate(listingPath(listing))
  }

  const Err = ({ k }: { k: string }) => (errors[k] ? <span className="field-error">{errors[k]}</span> : null)
  const num = (k: keyof Draft, label: string, placeholder = '') => (
    <label>
      {label}
      <input inputMode="numeric" value={d[k] as string} placeholder={placeholder} onChange={(e) => set(k, e.target.value.replace(/\D/g, '') as never)} />
      <Err k={k} />
    </label>
  )

  return (
    <div className="container page-sell">
      <div className="sell-head">
        <h1>{editing ? 'Edit advert' : 'Post a property'}</h1>
        <p className="muted">Free to post. Clear photos and an honest price get the most calls.</p>
      </div>

      <ol className="stepper">
        {STEPS.map((s, i) => (
          <li key={s} className={i === step ? 'on' : i < step ? 'done' : ''}>
            <button onClick={() => i < step && setStep(i)} disabled={i > step}>
              <span>{i < step ? <Check size={14} /> : i + 1}</span>
              <em>{s}</em>
            </button>
          </li>
        ))}
      </ol>
      <p className="step-label">
        Step {step + 1} of {STEPS.length} · <strong>{STEPS[step]}</strong>
      </p>

      <div className="card sell-card">
        {step === 0 && (
          <div className="form">
            <h2>What are you posting?</h2>
            <div className="cat-pick">
              {CATEGORIES.map((c) => {
                const Icon = CATEGORY_ICONS[c.slug]
                return (
                  <button
                    key={c.slug}
                    type="button"
                    className={`cat-opt g-${c.group} ${d.category === c.slug ? 'on' : ''}`}
                    aria-pressed={d.category === c.slug}
                    onClick={() => {
                      set('category', c.slug)
                      set('priceUnit', defaultUnit(c.slug))
                      if (!c.types.includes(d.propertyType)) set('propertyType', '')
                    }}
                  >
                    <span className="cat-opt-icon">
                      <Icon size={20} />
                    </span>
                    {d.category === c.slug && (
                      <span className="cat-opt-check" aria-hidden>
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                    <strong>
                      <span className="hide-sm">{c.name}</span>
                      <span className="show-sm">{c.short}</span>
                    </strong>
                    <small>{c.blurb}</small>
                  </button>
                )
              })}
            </div>
            <Err k="category" />
            <div className="form-row pair">
              <label>
                State
                <select
                  value={stateOfCity(d.city)?.slug ?? ''}
                  onChange={(e) => {
                    const st = stateBySlug(e.target.value)
                    if (!st) return
                    set('city', st.cities[0]!)
                    set('area', '')
                  }}
                >
                  {STATES.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                City / town
                <select value={d.city} onChange={(e) => (set('city', e.target.value), set('area', ''))}>
                  {stateOfCity(d.city)?.cities.map((slug) => (
                    <option key={slug} value={slug}>
                      {cityBySlug(slug)?.name}
                    </option>
                  ))}
                </select>
                <Err k="city" />
              </label>
            </div>
            <label>
              Area / neighbourhood
              <select value={d.area} onChange={(e) => set('area', e.target.value)}>
                <option value="">Select area</option>
                {city?.areas.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
              <Err k="area" />
            </label>
            <label>
              Street address <small className="muted">(optional — only shown as approximate)</small>
              <input value={d.address} onChange={(e) => set('address', e.target.value)} placeholder="e.g. 12 Okporo Road" />
            </label>
          </div>
        )}

        {step === 1 && cat && (
          <div className="form">
            <h2>{cat.name} details</h2>
            <div className="field">
              <span className="field-label">Property type</span>
              <div className="chip-pick">
                {cat.types.map((t) => (
                  <button type="button" key={t} className={`chip ${d.propertyType === t ? 'on' : ''}`} onClick={() => set('propertyType', t)}>
                    {t}
                  </button>
                ))}
              </div>
              <Err k="propertyType" />
            </div>
            <div className="form-row three">
              {residential && num('bedrooms', 'Bedrooms', 'e.g. 3')}
              {residential && num('bathrooms', 'Bathrooms', 'e.g. 3')}
              {!isLand && num('toilets', 'Toilets', 'e.g. 4')}
              {!isLand && num('parking', 'Parking spaces', 'e.g. 2')}
              {isLand && num('plots', 'Number of plots', 'e.g. 2')}
              {num('sizeSqm', 'Size (sqm)', 'e.g. 465')}
            </div>
            {!isLand && (
              <div className="form-row pair">
                <label>
                  Furnishing
                  <select value={d.furnishing} onChange={(e) => set('furnishing', e.target.value as Furnishing)}>
                    <option value="">Select</option>
                    {FURNISHING.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Condition
                  <select value={d.condition} onChange={(e) => set('condition', e.target.value as Condition)}>
                    <option value="">Select</option>
                    {CONDITIONS.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            {(isLand || cat.deal === 'sale') && (
              <div className="form-row">
                <label>
                  Title document
                  <select value={d.document} onChange={(e) => set('document', e.target.value)}>
                    <option value="">Select</option>
                    {LAND_DOCUMENTS.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Estate name <small className="muted">(optional)</small>
                  <input value={d.estate} onChange={(e) => set('estate', e.target.value)} placeholder="e.g. Palm View Estate" />
                </label>
              </div>
            )}
            <div className="field">
              <span className="field-label">{isLand ? 'Land features' : 'Facilities'}</span>
              <div className="chip-pick">
                {facilityOptions
                  .filter((x, i) => allFacilities || i < 8 || d.facilities.includes(x))
                  .map((x) => {
                    const on = d.facilities.includes(x)
                    return (
                      <button type="button" key={x} className={`chip ${on ? 'on' : ''}`} onClick={() => set('facilities', on ? d.facilities.filter((y) => y !== x) : [...d.facilities, x])}>
                        {on && <Check size={13} />} {x}
                      </button>
                    )
                  })}
              </div>
              {facilityOptions.length > 8 && (
                <button type="button" className="link-btn" onClick={() => setAllFacilities((v) => !v)}>
                  {allFacilities ? 'Show fewer' : `Show all ${facilityOptions.length}`}
                </button>
              )}
            </div>
            <label>
              Advert title
              <input value={d.title} maxLength={90} onChange={(e) => set('title', e.target.value)} placeholder={suggestedTitle || 'e.g. Newly built 3 bedroom flat in Woji'} />
              <span className="field-hint">
                {d.title.length}/90
                {suggestedTitle && !d.title && (
                  <button type="button" className="link-btn" onClick={() => set('title', suggestedTitle)}>
                    Use “{suggestedTitle}”
                  </button>
                )}
              </span>
              <Err k="title" />
            </label>
            <label>
              Description
              <textarea rows={7} value={d.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe the rooms, finishing, water and light, road access, documents, inspection days…" />
              <span className="field-hint">{d.description.length} characters</span>
              <Err k="description" />
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="form">
            <h2>Photos</h2>
            <p className="muted">Add up to 10 photos. The first photo is the cover. Landscape shots in daylight work best.</p>
            <div className="photo-grid">
              {d.images.map((src, i) => (
                <div key={i} className={`photo ${i === 0 ? 'cover' : ''}`}>
                  <Img src={src} alt={`Photo ${i + 1}`} width={300} />
                  {i === 0 && <span className="cover-tag">Cover</span>}
                  <div className="photo-actions">
                    {i > 0 && (
                      <button type="button" onClick={() => set('images', [src, ...d.images.filter((_, k) => k !== i)])} aria-label="Make cover photo" title="Make cover">
                        <Star size={15} />
                      </button>
                    )}
                    <button type="button" onClick={() => set('images', d.images.filter((_, k) => k !== i))} aria-label="Remove photo" title="Remove">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
              {d.images.length < 10 && (
                <button type="button" className="photo add" onClick={() => fileRef.current?.click()} disabled={busy}>
                  <ImagePlus size={28} />
                  <span>{busy ? 'Processing…' : 'Add photos'}</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => (addFiles(e.target.files), (e.target.value = ''))} />
            <Err k="images" />
          </div>
        )}

        {step === 3 && cat && (
          <div className="form">
            <h2>Price & contact</h2>
            <div className="form-row pair">
              <label>
                Price (₦)
                <input inputMode="numeric" value={d.price ? Number(d.price).toLocaleString() : ''} onChange={(e) => set('price', e.target.value.replace(/\D/g, ''))} placeholder="e.g. 1,500,000" />
                <Err k="price" />
              </label>
              <label>
                Price is
                <select value={d.priceUnit} onChange={(e) => set('priceUnit', e.target.value as PriceUnit)}>
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u === 'total' ? 'Total / outright' : u}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="check-row">
              <input type="checkbox" checked={d.negotiable} onChange={(e) => set('negotiable', e.target.checked)} />
              <span>Price is negotiable</span>
            </label>
            {cat.deal !== 'sale' || isLand ? (
              <div className="form-row three">
                {num('agentFee', 'Agency fee (%)', 'e.g. 10')}
                {num('cautionFee', 'Caution / deposit (₦)', 'optional')}
                {!isLand && num('serviceCharge', 'Service charge / yr (₦)', 'optional')}
              </div>
            ) : (
              <div className="form-row three">{num('agentFee', 'Agency fee (%)', 'e.g. 5')}</div>
            )}
            <hr />
            <div className="form-row">
              <label>
                Your name
                <input value={d.name} onChange={(e) => set('name', e.target.value)} placeholder="Name buyers will see" />
                <Err k="name" />
              </label>
              <label>
                Phone number
                <input value={d.phone} inputMode="tel" onChange={(e) => set('phone', e.target.value)} placeholder="0803 000 0000" />
                <Err k="phone" />
              </label>
            </div>
            {!user && <p className="muted small">We'll create your seller profile with these details when you publish.</p>}
          </div>
        )}

        {step === 4 && cat && (
          <div className="review-step">
            <h2>Review your advert</h2>
            <div className="review-grid">
              <Img src={d.images[0]} alt="Cover" width={600} />
              <div>
                <div className="price-big">
                  {naira(Number(d.price) || 0)} <small>{unitLabel(d.priceUnit, d.category)}</small>
                </div>
                <h3>{d.title}</h3>
                <p className="muted">
                  {cat.name} · {d.propertyType} · {d.area}, {city?.name}
                </p>
                <ul className="review-list">
                  {d.bedrooms && <li>{d.bedrooms} bedrooms</li>}
                  {d.bathrooms && <li>{d.bathrooms} bathrooms</li>}
                  {d.plots && <li>{d.plots} plots</li>}
                  {d.sizeSqm && <li>{Number(d.sizeSqm).toLocaleString()} sqm</li>}
                  {d.furnishing && <li>{d.furnishing}</li>}
                  {d.document && <li>{d.document}</li>}
                  <li>{d.images.length} photos</li>
                </ul>
                <p className="review-desc">{d.description}</p>
              </div>
            </div>
            <p className="muted small">
              By publishing you confirm the property exists, you are authorised to advertise it and the details are accurate. See our <Link to="/terms">terms</Link>.
            </p>
          </div>
        )}

        <div className="sell-nav">
          {step > 0 ? (
            <button className="btn btn-ghost" onClick={back}>
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={next} disabled={busy}>
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <button className="btn btn-accent lg" onClick={publish}>
              {editing ? 'Save changes' : 'Publish advert'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
