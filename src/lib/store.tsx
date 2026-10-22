import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Listing, Thread, User } from '../types'
import { SEED_LISTINGS } from '../data/listings'

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

function usePersisted<T>(name: string, fallback: T) {
  const [value, setValue] = useState<T>(() => load(name, fallback))
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
}

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
  const [myAds, setMyAds] = usePersisted<Listing[]>('myAds', [])
  const [threads, setThreads] = usePersisted<Thread[]>('threads', [])
  const [recent, setRecent] = usePersisted<string[]>('recent', [])
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

  const addRecent = useCallback((id: string) => setRecent((r) => [id, ...r.filter((x) => x !== id)].slice(0, 12)), [setRecent])

  const value: Store = {
    listings, byId, user, login, logout, saved, toggleSave, myAds, addAd, updateAd, removeAd,
    threads, openThread, sendMessage, markRead, recent, addRecent, toasts, toast,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore must be used inside StoreProvider')
  return s
}
