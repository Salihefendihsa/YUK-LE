import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { RevealGroup } from './Reveal'
import { useScrollReveal } from './hooks/useScrollReveal'

type Step = {
  title: string
  description: string
  icon: ReactNode
}

const ICON_SIZE = 28

function IconPackage() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3 20 7.5v9L12 21 4 16.5v-9L12 3z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M12 12 20 7.5M12 12V21M12 12 4 7.5" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </svg>
  )
}

function IconAiSpark() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2l2.2 4.4 4.9.7-3.5 3.4.8 4.9L12 13.2 7.6 15.4l.8-4.9-3.5-3.4 4.9-.7L12 2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M8 18h8M10 21h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
      <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function IconShieldCheck() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3 5 6v6c0 4.2 3 7.5 7 8.5 4-1 7-4.3 7-8.5V6l-7-3z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconMapPin() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

function IconStar() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3l2.4 4.8 5.4.8-3.9 3.8.9 5.4L12 14.8 7.2 17l.9-5.4L4.2 7.6l5.4-.8L12 3z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </svg>
  )
}

const STEPS: Step[] = [
  {
    title: 'İlan Ver',
    description:
      'Yükünüzü, güzergâhı ve detayları girin; önerilen fiyat saniyeler içinde karşınıza çıksın.',
    icon: <IconPackage />,
  },
  {
    title: 'Yapay Zekâ Adil Fiyat',
    description:
      'Sistem mesafe, yakıt ve AI ile saniyeler içinde adil bir navlun bandı önerir — ne eksik ne fazla.',
    icon: <IconAiSpark />,
  },
  {
    title: 'Teklifleri Toplayın',
    description: 'Belgeli tır şoförleri ilanınıza teklif versin; en uygununu siz seçin.',
    icon: <IconSearch />,
  },
  {
    title: 'Güvenle Anlaşın',
    description: 'Ödeme güvenli havuzda tutulur, iş tamamlanınca şoföre aktarılır.',
    icon: <IconShieldCheck />,
  },
  {
    title: 'Canlı Takip',
    description: 'Aracın konumunu yol boyunca harita üzerinde anlık izleyin.',
    icon: <IconMapPin />,
  },
  {
    title: 'Teslim & Puan',
    description: 'Teslimat onaylanır, ödeme tamamlanır, karşılıklı puanlama yapılır.',
    icon: <IconStar />,
  },
]

function TimelineStep({ step, index }: { step: Step; index: number }) {
  const num = String(index + 1).padStart(2, '0')

  return (
    <li className="lm-timeline__step" data-reveal style={{ '--lm-step-i': index } as CSSProperties}>
      <div className="lm-timeline__col">
        <div className="lm-timeline__head">
          <span className="lm-timeline__node" aria-hidden>
            {num}
          </span>
        </div>
        <span className="lm-timeline__drop" aria-hidden />
        <article className="lm-timeline__panel">
          <div
            className={`lm-timeline__icon lm-timeline__icon--motion-${index + 1}`}
            style={{ '--lm-step-i': index } as CSSProperties}
          >
            <span className="lm-timeline__icon-ring" aria-hidden />
            <span className="lm-timeline__icon-glyph">{step.icon}</span>
          </div>
          <div className="lm-timeline__copy">
            <h3 className="lm-timeline__title">{step.title}</h3>
            <p className="lm-timeline__desc">{step.description}</p>
          </div>
        </article>
      </div>
    </li>
  )
}

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const [desktopTimeline, setDesktopTimeline] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => setDesktopTimeline(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useScrollReveal(timelineRef, {
    selector: '[data-reveal]',
    stagger: 0.08,
    start: 'top 80%',
    trigger: sectionRef,
    enabled: desktopTimeline,
  })

  return (
    <section
      ref={sectionRef}
      id="yolculuk"
      className="section-rhythm-b section-rhythm--fade lm-section-pad lm-how-it-works lm-how-it-works--story"
      aria-labelledby="how-it-works-heading"
    >
      <div className="lm-section-inner lm-container">
        <RevealGroup className="lm-text-center lm-header-block" stagger={0.1}>
          <p data-reveal className="lm-eyebrow-pill liquid-glass section-eyebrow">
            <span className="hero-eyebrow-dot" aria-hidden />
            Nasıl Çalışır
          </p>
          <h2 id="how-it-works-heading" data-reveal className="section-heading">
            Yük Vermek Hiç Bu Kadar Kolay Olmamıştı
          </h2>
          <p data-reveal className="section-lead section-lead--center">
            Altı Adımda İlandan Teslimata — Şeffaf Teklifler, Güvenli Ödeme Ve Canlı Takip Tek Akışta.
          </p>
        </RevealGroup>

        <div ref={timelineRef} className="lm-timeline-wrap">
          <div className="lm-timeline__track lm-timeline__track--flow" aria-hidden>
            <span className="lm-timeline__track-line" />
          </div>
          <div className="lm-timeline__rails" aria-hidden>
            <span className="lm-timeline__rail lm-timeline__rail--wide" />
            <span className="lm-timeline__rail lm-timeline__rail--row1" />
            <span className="lm-timeline__rail lm-timeline__rail--row2" />
            <span className="lm-timeline__rail lm-timeline__rail--bridge" />
          </div>
          <ol className="lm-timeline">
            {STEPS.map((step, index) => (
              <TimelineStep key={step.title} step={step} index={index} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
