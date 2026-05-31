import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type WheelEvent as ReactWheelEvent,
} from 'react'
import { gsap } from 'gsap'

type Review = {
  id: string
  name: string
  job: string
  company: string
  text: string
  when: string
  tenure: string
  trips: string
  grad: number
  rating: number
}

const REVIEWS_TOP: Review[] = [
  {
    id: 'hasan-celik',
    name: 'Hasan Çelik',
    job: 'Lojistik Koordinatörü',
    company: 'Anadolu Tekstil',
    text: 'İlanı verdim, 10 dakika içinde 5 teklif geldi. Şoförlerin evrakları önceden kontrol edilmiş olması en çok güven veren şey — kimi gönderdiğimizi biliyoruz.',
    when: '3 hafta önce',
    tenure: '3 aydır kullanıyor',
    trips: '41 sefer tamamlandı',
    grad: 3,
    rating: 5,
  },
  {
    id: 'fatma-aydin',
    name: 'Fatma Aydın',
    job: 'İşletme Sahibi',
    company: 'Aydın Lojistik',
    text: "Yıllardır telefon trafiğiyle boğuşuyordum. Şimdi tek ekrandan teklifleri görüp seçiyorum. AI'ın önerdiği fiyat da gerçekçi — ne eziliyoruz ne fazla ödüyoruz.",
    when: '5 gün önce',
    tenure: '8 aydır kullanıyor',
    trips: '47 sefer tamamlandı',
    grad: 4,
    rating: 5,
  },
  {
    id: 'murat-sahin',
    name: 'Murat Şahin',
    job: 'Tır Şoförü',
    company: 'Bireysel Taşımacı',
    text: 'Eskiden komisyoncuya muhtaçtık. Artık ilanları kendim görüyorum, teklifimi veriyorum. Para da teslimde hesaba geçiyor, en güzeli bu.',
    when: '2 ay önce',
    tenure: '5 aydır kullanıyor',
    trips: '33 sefer tamamlandı',
    grad: 0,
    rating: 5,
  },
  {
    id: 'zeynep-kara',
    name: 'Zeynep Kara',
    job: 'Genel Müdür',
    company: 'Kara Holding',
    text: 'KVKK uyumlu olması ve evrak doğrulama süreci bizi çok rahatlattı. Kurumsal tarafta güven her şeyden önemli, burada o güveni bulduk.',
    when: '1 hafta önce',
    tenure: '2 aydır kullanıyor',
    trips: '12 sefer tamamlandı',
    grad: 1,
    rating: 5,
  },
  {
    id: 'ahmet-dogan-ege',
    name: 'Ahmet Doğan',
    job: 'İhracat Sorumlusu',
    company: 'Ege Gıda',
    text: 'Soğuk zincir yükümüz vardı, doğru aracı dakikalar içinde bulduk. Canlı takip sayesinde müşteriye “yolda” diyebiliyorum, tahmin etmiyorum.',
    when: '10 gün önce',
    tenure: '4 aydır kullanıyor',
    trips: '28 sefer tamamlandı',
    grad: 2,
    rating: 5,
  },
  {
    id: 'emre-yilmaz',
    name: 'Emre Yılmaz',
    job: 'Filo Yöneticisi',
    company: 'Bağımsız filo',
    text: '5 aracımızı buradan yönetiyoruz. Boş dönüşleri azalttık, doluluk arttı. Yakıt bazlı fiyat önerisi gerçekten işe yarıyor.',
    when: '1 ay önce',
    tenure: '6 aydır kullanıyor',
    trips: '54 sefer tamamlandı',
    grad: 3,
    rating: 4,
  },
  {
    id: 'selin-aksoy',
    name: 'Selin Aksoy',
    job: 'Satınalma Müdürü',
    company: 'Mavi Mobilya',
    text: "İlk başta 'bir uygulama ne fark eder ki' dedim. Bir ay sonra nakliye maliyetim düştü, üstüne işim kolaylaştı. Hiç pişman değilim.",
    when: '6 hafta önce',
    tenure: '5 aydır kullanıyor',
    trips: '36 sefer tamamlandı',
    grad: 4,
    rating: 5,
  },
  {
    id: 'kemal-ozturk',
    name: 'Kemal Öztürk',
    job: 'Kamyon Şoförü',
    company: 'Bireysel Taşımacı',
    text: 'Kullanmaya başlayalı boş beklemiyorum. Bir sefer biter, yenisi hazır. Ödeme de takılmadan geliyor, eline sağlık diyorum.',
    when: '2 hafta önce',
    tenure: '9 aydır kullanıyor',
    trips: '58 sefer tamamlandı',
    grad: 0,
    rating: 5,
  },
  {
    id: 'derya-sen',
    name: 'Derya Şen',
    job: 'Operasyon Sorumlusu',
    company: 'Net Lojistik',
    text: 'Bir sorun yaşadık, destek ekibi gece yarısı bile döndü, 10 dakikada çözüldü. Bu ilgi bu sektörde nadir görülür.',
    when: '4 gün önce',
    tenure: '7 aydır kullanıyor',
    trips: '44 sefer tamamlandı',
    grad: 1,
    rating: 5,
  },
]

const REVIEWS_BOTTOM: Review[] = [
  {
    id: 'okan-demir',
    name: 'Okan Demir',
    job: 'Nakliye Müdürü',
    company: 'Demir İnşaat',
    text: 'Şantiyeye malzeme sevkiyatı bizde kabustu. Şimdi sabah ilan açıyorum, öğlene yük yola çıkmış oluyor.',
    when: '3 hafta önce',
    tenure: '5 aydır kullanıyor',
    trips: '39 sefer tamamlandı',
    grad: 2,
    rating: 5,
  },
  {
    id: 'busra-yildiz',
    name: 'Büşra Yıldız',
    job: 'Kurucu',
    company: 'Yıldız Organik',
    text: 'Küçük bir işletmeyiz, büyük lojistik firmalarıyla anlaşamıyorduk. Burada tek palet yükümüze bile teklif geliyor.',
    when: '1 ay önce',
    tenure: '3 aydır kullanıyor',
    trips: '22 sefer tamamlandı',
    grad: 3,
    rating: 5,
  },
  {
    id: 'tolga-arslan',
    name: 'Tolga Arslan',
    job: 'Tır Şoförü',
    company: 'Bireysel Taşımacı',
    text: 'İşi yapan adamla muhatabım, arada kimse yok. Hak ettiğim parayı alıyorum. 20 yıllık şoförüm, böylesini görmedim.',
    when: '2 ay önce',
    tenure: '11 aydır kullanıyor',
    trips: '67 sefer tamamlandı',
    grad: 4,
    rating: 5,
  },
  {
    id: 'gizem-koc',
    name: 'Gizem Koç',
    job: 'Lojistik Uzmanı',
    company: 'Koç Tekstil',
    text: 'Arayüz sade, öğrenmesi kolay. Ekip bir günde alıştı. Daha fazla rota seçeneği eklerseniz tam on numara olur.',
    when: '5 hafta önce',
    tenure: '4 aydır kullanıyor',
    trips: '31 sefer tamamlandı',
    grad: 0,
    rating: 4,
  },
  {
    id: 'serkan-aydemir',
    name: 'Serkan Aydemir',
    job: 'Bireysel Taşımacı',
    company: 'Bağımsız taşımacı',
    text: 'Telefonumdan teklif veriyorum, yolda takip ediyorum, parayı görüyorum. Ofise gerek kalmadı resmen.',
    when: '12 gün önce',
    tenure: '8 aydır kullanıyor',
    trips: '49 sefer tamamlandı',
    grad: 1,
    rating: 5,
  },
  {
    id: 'pinar-cetin',
    name: 'Pınar Çetin',
    job: 'Dış Ticaret Sorumlusu',
    company: 'Çetin Gıda',
    text: 'İhracat yüklerinde evrak ve U-ETDS süreci kafa karıştırırdı. Sistem hatırlatıyor, takip ediyor. İşim yarı yarıya azaldı.',
    when: '3 hafta önce',
    tenure: '6 aydır kullanıyor',
    trips: '35 sefer tamamlandı',
    grad: 2,
    rating: 5,
  },
  {
    id: 'mehmet-yilmaz-uretim',
    name: 'Mehmet Yılmaz',
    job: 'Üretim Müdürü',
    company: 'Anadolu Gıda',
    text: "Fiyatın neden o kadar olduğunu açıklaması güven veriyor. 'Mesafe şu, yakıt bu' diyor. Pazarlıkta elimiz güçlü oluyor.",
    when: '2 hafta önce',
    tenure: '7 aydır kullanıyor',
    trips: '42 sefer tamamlandı',
    grad: 3,
    rating: 5,
  },
  {
    id: 'ayse-korkmaz',
    name: 'Ayşe Korkmaz',
    job: 'İşletme Sahibi',
    company: 'Korkmaz Mobilya',
    text: 'Hasarlı teslimat korkusu vardı hep. Belgeli şoförlerle çalışınca o stres bitti. Bir kez bile sorun yaşamadık.',
    when: '6 hafta önce',
    tenure: '10 aydır kullanıyor',
    trips: '51 sefer tamamlandı',
    grad: 4,
    rating: 5,
  },
  {
    id: 'burak-sen',
    name: 'Burak Şen',
    job: 'Filo Sahibi',
    company: 'Şen Nakliyat',
    text: '3 ayda araç başına geliri %15 artırdık. Boş kilometre düştü. Rakamlar konuşuyor, gerisi laf.',
    when: '1 ay önce',
    tenure: '5 aydır kullanıyor',
    trips: '38 sefer tamamlandı',
    grad: 0,
    rating: 4,
  },
]

const MARQUEE_SPEED = 0.85
const MARQUEE_SPEED_MOBILE = 0.35
const DRAG_THRESHOLD = 8

function gradClass(i: number) {
  return `landing-reviews__avatar landing-reviews__avatar--g${i % 5}`
}

function Stars({ rating, label }: { rating: number; label: string }) {
  return (
    <div className="landing-reviews__stars" aria-label={label}>
      {'★'.repeat(rating)}
      {'☆'.repeat(Math.max(0, 5 - rating))}
    </div>
  )
}

function ReviewCardContent({ review }: { review: Review }) {
  return (
    <>
      <div className="landing-reviews__top">
        <div className="landing-reviews__who">
          <div className={gradClass(review.grad)} aria-hidden>
            {review.name[0]}
          </div>
          <div className="landing-reviews__identity">
            <p className="landing-reviews__name">{review.name}</p>
            <p className="landing-reviews__job">{review.job}</p>
            {review.company ? <p className="landing-reviews__company">{review.company}</p> : null}
          </div>
        </div>
        <span className="landing-reviews__verified">✓ Doğrulanmış</span>
      </div>
      <Stars rating={review.rating} label={`5 üzerinden ${review.rating}`} />
      <p className="landing-reviews__quote">{review.text}</p>
      <p className="landing-reviews__meta">{review.when}</p>
      <div className="landing-reviews__foot">
        <span>{review.tenure}</span>
        <span>{review.trips}</span>
      </div>
    </>
  )
}

function ReviewCard({
  review,
  onOpen,
  dragMovedRef,
}: {
  review: Review
  onOpen: (review: Review) => void
  dragMovedRef: RefObject<boolean>
}) {
  return (
    <button
      type="button"
      className="landing-reviews__card"
      data-cursor-hover
      onClick={() => {
        if (dragMovedRef.current) {
          dragMovedRef.current = false
          return
        }
        onOpen(review)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          e.stopPropagation()
          onOpen(review)
        }
      }}
      aria-label={`${review.name} yorumunu aç`}
    >
      <ReviewCardContent review={review} />
    </button>
  )
}

function ReviewModal({ review, onClose }: { review: Review; onClose: () => void }) {
  const titleId = useId()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="landing-reviews-modal" role="presentation">
      <button
        type="button"
        className="landing-reviews-modal__backdrop"
        aria-label="Yorum penceresini kapat"
        onClick={onClose}
      />
      <div
        className="landing-reviews-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button type="button" className="landing-reviews-modal__close" onClick={onClose} aria-label="Kapat">
          ×
        </button>
        <div className="landing-reviews-modal__head">
          <div className={gradClass(review.grad)} aria-hidden>
            {review.name[0]}
          </div>
          <div>
            <h3 id={titleId} className="landing-reviews-modal__name">
              {review.name}
            </h3>
            <p className="landing-reviews-modal__job">
              {review.job}
              {review.company ? ` · ${review.company}` : ''}
            </p>
          </div>
        </div>
        <span className="landing-reviews-modal__badge">✓ Doğrulanmış</span>
        <Stars rating={review.rating} label={`5 üzerinden ${review.rating} puan`} />
        <p className="landing-reviews-modal__text">{review.text}</p>
        <p className="landing-reviews-modal__meta">
          {review.when} · {review.tenure} · {review.trips}
        </p>
      </div>
    </div>
  )
}

type MarqueeDirection = 'right' | 'left'

function MarqueeRow({
  reviews,
  direction,
  autoScroll,
  speed,
  onOpenReview,
}: {
  reviews: Review[]
  direction: MarqueeDirection
  autoScroll: boolean
  speed: number
  onOpenReview: (review: Review) => void
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(0)
  const loopRef = useRef(0)
  const pausedRef = useRef(false)
  const draggingRef = useRef(false)
  const dragMovedRef = useRef(false)
  const activePointerRef = useRef<number | null>(null)
  const wheelPauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragStartRef = useRef({ x: 0, offset: 0 })

  const applyOffset = useCallback(() => {
    const track = trackRef.current
    const loop = loopRef.current
    if (!track || loop <= 0) return

    let x = offsetRef.current
    if (direction === 'right') {
      while (x >= 0) x -= loop
      while (x < -loop) x += loop
    } else {
      while (x <= -loop) x += loop
      while (x > 0) x -= loop
    }
    offsetRef.current = x
    track.style.transform = `translateX(${x}px)`
  }, [direction])

  const measureLoop = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    loopRef.current = track.scrollWidth / 2
    applyOffset()
  }, [applyOffset])

  useEffect(() => {
    measureLoop()
    const ro = new ResizeObserver(measureLoop)
    if (trackRef.current) ro.observe(trackRef.current)
    return () => ro.disconnect()
  }, [measureLoop, reviews])

  useEffect(() => {
    if (!autoScroll) return

    const delta = direction === 'right' ? speed : -speed
    let raf = 0

    const tick = () => {
      if (!pausedRef.current && !draggingRef.current) {
        offsetRef.current += delta
        applyOffset()
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [autoScroll, direction, speed, applyOffset])

  const onViewportPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    dragMovedRef.current = false
    draggingRef.current = false
    activePointerRef.current = e.pointerId
    dragStartRef.current = { x: e.clientX, offset: offsetRef.current }
    pausedRef.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onViewportPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== e.pointerId) return
    const dx = e.clientX - dragStartRef.current.x
    if (!draggingRef.current && Math.abs(dx) > DRAG_THRESHOLD) {
      draggingRef.current = true
      dragMovedRef.current = true
      e.currentTarget.classList.add('landing-reviews__viewport--dragging')
    }
    if (!draggingRef.current) return
    offsetRef.current = dragStartRef.current.offset + dx
    applyOffset()
  }

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== e.pointerId) return
    activePointerRef.current = null
    draggingRef.current = false
    pausedRef.current = false
    e.currentTarget.classList.remove('landing-reviews__viewport--dragging')
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  const onViewportWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
    if (delta === 0) return
    e.preventDefault()
    pausedRef.current = true
    offsetRef.current -= delta
    applyOffset()
    if (wheelPauseTimerRef.current) clearTimeout(wheelPauseTimerRef.current)
    wheelPauseTimerRef.current = setTimeout(() => {
      pausedRef.current = false
      wheelPauseTimerRef.current = null
    }, 450)
  }

  const items = [...reviews, ...reviews]

  if (!autoScroll) {
    return (
      <div className="landing-reviews__row">
        <div ref={viewportRef} className="landing-reviews__viewport landing-reviews__viewport--manual">
          <div ref={trackRef} className="landing-reviews__marquee landing-reviews__marquee--static">
            {items.map((r, i) => (
              <ReviewCard key={`${r.id}-${i}`} review={r} onOpen={onOpenReview} dragMovedRef={dragMovedRef} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="landing-reviews__row"
      onMouseEnter={() => {
        pausedRef.current = true
      }}
      onMouseLeave={() => {
        pausedRef.current = false
      }}
    >
      <div
        ref={viewportRef}
        className="landing-reviews__viewport"
        onPointerDown={onViewportPointerDown}
        onPointerMove={onViewportPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={onViewportWheel}
      >
        <div ref={trackRef} className="landing-reviews__marquee">
          {items.map((r, i) => (
            <ReviewCard key={`${r.id}-${i}`} review={r} onOpen={onOpenReview} dragMovedRef={dragMovedRef} />
          ))}
        </div>
      </div>
    </div>
  )
}

function useMediaMobile() {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const fn = () => setMobile(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])

  return mobile
}

export function TestimonialsSection() {
  const root = useRef<HTMLElement>(null)
  const [selected, setSelected] = useState<Review | null>(null)
  const [reduceMotion, setReduceMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const isMobile = useMediaMobile()

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const fn = () => setReduceMotion(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])

  useEffect(() => {
    const el = root.current
    if (!el || reduceMotion) return

    gsap.fromTo(
      el.querySelectorAll('.landing-reviews__reveal'),
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 78%', once: true },
      },
    )
  }, [reduceMotion])

  const autoDesktop = !reduceMotion && !isMobile
  const autoMobile = !reduceMotion && isMobile
  const speed = isMobile ? MARQUEE_SPEED_MOBILE : MARQUEE_SPEED

  const mobileReviews = [...REVIEWS_TOP, ...REVIEWS_BOTTOM]

  return (
    <section
      ref={root}
      className={`landing-reviews${selected ? ' landing-reviews--modal-open' : ''}`}
      id="reviews"
    >
      {selected ? <ReviewModal review={selected} onClose={() => setSelected(null)} /> : null}

      <div className="landing-reviews__head-block landing-reviews__reveal">
        <h2 className="landing-reviews__h2">Kullanıcılarımız Ne Diyor?</h2>
        <p className="landing-reviews__lead">Türkiye&apos;nin Dört Bir Yanından Gerçek Kullanıcı Deneyimleri.</p>
      </div>

      <div className="landing-reviews__rows landing-reviews__reveal">
        {isMobile ? (
          <MarqueeRow
            reviews={mobileReviews}
            direction="right"
            autoScroll={autoMobile}
            speed={speed}
            onOpenReview={setSelected}
          />
        ) : (
          <>
            <MarqueeRow
              reviews={REVIEWS_TOP}
              direction="right"
              autoScroll={autoDesktop}
              speed={speed}
              onOpenReview={setSelected}
            />
            <MarqueeRow
              reviews={REVIEWS_BOTTOM}
              direction="left"
              autoScroll={autoDesktop}
              speed={speed}
              onOpenReview={setSelected}
            />
          </>
        )}
      </div>

      <div className="landing-reviews__stats landing-reviews__reveal">
        <div className="landing-reviews__stat">
          <strong>⭐ 4.9/5</strong>
          <span>Ortalama Puan</span>
        </div>
        <div className="landing-reviews__stat">
          <strong>👥 12.5K+</strong>
          <span>Aktif Kullanıcı</span>
        </div>
        <div className="landing-reviews__stat">
          <strong>💬 8K+</strong>
          <span>Olumlu Yorum</span>
        </div>
      </div>
    </section>
  )
}
