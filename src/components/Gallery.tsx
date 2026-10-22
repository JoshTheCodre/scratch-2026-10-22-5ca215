import { useCallback, useEffect, useState } from 'react'
import { Camera, ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react'
import { Img } from './ui'

export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [i, setI] = useState(0)
  const [full, setFull] = useState(false)
  const n = images.length
  const go = useCallback((d: number) => setI((v) => (v + d + n) % n), [n])

  useEffect(() => {
    if (!full) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFull(false)
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [full, go])

  // Basic swipe support on touch screens.
  const [touchX, setTouchX] = useState<number | null>(null)
  const swipe = {
    onTouchStart: (e: React.TouchEvent) => setTouchX(e.touches[0]!.clientX),
    onTouchEnd: (e: React.TouchEvent) => {
      if (touchX === null) return
      const dx = e.changedTouches[0]!.clientX - touchX
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
      setTouchX(null)
    },
  }

  return (
    <div className="gallery">
      <div className="gallery-main" {...swipe}>
        <button className="gallery-open" onClick={() => setFull(true)} aria-label="Open full-screen photos">
          <Img src={images[i]} alt={`${title} — photo ${i + 1}`} width={1200} />
        </button>
        {n > 1 && (
          <>
            <button className="gallery-nav prev" onClick={() => go(-1)} aria-label="Previous photo">
              <ChevronLeft size={26} />
            </button>
            <button className="gallery-nav next" onClick={() => go(1)} aria-label="Next photo">
              <ChevronRight size={26} />
            </button>
          </>
        )}
        <span className="gallery-count">
          <Camera size={14} /> {i + 1}/{n}
        </span>
        <button className="gallery-expand" onClick={() => setFull(true)} aria-label="Full screen">
          <Maximize2 size={16} />
        </button>
      </div>
      {n > 1 && (
        <div className="gallery-thumbs">
          {images.map((src, k) => (
            <button key={k} className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={`Show photo ${k + 1}`}>
              <Img src={src} alt="" width={200} />
            </button>
          ))}
        </div>
      )}

      {full && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" {...swipe}>
          <div className="lightbox-top">
            <span>
              {i + 1} / {n} · {title}
            </span>
            <button className="icon-btn light" onClick={() => setFull(false)} aria-label="Close">
              <X size={26} />
            </button>
          </div>
          <div className="lightbox-stage">
            {n > 1 && (
              <button className="gallery-nav prev" onClick={() => go(-1)} aria-label="Previous photo">
                <ChevronLeft size={30} />
              </button>
            )}
            <Img src={images[i]} alt={`${title} — photo ${i + 1}`} width={1800} />
            {n > 1 && (
              <button className="gallery-nav next" onClick={() => go(1)} aria-label="Next photo">
                <ChevronRight size={30} />
              </button>
            )}
          </div>
          <div className="lightbox-thumbs">
            {images.map((src, k) => (
              <button key={k} className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={`Show photo ${k + 1}`}>
                <Img src={src} alt="" width={160} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
