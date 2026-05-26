import type { ReactNode } from 'react'
import { useRef } from 'react'
import { RevealGroup } from './Reveal'
import { useScrollReveal } from './hooks/useScrollReveal'

type Step = {
  title: string
  description: string
  icon: ReactNode
}

function IconPackage() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3 20 7.5v9L12 21 4 16.5v-9L12 3z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M12 12 20 7.5M12 12V21M12 12 4 7.5" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
      <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function IconShieldCheck() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3 5 6v6c0 4.2 3 7.5 7 8.5 4-1 7-4.3 7-8.5V6l-7-3z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconMapPin() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

function IconStar() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
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

function StepCard({ step, index, isLast }: { step: Step; index: number; isLast: boolean }) {
  const num = String(index + 1).padStart(2, '0')

  return (
    <li className="lm-step">
      {!isLast ? <span className="lm-step-line-h" aria-hidden /> : null}
      {!isLast ? <span className="lm-step-line-v" aria-hidden /> : null}

      <article data-reveal className="marketing-surface-card lm-step-card">
        <span className="lm-step-num">{num}</span>
        <div className="lm-step-icon">{step.icon}</div>
        <h3 className="lm-step-title">{step.title}</h3>
        <p className="lm-step-desc">{step.description}</p>
      </article>
    </li>
  )
}

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  useScrollReveal(cardsRef, {
    selector: '[data-reveal]',
    stagger: 0.1,
    start: 'top 80%',
    trigger: sectionRef,
  })

  return (
    <section
      ref={sectionRef}
      id="yolculuk"
      className="section-rhythm-b section-rhythm--fade lm-section-pad"
      aria-labelledby="how-it-works-heading"
    >
      <div className="lm-section-inner lm-container">
        <RevealGroup className="lm-text-center lm-header-block" stagger={0.1}>
          <p data-reveal className="lm-eyebrow-pill liquid-glass section-eyebrow">
            <span className="hero-eyebrow-dot" aria-hidden />
            Nasıl Çalışır
          </p>
          <h2 id="how-it-works-heading" data-reveal className="section-heading">
            Yük vermek hiç bu kadar kolay olmamıştı
          </h2>
          <p data-reveal className="section-lead section-lead--center">
            Beş adımda ilandan teslimata — şeffaf teklifler, güvenli ödeme ve canlı takip tek akışta.
          </p>
        </RevealGroup>

        <div ref={cardsRef}>
          <ol className="lm-steps">
            {STEPS.map((step, index) => (
              <StepCard
                key={step.title}
                step={step}
                index={index}
                isLast={index === STEPS.length - 1}
              />
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
