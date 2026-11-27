import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MessageCircle, Phone, Send } from 'lucide-react'
import { useStore } from '../lib/store'
import { sellerById } from '../data/sellers'
import { listingPath, naira, shortAgo, timeAgo, unitLabel } from '../lib/format'
import { Avatar, Breadcrumbs, EmptyState, Img } from '../components/ui'

const QUICK = ['Is this still available?', 'When can I inspect?', 'Is the price negotiable?', 'What documents come with it?']

export default function Messages() {
  const { threadId } = useParams()
  const { threads, byId, sendMessage, markRead } = useStore()
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const bodyRef = useRef<HTMLDivElement>(null)
  const openedThread = useRef<string | undefined>(undefined)
  const active = threads.find((t) => t.id === threadId)
  const listing = byId(active?.listingId)
  const seller = sellerById(active?.sellerId)

  useEffect(() => {
    if (active?.unread) markRead(active.id)
  }, [active, markRead])
  // Scroll the chat area itself (not the page): jump to the latest message when a chat
  // opens, glide when a new one arrives.
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const justOpened = openedThread.current !== active?.id
    openedThread.current = active?.id
    el.scrollTo({ top: el.scrollHeight, behavior: justOpened ? 'auto' : 'smooth' })
  }, [active?.id, active?.messages.length])

  const send = (msg: string) => {
    if (!active || !msg.trim()) return
    sendMessage(active.id, msg.trim())
    setText('')
  }

  if (threads.length === 0)
    return (
      <div className="container page-simple">
        <Breadcrumbs items={[{ label: 'House4Rent', to: '/' }, { label: 'Messages' }]} />
        <h1 className="page-title">Messages</h1>
        <EmptyState
          icon={MessageCircle}
          title="No conversations yet"
          text="Open any advert and tap “Start chat” to message the seller."
          action={
            <Link to="/port-harcourt/real-estate" className="btn btn-primary">
              Browse properties
            </Link>
          }
        />
      </div>
    )

  return (
    <div className="container page-messages">
      <div className={`chat-shell ${active ? 'has-active' : ''}`}>
        <aside className="chat-list">
          <h2>Messages</h2>
          {threads.map((t) => {
            const l = byId(t.listingId)
            const s = sellerById(t.sellerId)
            const last = t.messages[t.messages.length - 1]
            return (
              <button key={t.id} className={`chat-item ${t.id === threadId ? 'on' : ''} ${t.unread ? 'unread' : ''}`} onClick={() => navigate(`/messages/${t.id}`)}>
                <Img src={l?.images[0]} alt="" width={120} />
                <span className="chat-item-body">
                  <span className="chat-item-top">
                    <strong className="ellipsis">{s?.name ?? 'Seller'}</strong>
                    {last && <time dateTime={last.at}>{shortAgo(last.at)}</time>}
                  </span>
                  <small className="ellipsis chat-item-listing">{l?.title}</small>
                  <span className="chat-item-bottom">
                    <small className="ellipsis chat-item-last">{last ? `${last.from === 'me' ? 'You: ' : ''}${last.text}` : 'No messages yet — say hello'}</small>
                    {t.unread > 0 && <span className="dot-count static">{t.unread}</span>}
                  </span>
                </span>
              </button>
            )
          })}
        </aside>

        <section className="chat-pane">
          {!active || !listing ? (
            <div className="chat-empty">
              <MessageCircle size={36} />
              <p>Select a conversation</p>
            </div>
          ) : (
            <>
              <header className="chat-head">
                <button className="icon-btn show-md" onClick={() => navigate('/messages')} aria-label="Back to conversations">
                  <ArrowLeft size={20} />
                </button>
                {seller && <Avatar name={seller.name} color={seller.color} size={38} />}
                <div>
                  <strong>{seller?.name}</strong>
                  <small className="muted">{seller?.responseTime}</small>
                </div>
                {seller && (
                  <a className="icon-btn chat-call" href={`tel:${seller.phone.replace(/\s/g, '')}`} aria-label={`Call ${seller.name}`} title="Call">
                    <Phone size={19} />
                  </a>
                )}
              </header>
              <Link to={listingPath(listing)} className="chat-listing">
                <Img src={listing.images[0]} alt="" width={160} />
                <span>
                  <strong className="ellipsis">{listing.title}</strong>
                  <span className="price-sm">
                    {naira(listing.price)} <small>{unitLabel(listing.priceUnit, listing.category)}</small>
                  </span>
                </span>
              </Link>
              <div className="chat-body" ref={bodyRef}>
                {active.messages.length === 0 && <p className="chat-hint">Say hello — ask about availability, inspection or price.</p>}
                {active.messages.map((m, i) => (
                  <div key={i} className={`bubble ${m.from}`}>
                    <p>{m.text}</p>
                    <small>{timeAgo(m.at)}</small>
                  </div>
                ))}
              </div>
              <div className="quick-replies">
                {QUICK.map((q) => (
                  <button key={q} className="chip" onClick={() => send(q)}>
                    {q}
                  </button>
                ))}
              </div>
              <form
                className="chat-input"
                onSubmit={(e) => {
                  e.preventDefault()
                  send(text)
                }}
              >
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message…" aria-label="Message" />
                <button className="btn btn-primary" disabled={!text.trim()} aria-label="Send">
                  <Send size={18} />
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
