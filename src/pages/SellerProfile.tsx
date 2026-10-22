import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Calendar, MapPin, MessageCircle, Phone, ShieldCheck } from 'lucide-react'
import { REVIEWS, sellerById } from '../data/sellers'
import { CATEGORIES, categoryBySlug } from '../data/categories'
import { cityName } from '../data/locations'
import { useStore } from '../lib/store'
import { countBy, sortListings } from '../lib/filters'
import { maskPhone, yearsOn } from '../lib/format'
import { ListingCard } from '../components/ListingCard'
import { Avatar, Breadcrumbs, Stars, VerifiedBadge } from '../components/ui'
import NotFound from './NotFound'

export default function SellerProfile() {
  const { id } = useParams()
  const seller = sellerById(id)
  const { listings, openThread } = useStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'ads' | 'reviews' | 'about'>('ads')
  const [cat, setCat] = useState('')
  const [phone, setPhone] = useState(false)
  const ads = useMemo(() => sortListings(listings.filter((l) => l.sellerId === id && l.status === 'active'), 'newest'), [listings, id])
  const counts = useMemo(() => countBy(ads, (l) => l.category), [ads])
  if (!seller) return <NotFound />
  const shown = cat ? ads.filter((l) => l.category === cat) : ads

  const chat = () => {
    if (!ads[0]) return
    navigate(`/messages/${openThread(ads[0].id, seller.id)}`)
  }

  return (
    <div className="container page-seller">
      <Breadcrumbs items={[{ label: 'House4Rent', to: '/' }, { label: 'Trusted agents', to: '/agents' }, { label: seller.name }]} />
      <section className="card seller-hero">
        <Avatar name={seller.name} color={seller.color} size={88} />
        <div className="seller-hero-info">
          <h1>{seller.name}</h1>
          <div className="seller-sub">
            <VerifiedBadge seller={seller} />
            {seller.enterprise && <span className="badge badge-enterprise">Enterprise</span>}
            <span className="badge badge-years">{seller.type}</span>
          </div>
          <div className="seller-facts">
            <span>
              <Stars value={seller.rating} /> {seller.rating.toFixed(1)} ({seller.reviews} reviews)
            </span>
            <span>
              <Calendar size={15} /> {yearsOn(seller.joinedYear)}
            </span>
            <span>
              <MapPin size={15} /> {cityName(seller.city)}
            </span>
            <span className="muted">{seller.responseTime}</span>
          </div>
        </div>
        <div className="seller-hero-cta">
          {phone ? (
            <a className="btn btn-primary" href={`tel:${seller.phone.replace(/\s/g, '')}`}>
              <Phone size={16} /> {seller.phone}
            </a>
          ) : (
            <button className="btn btn-primary" onClick={() => setPhone(true)}>
              <Phone size={16} /> Show contact <span className="phone-mask">{maskPhone(seller.phone)}</span>
            </button>
          )}
          <button className="btn btn-outline-brand" onClick={chat} disabled={!ads.length}>
            <MessageCircle size={16} /> Chat
          </button>
        </div>
      </section>

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'ads'} className={tab === 'ads' ? 'on' : ''} onClick={() => setTab('ads')}>
          Adverts <small>{ads.length}</small>
        </button>
        <button role="tab" aria-selected={tab === 'reviews'} className={tab === 'reviews' ? 'on' : ''} onClick={() => setTab('reviews')}>
          Feedback <small>{seller.reviews}</small>
        </button>
        <button role="tab" aria-selected={tab === 'about'} className={tab === 'about' ? 'on' : ''} onClick={() => setTab('about')}>
          About
        </button>
      </div>

      {tab === 'ads' && (
        <>
          <div className="chip-row">
            <button className={`chip ${!cat ? 'on' : ''}`} onClick={() => setCat('')}>
              All <small>{ads.length}</small>
            </button>
            {CATEGORIES.filter((c) => counts.get(c.slug)).map((c) => (
              <button key={c.slug} className={`chip ${cat === c.slug ? 'on' : ''}`} onClick={() => setCat(c.slug)}>
                {c.short} <small>{counts.get(c.slug)}</small>
              </button>
            ))}
          </div>
          <div className="card-grid four">
            {shown.map((l) => (
              <ListingCard key={l.id} l={l} />
            ))}
          </div>
        </>
      )}

      {tab === 'reviews' && (
        <div className="reviews">
          {REVIEWS.slice(0, Math.min(REVIEWS.length, Math.max(2, Math.ceil(seller.reviews / 40)))).map((r) => (
            <div key={r.name} className="card review">
              <div className="review-head">
                <strong>{r.name}</strong>
                <Stars value={r.rating} />
                <small className="muted">{r.ago}</small>
              </div>
              <p>{r.text}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'about' && (
        <div className="card about">
          <p>{seller.bio}</p>
          <ul className="about-list">
            <li>
              <ShieldCheck size={16} /> {seller.verified ? 'Identity and business details verified by House4Rent.ng' : 'Identity not yet verified — take extra care'}
            </li>
            <li>
              <Calendar size={16} /> Member since {seller.joinedYear}
            </li>
            <li>
              <MapPin size={16} /> Mostly lists in {cityName(seller.city)}
              {ads[0] ? ` — ${categoryBySlug(ads[0].category)?.name}` : ''}
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
