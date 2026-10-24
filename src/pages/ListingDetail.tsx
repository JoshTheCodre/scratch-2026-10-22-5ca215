import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Bath, BedDouble, Calculator, Car, Check, ChevronLeft, ChevronRight, LandPlot, Map as MapIcon, MapPin, MessageCircle, Phone, PhoneCall, Ruler, Share2, TrendingUp } from 'lucide-react'
import type { Listing } from '../types'
import { categoryBySlug } from '../data/categories'
import { cityName } from '../data/locations'
import { sellerById } from '../data/sellers'
import { useStore } from '../lib/store'
import { maskPhone, naira, nairaCompact, timeAgo, unitLabel, yearsOn } from '../lib/format'
import { Gallery } from '../components/Gallery'
import { ListingCard } from '../components/ListingCard'
import { Avatar, Fold, Modal, SafetyTips, SaveButton, Stars, VerifiedBadge, typeIcon } from '../components/ui'
import NotFound from './NotFound'

export default function ListingDetail() {
  const { id } = useParams()
  const { byId } = useStore()
  const l = byId(id)
  return l ? <Detail key={l.id} l={l} /> : <NotFound />
}

function Detail({ l }: { l: Listing }) {
  const { listings, addRecent, recent, byId, openThread, user, toast } = useStore()
  const navigate = useNavigate()
  const cat = categoryBySlug(l.category)!
  const seller = l.isUserAd
    ? { id: 'me', name: user?.name ?? 'You', type: 'Owner' as const, verified: false, enterprise: false, joinedYear: new Date().getFullYear(), rating: 0, reviews: 0, responseTime: 'Replies within a day', phone: user?.phone ?? '', color: 'var(--accent)', city: l.city, bio: '' }
    : sellerById(l.sellerId)!
  const [showPhone, setShowPhone] = useState(false)
  const [descOpen, setDescOpen] = useState(false)
  const [moreAttrs, setMoreAttrs] = useState(false)
  const [modal, setModal] = useState<null | 'callback' | 'report' | 'unavailable'>(null)
  const unit = unitLabel(l.priceUnit, l.category)
  const longDesc = l.description.length > 420 || l.description.split('\n').length > 9

  useEffect(() => {
    addRecent(l.id)
    document.title = `${l.title} — ${naira(l.price)} | House4Rent.ng`
    return () => {
      document.title = 'House4Rent.ng — Property for rent & sale in Nigeria'
    }
  }, [l.id, l.title, l.price, addRecent])

  const similar = useMemo(
    () =>
      listings
        .filter((x) => x.id !== l.id && x.status === 'active' && x.category === l.category && x.city === l.city)
        .sort((a, b) => Math.abs(Math.log(a.price / l.price)) - Math.abs(Math.log(b.price / l.price)))
        .slice(0, 4),
    [listings, l],
  )
  const recentItems = recent.filter((r) => r !== l.id).map((r) => byId(r)).filter(Boolean).slice(0, 4) as Listing[]

  const keyFacts = [
    { icon: typeIcon(l.propertyType), label: l.propertyType },
    l.bedrooms ? { icon: BedDouble, label: `${l.bedrooms} bed${l.bedrooms > 1 ? 's' : ''}` } : null,
    l.bathrooms ? { icon: Bath, label: `${l.bathrooms} bath${l.bathrooms > 1 ? 's' : ''}` } : null,
    l.plots ? { icon: LandPlot, label: `${l.plots} plot${l.plots > 1 ? 's' : ''}` } : null,
    l.sizeSqm ? { icon: Ruler, label: `${l.sizeSqm.toLocaleString()} sqm` } : null,
    l.parking ? { icon: Car, label: `${l.parking} parking` } : null,
  ].filter(Boolean) as { icon: typeof Car; label: string }[]

  const attrs: [string, string | number | undefined][] = [
    ['Address', l.address],
    ['Estate', l.estate],
    ['Condition', l.condition],
    ['Furnishing', l.furnishing],
    ['Toilets', l.toilets],
    ['Title document', l.document],
    ['Agency fee', l.agentFee ? `${l.agentFee}%` : undefined],
    ['Caution / deposit', l.cautionFee ? naira(l.cautionFee) : undefined],
    ['Service charge', l.serviceCharge ? `${naira(l.serviceCharge)} / yr` : undefined],
  ]
  const shownAttrs = attrs.filter(([, v]) => v !== undefined && v !== '')
  const visibleAttrs = moreAttrs ? shownAttrs : shownAttrs.slice(0, 6)

  const startChat = () => {
    const tid = openThread(l.id, seller.id)
    navigate(`/messages/${tid}`)
  }
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: l.title, url: location.href })
      else {
        await navigator.clipboard.writeText(location.href)
        toast('Link copied to clipboard')
      }
    } catch {
      /* user cancelled */
    }
  }
  const mapBox = `${l.lng - 0.012},${l.lat - 0.008},${l.lng + 0.012},${l.lat + 0.008}`
  const priceCheckUrl = `/price-check?city=${l.city}&category=${l.category}&type=${encodeURIComponent(l.propertyType)}${l.bedrooms ? `&beds=${l.bedrooms}` : ''}`
  const price = (
    <div className="price-big">
      {naira(l.price)} {unit && <small>{unit}</small>}
    </div>
  )

  return (
    <div className="container page-detail">
      <nav className="back-row">
        <Link to={`/${l.city}/${l.category}`} className="back-link">
          <ChevronLeft size={18} /> {cat.name} in {cityName(l.city)}
        </Link>
      </nav>

      <div className="detail-layout">
        <div className="detail-main">
          <Gallery images={l.images} title={l.title} />

          <section className="detail-head">
            <div className="detail-head-row">
              <div>
                {l.tier === 'featured' && <span className="flag">Featured</span>}
                <h1>{l.title}</h1>
                <p className="detail-sub">
                  <MapPin size={15} /> {l.area}, {cityName(l.city)} · {timeAgo(l.postedAt)} · {l.views.toLocaleString()} views
                </p>
              </div>
              <div className="detail-tools">
                <button className="icon-pill" onClick={share} aria-label="Share" title="Share">
                  <Share2 size={18} />
                </button>
                <SaveButton id={l.id} variant="inline" />
              </div>
            </div>
            <div className="detail-price-mobile">
              {price}
              {l.negotiable && <span className="tag">Negotiable</span>}
            </div>
            {l.status === 'unavailable' && <div className="notice warn">This advert is marked as no longer available.</div>}
            <div className="key-facts">
              {keyFacts.map(({ icon: Icon, label }) => (
                <span key={label} className="key-fact">
                  <Icon size={18} strokeWidth={1.7} /> {label}
                </span>
              ))}
            </div>
          </section>

          <section className="detail-section">
            <h2>About this property</h2>
            <div className={`description ${longDesc && !descOpen ? 'clamped' : ''}`}>
              <p>{l.description}</p>
            </div>
            {longDesc && (
              <button className="link-btn" onClick={() => setDescOpen((v) => !v)}>
                {descOpen ? 'Show less' : 'Read more'}
              </button>
            )}
          </section>

          {shownAttrs.length > 0 && (
            <section className="detail-section">
              <h2>Details</h2>
              <dl className="attr-grid">
                {visibleAttrs.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              {shownAttrs.length > 6 && (
                <button className="link-btn mt-sm" onClick={() => setMoreAttrs((v) => !v)}>
                  {moreAttrs ? 'Show less' : `Show all ${shownAttrs.length} details`}
                </button>
              )}
            </section>
          )}

          {l.facilities.length > 0 && (
            <section className="detail-section">
              <h2>{cat.group === 'land' ? 'Land features' : 'Facilities'}</h2>
              <ul className="facility-list">
                {l.facilities.map((x) => (
                  <li key={x}>
                    <Check size={16} /> {x}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="detail-folds">
            <CostCalculator l={l} />
            <Fold title="Location" icon={MapIcon} hint={`${l.area}, ${cityName(l.city)}`}>
              <p className="muted small">Approximate location. Confirm the exact address with the seller before inspection.</p>
              <iframe className="map" title="Map" loading="lazy" src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapBox}&layer=mapnik&marker=${l.lat},${l.lng}`} />
            </Fold>
          </div>
        </div>

        <aside className="detail-side">
          <section className="side-card">
            <div className="side-price">
              {price}
              {l.negotiable && <span className="tag">Negotiable</span>}
            </div>

            <div className="seller-row">
              <Avatar name={seller.name} color={seller.color} size={46} />
              <div>
                {l.isUserAd ? (
                  <strong>{seller.name}</strong>
                ) : (
                  <Link to={`/seller/${seller.id}`} className="seller-name">
                    {seller.name}
                  </Link>
                )}
                <div className="seller-sub">
                  <VerifiedBadge seller={seller} compact />
                  <span>{yearsOn(seller.joinedYear)}</span>
                </div>
                {seller.reviews > 0 && (
                  <div className="seller-rating">
                    <Stars value={seller.rating} size={12} /> {seller.rating.toFixed(1)} · {seller.reviews} reviews
                  </div>
                )}
              </div>
            </div>

            {l.isUserAd ? (
              <Link to="/my-ads" className="btn btn-primary block">
                Manage this advert
              </Link>
            ) : (
              <div className="side-actions">
                <ContactButton phone={seller.phone} shown={showPhone} onShow={() => setShowPhone(true)} />
                <button className="btn btn-soft block" onClick={startChat}>
                  <MessageCircle size={17} /> Chat with seller
                </button>
                <button className="link-btn center" onClick={() => setModal('callback')}>
                  <PhoneCall size={15} /> Request a call back
                </button>
              </div>
            )}
            <p className="side-note">{seller.responseTime}</p>

            <Link to={priceCheckUrl} className="price-check-link">
              <TrendingUp size={17} />
              <span>Compare with similar {l.bedrooms ? `${l.bedrooms}-bed ` : ''}listings</span>
              <ChevronRight size={16} />
            </Link>
          </section>

          <SafetyTips />

          <div className="side-links">
            {!l.isUserAd && (
              <>
                <button className="link-btn muted" onClick={() => setModal('unavailable')}>
                  Mark unavailable
                </button>
                <button className="link-btn muted" onClick={() => setModal('report')}>
                  Report
                </button>
              </>
            )}
            <Link to={`/sell?category=${l.category}`} className="link-btn muted">
              Post one like this
            </Link>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="block">
          <div className="block-head">
            <h2>Similar adverts</h2>
            <Link to={`/${l.city}/${l.category}`} className="see-all">
              See all <ChevronRight size={16} />
            </Link>
          </div>
          <div className="card-grid four">
            {similar.map((x) => (
              <ListingCard key={x.id} l={x} />
            ))}
          </div>
        </section>
      )}

      {recentItems.length > 0 && (
        <section className="block">
          <div className="block-head">
            <h2>Recently viewed</h2>
          </div>
          <div className="card-grid four">
            {recentItems.map((x) => (
              <ListingCard key={x.id} l={x} />
            ))}
          </div>
        </section>
      )}

      {!l.isUserAd && (
        <div className="mobile-cta">
          <a className="btn btn-soft" href={`tel:${seller.phone.replace(/\s/g, '')}`}>
            <Phone size={16} /> Call
          </a>
          <button className="btn btn-primary" onClick={startChat}>
            <MessageCircle size={16} /> Chat
          </button>
        </div>
      )}

      <CallbackModal open={modal === 'callback'} onClose={() => setModal(null)} sellerName={seller.name} />
      <ReportModal open={modal === 'report'} onClose={() => setModal(null)} />
      <Modal open={modal === 'unavailable'} onClose={() => setModal(null)} title="Mark as unavailable?">
        <p>Tell us this property has already been rented or sold. We'll confirm with the seller and hide it if it's no longer available.</p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setModal(null)}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setModal(null)
              toast('Thanks! We will check with the seller.')
            }}
          >
            Yes, it's unavailable
          </button>
        </div>
      </Modal>
    </div>
  )
}

function ContactButton({ phone, shown, onShow }: { phone: string; shown: boolean; onShow: () => void }) {
  if (shown)
    return (
      <a className="btn btn-primary block" href={`tel:${phone.replace(/\s/g, '')}`}>
        <Phone size={17} /> {phone}
      </a>
    )
  return (
    <button className="btn btn-primary block" onClick={onShow}>
      <Phone size={17} /> Show contact <span className="phone-mask">{maskPhone(phone)}</span>
    </button>
  )
}

function CostCalculator({ l }: { l: Listing }) {
  const cat = categoryBySlug(l.category)!
  const [deposit, setDeposit] = useState(30)
  const [rate, setRate] = useState(18)
  const [years, setYears] = useState(15)
  const [nights, setNights] = useState(3)
  const [plots, setPlots] = useState(l.plots ?? 1)

  if (l.priceUnit === 'per day') {
    const sub = l.price * nights
    const total = sub + (l.cautionFee ?? 0)
    return (
      <Fold title="Booking estimate" icon={Calculator} hint={`${nairaCompact(total)} for ${nights} ${cat.group === 'venue' ? 'day' : 'night'}${nights > 1 ? 's' : ''}`}>
        <label className="calc-row">
          <span>{cat.group === 'venue' ? 'Days' : 'Nights'}</span>
          <input type="number" min={1} max={60} value={nights} onChange={(e) => setNights(Math.max(1, Number(e.target.value) || 1))} />
        </label>
        <Rows rows={[[`${naira(l.price)} × ${nights}`, sub], ['Refundable caution', l.cautionFee ?? 0]]} total={total} totalLabel="Pay on check-in" />
      </Fold>
    )
  }

  if (l.priceUnit === 'per annum' || l.priceUnit === 'per month') {
    const rent = l.priceUnit === 'per month' ? l.price * 12 : l.price
    const agency = (rent * (l.agentFee ?? 0)) / 100
    const legal = l.agentFee ? rent * 0.1 : 0
    const rows: [string, number][] = [
      ['First year rent', rent],
      [`Agency fee (${l.agentFee ?? 0}%)`, agency],
      ['Legal / agreement (10%)', legal],
      ['Caution deposit', l.cautionFee ?? 0],
      ['Service charge', l.serviceCharge ?? 0],
    ]
    const total = rows.reduce((s, [, v]) => s + v, 0)
    return (
      <Fold title="Move-in cost" icon={Calculator} hint={`≈ ${nairaCompact(total)}`}>
        <Rows rows={rows.filter(([, v]) => v > 0)} total={total} totalLabel="Estimated total to move in" />
        <p className="muted small">Fees vary by agent. Always get a written breakdown before you pay.</p>
      </Fold>
    )
  }

  if (l.priceUnit === 'per plot') {
    const sub = l.price * plots
    const agency = (sub * (l.agentFee ?? 0)) / 100
    return (
      <Fold title="Land cost" icon={Calculator} hint={`≈ ${nairaCompact(sub + agency)}`}>
        <label className="calc-row">
          <span>Plots</span>
          <input type="number" min={1} max={l.plots ?? 50} value={plots} onChange={(e) => setPlots(Math.min(l.plots ?? 50, Math.max(1, Number(e.target.value) || 1)))} />
        </label>
        <Rows rows={[[`${naira(l.price)} × ${plots} plot${plots > 1 ? 's' : ''}`, sub], ...(agency ? ([[`Agency (${l.agentFee}%)`, agency]] as [string, number][]) : [])]} total={sub + agency} totalLabel="Estimated total" />
        <p className="muted small">Survey, documentation and development levies are usually extra.</p>
      </Fold>
    )
  }

  // Outright sale → mortgage estimate.
  const principal = l.price * (1 - deposit / 100)
  const r = rate / 100 / 12
  const n = years * 12
  const monthly = r === 0 ? principal / n : (principal * r) / (1 - Math.pow(1 + r, -n))
  return (
    <Fold title="Mortgage estimate" icon={Calculator} hint={`≈ ${nairaCompact(monthly)} / month`}>
      <div className="calc-sliders">
        <label>
          <span>
            Down payment <strong>{deposit}% · {nairaCompact((l.price * deposit) / 100)}</strong>
          </span>
          <input type="range" min={10} max={90} step={5} value={deposit} onChange={(e) => setDeposit(Number(e.target.value))} />
        </label>
        <label>
          <span>
            Interest rate <strong>{rate}% p.a.</strong>
          </span>
          <input type="range" min={6} max={30} step={0.5} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
        </label>
        <label>
          <span>
            Tenure <strong>{years} years</strong>
          </span>
          <input type="range" min={1} max={30} value={years} onChange={(e) => setYears(Number(e.target.value))} />
        </label>
      </div>
      <div className="calc-result">
        <span>Monthly repayment</span>
        <strong>{naira(monthly)}</strong>
        <small className="muted">
          Loan {naira(principal)} · total interest {nairaCompact(monthly * n - principal)}
        </small>
      </div>
      <p className="muted small">Indicative only. NHF loans start around 6%; commercial mortgages are typically higher.</p>
    </Fold>
  )
}

function Rows({ rows, total, totalLabel }: { rows: [string, number][]; total: number; totalLabel: string }) {
  return (
    <dl className="calc-rows">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{naira(v)}</dd>
        </div>
      ))}
      <div className="total">
        <dt>{totalLabel}</dt>
        <dd>{naira(total)}</dd>
      </div>
    </dl>
  )
}

function CallbackModal({ open, onClose, sellerName }: { open: boolean; onClose: () => void; sellerName: string }) {
  const { user, toast } = useStore()
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [when, setWhen] = useState('Anytime')
  const valid = name.trim().length > 1 && phone.replace(/\D/g, '').length >= 10
  return (
    <Modal open={open} onClose={onClose} title="Request a call back">
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault()
          if (!valid) return
          onClose()
          toast(`Request sent — ${sellerName} will call you back`)
        }}
      >
        <label>
          Your name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Phone number
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="0803 000 0000" required />
        </label>
        <label>
          Best time to call
          <select value={when} onChange={(e) => setWhen(e.target.value)}>
            <option>Anytime</option>
            <option>Morning (8am – 12pm)</option>
            <option>Afternoon (12pm – 4pm)</option>
            <option>Evening (4pm – 8pm)</option>
          </select>
        </label>
        <button className="btn btn-primary block" disabled={!valid}>
          Send request
        </button>
      </form>
    </Modal>
  )
}

const REPORT_REASONS = ['Scam or fraud', 'Already rented / sold', 'Wrong price', 'Wrong category or location', 'Fake photos', 'Duplicate advert', 'Other']

function ReportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useStore()
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  return (
    <Modal open={open} onClose={onClose} title="Report this advert">
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault()
          onClose()
          setReason('')
          setNote('')
          toast('Report received. Our team will review it within 24 hours.')
        }}
      >
        <div className="radio-stack">
          {REPORT_REASONS.map((r) => (
            <label key={r} className="radio-row">
              <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} />
              {r}
            </label>
          ))}
        </div>
        <label>
          Details (optional)
          <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tell us what happened" />
        </label>
        <button className="btn btn-danger block" disabled={!reason}>
          Send report
        </button>
      </form>
    </Modal>
  )
}
