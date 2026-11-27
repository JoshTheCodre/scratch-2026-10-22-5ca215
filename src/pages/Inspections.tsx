import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, CalendarDays, CalendarPlus, MapPin, MessageCircle, RotateCcw, X } from 'lucide-react'
import type { Booking, Listing } from '../types'
import { fullLocation } from '../data/locations'
import { sellerById } from '../data/sellers'
import { useStore } from '../lib/store'
import { listingPath } from '../lib/format'
import { bookingDateText, bookingIcs, isUpcoming } from '../lib/inspection'
import { BookInspection } from '../components/BookInspection'
import { Breadcrumbs, EmptyState, Img, Modal } from '../components/ui'

const key = (b: Booking) => `${b.date}T${String(b.hour).padStart(2, '0')}`
const STATUS_LABEL: Record<Booking['status'], string> = { requested: 'Waiting for owner', confirmed: 'Confirmed', cancelled: 'Cancelled' }

export default function Inspections() {
  const { bookings, byId } = useStore()
  const rows = bookings.map((b) => ({ b, l: byId(b.listingId) })).filter((r): r is { b: Booking; l: Listing } => Boolean(r.l))
  const upcoming = rows.filter((r) => r.b.status !== 'cancelled' && isUpcoming(r.b)).sort((a, b) => key(a.b).localeCompare(key(b.b)))
  const past = rows.filter((r) => !upcoming.includes(r))
  return (
    <div className="container page-simple">
      <Breadcrumbs items={[{ label: 'House4Rent', to: '/' }, { label: 'Inspections' }]} />
      <h1 className="page-title">Inspections</h1>
      <p className="muted">Viewings you have booked. Owners confirm in the chat, and you can reschedule any time.</p>
      {rows.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No inspections booked"
          text="Open any advert and tap “Book inspection” to pick a day and time the owner is free."
          action={
            <Link to="/" className="btn btn-primary">
              Find a property
            </Link>
          }
        />
      ) : (
        <>
          <h2 className="list-head">Upcoming {upcoming.length > 0 && <span className="count">{upcoming.length}</span>}</h2>
          {upcoming.length === 0 ? <p className="muted">Nothing coming up.</p> : <BookingList rows={upcoming} />}
          {past.length > 0 && (
            <>
              <h2 className="list-head">Past & cancelled</h2>
              <BookingList rows={past} past />
            </>
          )}
        </>
      )}
    </div>
  )
}

function BookingList({ rows, past }: { rows: { b: Booking; l: Listing }[]; past?: boolean }) {
  const { cancelBooking, threads, toast } = useStore()
  const [reschedule, setReschedule] = useState<{ b: Booking; l: Listing } | null>(null)
  const [cancel, setCancel] = useState<Booking | null>(null)

  const download = (b: Booking, l: Listing) => {
    const blob = new Blob([bookingIcs(b, l, l.address ?? fullLocation(l.city, l.area))], { type: 'text/calendar' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `inspection-${b.date}.ics`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  return (
    <>
    <ul className="booking-list">
      {rows.map(({ b, l }) => {
        const seller = sellerById(b.sellerId)
        const thread = threads.find((t) => t.listingId === l.id)
        return (
          <li key={b.id} className={`booking ${past ? 'past' : ''}`}>
            <Link to={listingPath(l)} className="booking-thumb">
              <Img src={l.images[0]} alt={l.title} width={240} />
            </Link>
            <div className="booking-body">
              <span className={`status status-${b.status}`}>
                {b.status === 'confirmed' && <CalendarCheck size={13} />} {past && b.status !== 'cancelled' ? 'Done' : STATUS_LABEL[b.status]}
              </span>
              <strong className="booking-when">{bookingDateText(b, true)}</strong>
              <Link to={listingPath(l)} className="booking-title">
                {l.title}
              </Link>
              <small className="muted">
                <MapPin size={12} /> {l.address ?? fullLocation(l.city, l.area)} · {seller?.name ?? 'Owner'}
              </small>
              {!past && b.status !== 'cancelled' && (
                <div className="booking-actions">
                  {thread && (
                    <Link to={`/messages/${thread.id}`} className="btn btn-soft sm">
                      <MessageCircle size={15} /> Chat
                    </Link>
                  )}
                  <button className="btn btn-ghost sm" onClick={() => download(b, l)}>
                    <CalendarPlus size={15} /> Add to calendar
                  </button>
                  <button className="btn btn-ghost sm" onClick={() => setReschedule({ b, l })}>
                    <RotateCcw size={15} /> Reschedule
                  </button>
                  <button className="btn btn-ghost sm danger-text" onClick={() => setCancel(b)}>
                    <X size={15} /> Cancel
                  </button>
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ul>
      {reschedule && (
        <BookInspection l={reschedule.l} sellerName={sellerById(reschedule.b.sellerId)?.name ?? 'The owner'} open onClose={() => setReschedule(null)} replacing={reschedule.b} />
      )}
      <Modal open={Boolean(cancel)} onClose={() => setCancel(null)} title="Cancel this inspection?">
        <p>We'll let the owner know so they can offer the time to someone else.</p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setCancel(null)}>
            Keep it
          </button>
          <button
            className="btn btn-danger"
            onClick={() => {
              if (cancel) cancelBooking(cancel.id)
              setCancel(null)
              toast('Inspection cancelled')
            }}
          >
            Cancel inspection
          </button>
        </div>
      </Modal>
    </>
  )
}
