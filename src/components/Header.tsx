import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useMatch, useNavigate, useSearchParams } from 'react-router-dom'
import { Award, Bookmark, ChevronDown, Heart, LayoutGrid, LogOut, Menu, MessageCircle, Plus, Search, TrendingUp, User, X } from 'lucide-react'
import { ALL_CATEGORIES, CATEGORIES, categoryBySlug, isCategorySlug } from '../data/categories'
import { ALL_CITIES, CITIES, DEFAULT_CITY, cityBySlug } from '../data/locations'
import { useStore } from '../lib/store'
import { Avatar, CATEGORY_ICONS, Logo } from './ui'

/** City + category of the current listings route, if we are on one. */
export function useListingScope() {
  const m = useMatch('/:city/:category')
  const city = m?.params.city ?? ''
  const category = m?.params.category ?? ''
  const valid = (city === ALL_CITIES || !!cityBySlug(city)) && (category === ALL_CATEGORIES || isCategorySlug(category))
  return valid ? { city, category } : null
}

export function Header() {
  const scope = useListingScope()
  const { user, logout, threads, saved } = useStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [sp] = useSearchParams()
  const [q, setQ] = useState(sp.get('q') ?? '')
  const [drawer, setDrawer] = useState(false)
  const [menu, setMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const unread = threads.reduce((n, t) => n + t.unread, 0)
  const city = scope?.city ?? DEFAULT_CITY
  const cat = categoryBySlug(scope?.category)

  useEffect(() => {
    setQ(sp.get('q') ?? '')
  }, [sp])
  useEffect(() => {
    setDrawer(false)
    setMenu(false)
  }, [pathname])
  useEffect(() => {
    if (!menu) return
    const close = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenu(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menu])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const target = scope ? `/${scope.city}/${scope.category}` : `/${ALL_CITIES}/${ALL_CATEGORIES}`
    const next = new URLSearchParams(scope ? sp : undefined)
    q.trim() ? next.set('q', q.trim()) : next.delete('q')
    next.delete('page')
    navigate(`${target}?${next.toString()}`)
  }

  // On narrow screens the search box lives in its own row (or the hero on the home page).
  const isHome = pathname === '/'
  // Chat and forms are focused tasks — they skip the search row.
  const showSubbar = !isHome && !['/messages', '/sell', '/login', '/register'].some((p) => pathname.startsWith(p))
  const focusSearch = () => {
    if (!isHome && !showSubbar) {
      navigate(`/${ALL_CITIES}/${ALL_CATEGORIES}`)
      setTimeout(() => document.querySelector<HTMLInputElement>('.sub-search input')?.focus(), 350)
      return
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setTimeout(() => document.querySelector<HTMLInputElement>(isHome ? '.hs-q input' : '.sub-search input')?.focus(), 300)
  }
  const placeholder = `Search in ${cat ? cat.short : 'Property'}`

  return (
    <>
      <header className="topbar">
        <div className="container topbar-inner">
          <button className="icon-btn" onClick={() => setDrawer(true)} aria-label="Open menu">
            <Menu size={24} />
          </button>
          <Logo />
          <form className="top-search" onSubmit={submit} role="search">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label="Search properties" />
            <button type="submit" aria-label="Search">
              <Search size={18} />
            </button>
          </form>
          <nav className="top-actions">
            <button className="top-icon search-toggle" onClick={focusSearch} aria-label="Search">
              <Search size={20} />
            </button>
            <NavLink to="/saved" className="top-icon saved-link" aria-label="Saved adverts" title="Saved adverts">
              <Heart size={20} />
              {saved.length > 0 && <span className="dot-count">{saved.length}</span>}
            </NavLink>
            <NavLink to="/messages" className="top-icon" aria-label="Messages" title="Messages">
              <MessageCircle size={20} />
              {unread > 0 && <span className="dot-count">{unread}</span>}
            </NavLink>
            {user ? (
              <div className="user-menu" ref={menuRef}>
                <button className="user-btn" onClick={() => setMenu((v) => !v)} aria-expanded={menu}>
                  <Avatar name={user.name} color="var(--accent)" size={30} />
                  <span className="hide-sm">{user.name.split(' ')[0]}</span>
                  <ChevronDown size={16} />
                </button>
                {menu && (
                  <div className="dropdown">
                    <div className="dropdown-head">
                      <strong>{user.name}</strong>
                      <small>{user.phone}</small>
                    </div>
                    <Link to="/my-ads"><LayoutGrid size={16} /> My adverts</Link>
                    <Link to="/saved"><Bookmark size={16} /> Saved adverts</Link>
                    <Link to="/messages"><MessageCircle size={16} /> Messages</Link>
                    <button onClick={logout}><LogOut size={16} /> Log out</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="auth-link hide-sm">
                Sign in
              </Link>
            )}
            <Link to="/sell" className="btn btn-accent sell-btn">
              <Plus size={18} />
              <span className="hide-sm">Post ad</span>
            </Link>
          </nav>
        </div>
      </header>

      {showSubbar && (
        <div className="subbar container">
          <form className="sub-search" onSubmit={submit} role="search">
            <Search size={18} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label="Search properties" enterKeyHint="search" />
            {q && (
              <button type="button" onClick={() => setQ('')} aria-label="Clear search">
                <X size={16} />
              </button>
            )}
          </form>
        </div>
      )}

      <div className={`drawer-backdrop ${drawer ? 'open' : ''}`} onClick={() => setDrawer(false)} />
      <aside className={`drawer ${drawer ? 'open' : ''}`} aria-hidden={!drawer}>
        <div className="drawer-head">
          <Logo />
          <button className="icon-btn" onClick={() => setDrawer(false)} aria-label="Close menu">
            <X size={22} />
          </button>
        </div>
        <div className="drawer-body">
          {user && (
            <div className="drawer-user">
              <Avatar name={user.name} color="var(--accent)" size={44} />
              <div>
                <strong>{user.name}</strong>
                <small>{user.phone}</small>
              </div>
            </div>
          )}
          {!user && (
            <div className="drawer-auth">
              <Link to="/login" className="btn btn-outline">Sign in</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </div>
          )}
          <p className="drawer-label">Categories</p>
          <Link to={`/${city}/${ALL_CATEGORIES}`} className="drawer-link">
            <LayoutGrid size={18} /> All property
          </Link>
          {CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICONS[c.slug]
            return (
              <Link key={c.slug} to={`/${city}/${c.slug}`} className="drawer-link">
                <Icon size={18} /> {c.name}
              </Link>
            )
          })}
          <p className="drawer-label">Cities</p>
          <div className="drawer-chips">
            {CITIES.map((c) => (
              <Link key={c.slug} to={`/${c.slug}/${scope?.category ?? ALL_CATEGORIES}`} className="chip">
                {c.name}
              </Link>
            ))}
          </div>
          <p className="drawer-label">Your account</p>
          <Link to="/saved" className="drawer-link">
            <Heart size={18} /> Saved adverts {saved.length > 0 && <span className="drawer-count">{saved.length}</span>}
          </Link>
          <Link to="/messages" className="drawer-link">
            <MessageCircle size={18} /> Messages {unread > 0 && <span className="drawer-count">{unread}</span>}
          </Link>
          <Link to="/my-ads" className="drawer-link"><User size={18} /> My adverts</Link>
          <p className="drawer-label">Tools</p>
          <Link to="/agents" className="drawer-link"><Award size={18} /> Trusted agents</Link>
          <Link to="/price-check" className="drawer-link"><TrendingUp size={18} /> Price check</Link>
          <Link to="/sell" className="btn btn-accent block mt">Post a property</Link>
          {user && (
            <button className="btn btn-ghost block mt" onClick={logout}>
              <LogOut size={17} /> Log out
            </button>
          )}
        </div>
      </aside>
    </>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <h5>About House4Rent.ng</h5>
          <Link to="/about">About us</Link>
          <Link to="/terms">Terms &amp; conditions</Link>
          <Link to="/privacy">Privacy policy</Link>
          <Link to="/safety">Safety tips</Link>
        </div>
        <div>
          <h5>Browse</h5>
          {CATEGORIES.slice(0, 6).map((c) => (
            <Link key={c.slug} to={`/${ALL_CITIES}/${c.slug}`}>
              {c.name}
            </Link>
          ))}
        </div>
        <div>
          <h5>Cities</h5>
          {CITIES.map((c) => (
            <Link key={c.slug} to={`/${c.slug}/${ALL_CATEGORIES}`}>
              Property in {c.name}
            </Link>
          ))}
        </div>
        <div>
          <h5>For sellers</h5>
          <Link to="/sell">Post a property</Link>
          <Link to="/my-ads">Manage adverts</Link>
          <Link to="/agents">Trusted agents</Link>
          <Link to="/price-check">Price check</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} House4Rent.ng. Homes, land &amp; spaces across Nigeria.</span>
        <span>Demo build — listings are sample data.</span>
      </div>
    </footer>
  )
}
