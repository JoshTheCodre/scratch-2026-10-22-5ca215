import { useMemo, useState } from 'react'
import { CalendarCheck, Clock, ShieldCheck } from 'lucide-react'
import type { Booking, Listing } from '../types'
import { fullLocation } from '../data/locations'
import { useStore } from '../lib/store'
import { availabilityFor, availabilityText, bookingDateText, hourLabel, slotsFor, upcomingDays, viewingWord } from '../lib/inspection'
import { Modal } from './ui'

/** Pick a day and time the owner is free, then confirm your details. */
export function BookInspection({ l, sellerName, open, onClose, replacing }: { l: Listing; sellerName: string; open: boolean; onClose: () => void; replacing?: Booking }) {
  const { user, bookings, bookInspection, toast } = useStore()
  const avail = availabilityFor(l)
  const days = useMemo(() => upcomingDays(avail), [avail])
  const firstOpen = days.find((d) => d.open && slotsFor(l, avail, d.date, bookings).some((s) => !s.taken))?.date ?? ''
  const [date, setDate] = useState(replacing?.date ?? firstOpen)
  const [hour, setHour] = useState<number | null>(replacing?.hour ?? null)
  const [name, setName] = useState(replacing?.name ?? user?.name ?? '')
  const [phone, setPhone] = useState(replacing?.phone ?? user?.phone ?? '')
  const [note, setNote] = useState(replacing?.note ?? '')
  const [step, setStep] = useState<'time' | 'details'>('time')
  const slots = date ? slotsFor(l, avail, date, bookings.filter((b) => b.id !== replacing?.id)) : []
  const word = viewingWord(l)
  const valid = name.trim().length > 1 && phone.replace(/\D/g, '').length >= 10 && hour !== null && date

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    bookInspection({ listingId: l.id, sellerId: l.sellerId, date, hour: hour!, name: name.trim(), phone: phone.trim(), note: note.trim() || undefined })
    toast(`${replacing ? 'Rescheduled' : 'Booked'} for ${bookingDateText({ date, hour: hour! })} — waiting for ${sellerName} to confirm`)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={replacing ? `Reschedule ${word}` : `Book an ${word}`}>
      {step === 'time' ? (
        <div className="book">
          <p className="book-avail">
            <Clock size={15} /> {sellerName} shows this property {availabilityText(avail)}
          </p>
          <div className="field">
            <span className="field-label">Day</span>
            <div className="day-strip" role="listbox" aria-label="Day">
              {days.map((d) => {
                const full = d.open && !slotsFor(l, avail, d.date, bookings.filter((b) => b.id !== replacing?.id)).some((s) => !s.taken)
                return (
                  <button
                    type="button"
                    key={d.date}
                    role="option"
                    aria-selected={date === d.date}
                    className={`day ${date === d.date ? 'on' : ''}`}
                    disabled={!d.open || full}
                    onClick={() => {
                      setDate(d.date)
                      setHour(null)
                    }}
                  >
                    <small>{d.weekday}</small>
                    <strong>{d.label}</strong>
                    <small className="day-note">{!d.open ? 'Closed' : full ? 'Full' : 'Open'}</small>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="field">
            <span className="field-label">Time</span>
            {slots.length === 0 ? (
              <p className="muted small">No times left on this day. Pick another day.</p>
            ) : (
              <div className="slot-grid">
                {slots.map((s) => (
                  <button type="button" key={s.hour} className={`slot ${hour === s.hour ? 'on' : ''}`} disabled={s.taken} aria-pressed={hour === s.hour} onClick={() => setHour(s.hour)}>
                    {hourLabel(s.hour)}
                    {s.taken && <small>Taken</small>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="btn btn-primary block" disabled={hour === null || !date} onClick={() => setStep('details')}>
            Continue{hour !== null && date ? ` · ${bookingDateText({ date, hour })}` : ''}
          </button>
        </div>
      ) : (
        <form className="form book" onSubmit={submit}>
          <div className="book-summary">
            <CalendarCheck size={20} />
            <div>
              <strong>{bookingDateText({ date, hour: hour! }, true)}</strong>
              <small>{fullLocation(l.city, l.area)}</small>
            </div>
            <button type="button" className="link-btn" onClick={() => setStep('time')}>
              Change
            </button>
          </div>
          <label>
            Your name
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
          </label>
          <label>
            Phone number
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="0803 000 0000" required />
          </label>
          <label>
            Note for {sellerName} (optional)
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. I'll come with my wife" maxLength={200} />
          </label>
          <p className="book-safety">
            <ShieldCheck size={16} /> Never pay an inspection fee or deposit before you see the property. Bring someone with you.
          </p>
          <button className="btn btn-primary block" disabled={!valid}>
            {replacing ? 'Confirm new time' : `Request ${word}`}
          </button>
        </form>
      )}
    </Modal>
  )
}
