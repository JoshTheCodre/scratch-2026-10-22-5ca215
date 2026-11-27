import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Booking, Listing, Place, Thread, User } from '../types'
import { SEED_LISTINGS } from '../data/listings'
import { RETIRED_CATEGORIES } from '../data/categories'
import { sellerById } from '../data/sellers'
import { bookingDateText } from './inspection'

// Client-side store persisted to localStorage. Swap these actions for API calls later.

const KEY = 'h4r:v1:'

function load<T>(name: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(KEY + name)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function persist(name: string, value: unknown) {
  try {
    localStorage.setItem(KEY + name, JSON.stringify(value))
  } catch {
    // Storage full or blocked — state still works for this visit.
  }
}

function usePersisted<T>(name: string, fallback: T, migrate?: (value: T) => T) {
  const [value, setValue] = useState<T>(() => {
    const loaded = load(name, fallback)
    return migrate ? migrate(loaded) : loaded
  })
  useEffect(() => {
    persist(name, value)
  }, [name, value])
  return [value, setValue] as const
}

export interface Toast {
  id: number
  text: string
  tone?: 'ok' | 'warn'
}

interface Store {
  listings: Listing[]
  byId: (id?: string) => Listing | undefined
  user: User | null
  login: (u: Omit<User, 'sellerId'>) => void
  logout: () => void
  saved: string[]
  toggleSave: (id: string) => void
  myAds: Listing[]
  addAd: (l: Listing) => void
  updateAd: (id: string, patch: Partial<Listing>) => void
  removeAd: (id: string) => void
  threads: Thread[]
  openThread: (listingId: string, sellerId: string) => string
  sendMessage: (threadId: string, text: string) => void
  markRead: (threadId: string) => void
  recent: string[]
  addRecent: (id: string) => void
  toasts: Toast[]
  toast: (text: string, tone?: Toast['tone']) => void
  places: Place[]
  savePlace: (p: Place) => void
  removePlace: (id: string) => void
  bookings: Booking[]
  bookInspection: (b: Omit<Booking, 'id' | 'status' | 'createdAt'>) => Booking
  cancelBooking: (id: string) => void
}

// Ads saved before "New Builds" and "Commercial Property for Sale" were folded into
// "Houses & Properties For Sale" move to that category.
const migrateAds = (ads: Listing[]) =>
  ads.map((a) => (RETIRED_CATEGORIES[a.category] ? { ...a, category: RETIRED_CATEGORIES[a.category]!.to } : a))

const Ctx = createContext<Store | null>(null)

const AUTO_REPLIES = [
  'Hello! Yes, it is still available. When would you like to come for inspection?',
  'Thanks for reaching out. The price is slightly negotiable after inspection.',
  'Good day. I can show you the place tomorrow between 10am and 4pm. Does that work?',
  'Noted. Please share your phone number and I will call you shortly.',
]

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = usePersisted<User | null>('user', null)
  const [saved, setSaved] = usePersisted<string[]>('saved', [])
  const [myAds, setMyAds] = usePersisted<Listing[]>('myAds', [], migrateAds)
  const [threads, setThreads] = usePersisted<Thread[]>('threads', [])
  const [recent, setRecent] = usePersisted<string[]>('recent', [])
  const [places, setPlaces] = usePersisted<Place[]>('places', [])
  const [bookings, setBookings] = usePersisted<Booking[]>('bookings', [])
  // Latest bookings for timers, so a confirmation never lands on a cancelled booking.
  const bookingsRef = useRef(bookings)
  bookingsRef.current = bookings
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastId = useRef(0)

  const listings = useMemo(() => [...myAds, ...SEED_LISTINGS], [myAds])
  const index = useMemo(() => new Map(listings.map((l) => [l.id, l])), [listings])
  const byId = useCallback((id?: string) => (id ? index.get(id) : undefined), [index])

  const toast = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    const id = ++toastId.current
    setToasts((t) => [...t, { id, text, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  const login = useCallback((u: Omit<User, 'sellerId'>) => setUser({ ...u, sellerId: 'me' }), [setUser])
  const logout = useCallback(() => setUser(null), [setUser])

  const toggleSave = useCallback(
    (id: string) => {
      setSaved((s) => {
        const has = s.includes(id)
        toast(has ? 'Removed from saved' : 'Saved — find it under Saved adverts')
        return has ? s.filter((x) => x !== id) : [id, ...s]
      })
    },
    [setSaved, toast],
  )

  const addAd = useCallback((l: Listing) => setMyAds((a) => [l, ...a]), [setMyAds])
  const updateAd = useCallback((id: string, patch: Partial<Listing>) => setMyAds((a) => a.map((l) => (l.id === id ? { ...l, ...patch } : l))), [setMyAds])
  const removeAd = useCallback((id: string) => setMyAds((a) => a.filter((l) => l.id !== id)), [setMyAds])

  const openThread = useCallback(
    (listingId: string, sellerId: string) => {
      const existing = threads.find((t) => t.listingId === listingId)
      if (existing) return existing.id
      const id = `t${Date.now().toString(36)}`
      setThreads((ts) => [{ id, listingId, sellerId, messages: [], unread: 0 }, ...ts])
      return id
    },
    [threads, setThreads],
  )

  const sendMessage = useCallback(
    (threadId: string, text: string) => {
      const at = new Date().toISOString()
      setThreads((ts) => ts.map((t) => (t.id === threadId ? { ...t, messages: [...t.messages, { from: 'me', text, at }] } : t)))
      setTimeout(() => {
        const reply = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)]!
        setThreads((ts) =>
          ts.map((t) => (t.id === threadId ? { ...t, unread: t.unread + 1, messages: [...t.messages, { from: 'them', text: reply, at: new Date().toISOString() }] } : t)),
        )
      }, 1400)
    },
    [setThreads],
  )

  const markRead = useCallback((threadId: string) => setThreads((ts) => ts.map((t) => (t.id === threadId && t.unread ? { ...t, unread: 0 } : t))), [setThreads])

  const savePlace = useCallback(
    (p: Place) => setPlaces((ps) => (ps.some((x) => x.id === p.id) ? ps.map((x) => (x.id === p.id ? p : x)) : [...ps, p])),
    [setPlaces],
  )
  const removePlace = useCallback((id: string) => setPlaces((ps) => ps.filter((x) => x.id !== id)), [setPlaces])

  // Booking adds a note to the chat with the seller; the seller confirms a moment later.
  const bookInspection = useCallback(
    (input: Omit<Booking, 'id' | 'status' | 'createdAt'>) => {
      const booking: Booking = { ...input, id: `b${Date.now().toString(36)}`, status: 'requested', createdAt: new Date().toISOString() }
      const when = bookingDateText(booking, true)
      setBookings((bs) => [
        booking,
        // Rescheduling replaces any earlier active booking for the same advert.
        ...bs.map((b) => (b.listingId === input.listingId && b.status !== 'cancelled' ? { ...b, status: 'cancelled' as const } : b)),
      ])
      const at = new Date().toISOString()
      const moving = bookings.some((b) => b.listingId === input.listingId && b.status !== 'cancelled')
      const note = `${moving ? 'Hello, I need to move my inspection to' : 'Hello, I just booked an inspection for'} ${when}.${input.note ? ` ${input.note}` : ''}`
      setThreads((ts) => {
        const existing = ts.find((t) => t.listingId === input.listingId)
        if (existing) return ts.map((t) => (t === existing ? { ...t, messages: [...t.messages, { from: 'me' as const, text: note, at }] } : t))
        return [{ id: `t${Date.now().toString(36)}`, listingId: input.listingId, sellerId: input.sellerId, messages: [{ from: 'me' as const, text: note, at }], unread: 0 }, ...ts]
      })
      setTimeout(() => {
        if (bookingsRef.current.find((b) => b.id === booking.id)?.status !== 'requested') return
        setBookings((bs) => bs.map((b) => (b.id === booking.id && b.status === 'requested' ? { ...b, status: 'confirmed' } : b)))
        const reply = `Confirmed! See you on ${when}. Please call me when you get to the street and I will direct you.`
        setThreads((ts) =>
          ts.map((t) => (t.listingId === input.listingId ? { ...t, unread: t.unread + 1, messages: [...t.messages, { from: 'them' as const, text: reply, at: new Date().toISOString() }] } : t)),
        )
        const seller = sellerById(input.sellerId)
        toast(`${seller ? seller.name : 'The owner'} confirmed your inspection`)
      }, 2500)
      return booking
    },
    [bookings, setBookings, setThreads, toast],
  )
  // Cancelling tells the owner in the chat so they can offer the slot to someone else.
  const cancelBooking = useCallback(
    (id: string) => {
      const b = bookings.find((x) => x.id === id)
      setBookings((bs) => bs.map((x) => (x.id === id ? { ...x, status: 'cancelled' } : x)))
      if (!b) return
      const text = `Sorry, I have to cancel my inspection on ${bookingDateText(b, true)}. Thank you.`
      setThreads((ts) => ts.map((t) => (t.listingId === b.listingId ? { ...t, messages: [...t.messages, { from: 'me' as const, text, at: new Date().toISOString() }] } : t)))
    },
    [bookings, setBookings, setThreads],
  )

  const addRecent = useCallback((id: string) => setRecent((r) => [id, ...r.filter((x) => x !== id)].slice(0, 12)), [setRecent])

  const value: Store = {
    listings, byId, user, login, logout, saved, toggleSave, myAds, addAd, updateAd, removeAd,
    threads, openThread, sendMessage, markRead, recent, addRecent, toasts, toast,
    places, savePlace, removePlace, bookings, bookInspection, cancelBooking,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore must be used inside StoreProvider')
  return s
}
