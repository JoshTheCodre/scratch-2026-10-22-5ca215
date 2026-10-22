import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  BadgeCheck, Briefcase, Building, Building2, Castle, CheckCircle2, ChevronRight, Crown, DoorClosed, DoorOpen, Fence, Fuel,
  HardHat, Heart, Home, Hotel, House, Info, KeyRound, LandPlot, Laptop, Layers, PartyPopper, Presentation, School, ShieldCheck,
  Sofa, Sprout, Star, Store, Tent, Tractor, Trees, Warehouse, X, BedDouble, type LucideIcon,
} from 'lucide-react'
import type { CategorySlug, Seller, Tier } from '../types'
import { imgUrl, PLACEHOLDER } from '../data/images'
import { initials } from '../lib/format'
import { useStore } from '../lib/store'

export const CATEGORY_ICONS: Record<CategorySlug, LucideIcon> = {
  'houses-apartments-for-rent': KeyRound,
  'houses-apartments-for-sale': Home,
  'land-plots-for-sale': LandPlot,
  'land-plots-for-rent': Tractor,
  'short-let': BedDouble,
  'new-builds': HardHat,
  'commercial-property-for-rent': Store,
  'commercial-property-for-sale': Building,
  'event-centres-venues': PartyPopper,
}

const TYPE_ICONS: Record<string, LucideIcon> = {
  'Self Contain': DoorOpen,
  'Mini Flat': DoorClosed,
  'Room & Parlour': Sofa,
  'Studio Apartment': Sofa,
  Apartment: Building2,
  Bungalow: House,
  Duplex: Home,
  'Detached Duplex': Home,
  'Semi-Detached Duplex': Home,
  'Terraced Duplex': Layers,
  'Block of Flats': Building2,
  Mansion: Castle,
  Penthouse: Crown,
  'Residential Land': LandPlot,
  'Commercial Land': LandPlot,
  'Mixed-Use Land': LandPlot,
  'Estate Plot': Fence,
  Farmland: Sprout,
  'Open Yard': Trees,
  'Office Space': Briefcase,
  Shop: Store,
  Warehouse: Warehouse,
  Plaza: Building,
  'Filling Station': Fuel,
  Hotel: Hotel,
  'School Building': School,
  'Event Hall': PartyPopper,
  'Conference Room': Presentation,
  'Co-working Space': Laptop,
  'Outdoor Venue': Tent,
}

export const typeIcon = (type: string): LucideIcon => TYPE_ICONS[type] ?? Home

export function Img({ src, alt, width = 600, className }: { src?: string; alt: string; width?: number; className?: string }) {
  const [failed, setFailed] = useState(false)
  return (
    <img
      className={className}
      src={failed || !src ? PLACEHOLDER : imgUrl(src, width)}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <span className="stars" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= Math.round(value) ? 'on' : ''} fill={i <= Math.round(value) ? 'currentColor' : 'none'} />
      ))}
    </span>
  )
}

export function Avatar({ name, color, size = 44 }: { name: string; color: string; size?: number }) {
  return (
    <span className="avatar" style={{ background: color, width: size, height: size, fontSize: size * 0.38 }}>
      {initials(name)}
    </span>
  )
}

export function VerifiedBadge({ seller, compact }: { seller?: Seller; compact?: boolean }) {
  if (!seller?.verified) return null
  return (
    <span className="badge badge-verified" title="Seller identity verified">
      <BadgeCheck size={13} /> {compact ? 'Verified' : 'Verified ID'}
    </span>
  )
}

const TIER_LABEL: Record<Tier, string> = { featured: 'Featured', top: 'Top', boost: 'Boosted' }

export function TierTag({ tier }: { tier?: Tier }) {
  if (!tier) return null
  return <span className={`tier tier-${tier}`}>{TIER_LABEL[tier]}</span>
}

export function SaveButton({ id, variant = 'float' }: { id: string; variant?: 'float' | 'inline' }) {
  const { saved, toggleSave } = useStore()
  const on = saved.includes(id)
  return (
    <button
      className={`save-btn save-${variant} ${on ? 'on' : ''}`}
      aria-pressed={on}
      aria-label={on ? 'Remove from saved' : 'Save advert'}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleSave(id)
      }}
    >
      <Heart size={variant === 'float' ? 18 : 20} fill={on ? 'currentColor' : 'none'} />
      {variant === 'inline' && <span>{on ? 'Saved' : 'Save'}</span>}
    </button>
  )
}

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {items.map((it, i) => (
        <span key={i} className="crumb">
          {i > 0 && <ChevronRight size={13} className="crumb-sep" />}
          {it.to ? <Link to={it.to}>{it.label}</Link> : <span aria-current="page">{it.label}</span>}
        </span>
      ))}
    </nav>
  )
}

export function EmptyState({ icon: Icon = Info, title, text, action }: { icon?: LucideIcon; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon size={28} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  )
}

export const SAFETY_TIPS = [
  'Never pay for an inspection or "form" before seeing the property.',
  'Bring a friend or family member along to every viewing.',
  'Check that the property matches the photos and description.',
  'Only pay once you can move in or take possession.',
  'Verify title documents at the land registry or with your lawyer.',
  'Confirm the account name belongs to the owner or registered agency.',
]

export function SafetyTips({ compact }: { compact?: boolean }) {
  return (
    <div className="card safety">
      <h4>
        <ShieldCheck size={18} /> Safety tips
      </h4>
      <ul>
        {(compact ? SAFETY_TIPS.slice(0, 4) : SAFETY_TIPS).map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  )
}

export function Toasts() {
  const { toasts } = useStore()
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.tone}`}>
          {t.tone === 'warn' ? <Info size={16} /> : <CheckCircle2 size={16} />} {t.text}
        </div>
      ))}
    </div>
  )
}

export function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="House4Rent.ng home">
      <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden>
        <rect width="32" height="32" rx="8" fill="#fff" />
        <path d="M8 15.5 16 9l8 6.5V24a1 1 0 0 1-1 1h-4.5v-5.5h-5V25H9a1 1 0 0 1-1-1z" fill="var(--brand)" />
        <circle cx="16" cy="16" r="1.6" fill="var(--accent)" />
      </svg>
      <span className="logo-word">
        House<b>4</b>Rent<small>.ng</small>
      </span>
    </Link>
  )
}
