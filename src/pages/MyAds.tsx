import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, LayoutGrid, Pencil, Plus, RotateCcw, Ban, Trash2 } from 'lucide-react'
import { useStore } from '../lib/store'
import { categoryBySlug } from '../data/categories'
import { listingPath, naira, timeAgo, unitLabel } from '../lib/format'
import { Breadcrumbs, EmptyState, Img, Modal } from '../components/ui'

export default function MyAds() {
  const { myAds, updateAd, removeAd, user, toast } = useStore()
  const [tab, setTab] = useState<'active' | 'unavailable'>('active')
  const [confirm, setConfirm] = useState<string | null>(null)
  const items = myAds.filter((a) => a.status === tab)

  return (
    <div className="container page-simple">
      <Breadcrumbs items={[{ label: 'House4Rent', to: '/' }, { label: 'My adverts' }]} />
      <div className="row-between">
        <h1 className="page-title">My adverts</h1>
        <Link to="/sell" className="btn btn-accent">
          <Plus size={16} /> Post advert
        </Link>
      </div>
      {!user && myAds.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="Sign in to manage your adverts"
          text="Post a property and it will show up here with its views and status."
          action={
            <div className="row-gap">
              <Link to="/login?next=/my-ads" className="btn btn-outline">
                Sign in
              </Link>
              <Link to="/sell" className="btn btn-primary">
                Post a property
              </Link>
            </div>
          }
        />
      ) : (
        <>
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'active'} className={tab === 'active' ? 'on' : ''} onClick={() => setTab('active')}>
              Active <small>{myAds.filter((a) => a.status === 'active').length}</small>
            </button>
            <button role="tab" aria-selected={tab === 'unavailable'} className={tab === 'unavailable' ? 'on' : ''} onClick={() => setTab('unavailable')}>
              Closed <small>{myAds.filter((a) => a.status === 'unavailable').length}</small>
            </button>
          </div>
          {items.length === 0 ? (
            <EmptyState icon={LayoutGrid} title={tab === 'active' ? 'No active adverts' : 'No closed adverts'} text={tab === 'active' ? 'Post a property to start getting calls.' : 'Adverts you mark as rented or sold appear here.'} />
          ) : (
            <div className="myads">
              {items.map((a) => (
                <div key={a.id} className="card myad">
                  <Img src={a.images[0]} alt="" width={240} />
                  <div className="myad-body">
                    <Link to={listingPath(a)} className="myad-title">
                      {a.title}
                    </Link>
                    <span className="price-sm">
                      {naira(a.price)} <small>{unitLabel(a.priceUnit, a.category)}</small>
                    </span>
                    <small className="muted">
                      {categoryBySlug(a.category)?.name} · {a.area} · posted {timeAgo(a.postedAt)}
                    </small>
                    <small className="muted">
                      <Eye size={13} /> {a.views} views
                    </small>
                  </div>
                  <div className="myad-actions">
                    <Link to={`/sell?edit=${a.id}`} className="btn btn-ghost sm">
                      <Pencil size={15} /> Edit
                    </Link>
                    {a.status === 'active' ? (
                      <button
                        className="btn btn-ghost sm"
                        onClick={() => {
                          updateAd(a.id, { status: 'unavailable' })
                          toast('Marked as rented / sold')
                        }}
                      >
                        <Ban size={15} /> Close
                      </button>
                    ) : (
                      <button
                        className="btn btn-ghost sm"
                        onClick={() => {
                          updateAd(a.id, { status: 'active', postedAt: new Date().toISOString() })
                          toast('Advert is live again')
                        }}
                      >
                        <RotateCcw size={15} /> Reactivate
                      </button>
                    )}
                    <button className="btn btn-ghost sm danger" onClick={() => setConfirm(a.id)}>
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Delete this advert?">
        <p>This removes the advert permanently. You can't undo this.</p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setConfirm(null)}>
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={() => {
              if (confirm) removeAd(confirm)
              setConfirm(null)
              toast('Advert deleted')
            }}
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  )
}
