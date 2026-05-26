import type { ReactNode } from 'react'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, registerGsapPlugins } from '../../lib/gsap'

registerGsapPlugins()
gsap.registerPlugin(useGSAP)

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

type Feature = {
  title: string
  description: string
  icon: ReactNode
  aiFeature?: boolean
  layout: 'tall' | 'md' | 'wide'
}

function IconAiMatch() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 2l2.2 4.4 4.9.7-3.5 3.4.8 4.9L12 13.2 7.6 15.4l.8-4.9-3.5-3.4 4.9-.7L12 2z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M8 18h8M10 21h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function IconLiveMap() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 6c3-1.5 9-1.5 12 0v12c-3 1.5-9 1.5-12 0V6z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 12l3.5-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconVerified() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconEscrow() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8 10V8a4 4 0 118 0v2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="12" cy="15" r="1.5" fill="currentColor" />
    </svg>
  )
}

const FEATURES: Feature[] = [
  {
    title: 'Yapay zekâ ile en doğru eşleşme',
    description:
      'Fabrikalar ve belgeli şoförler saniyeler içinde en optimum rotada buluşur. Zaman ve maliyet kaybı biter.',
    icon: <IconAiMatch />,
    aiFeature: true,
    layout: 'tall',
  },
  {
    title: 'Kapıdan kapıya canlı konum',
    description:
      'Yükün durumunu ve tırın rotasını anlık olarak harita üzerinden şeffafça izleyin. Her adım kontrolünüzde olsun.',
    icon: <IconLiveMap />,
    layout: 'md',
  },
  {
    title: 'Belgeli ve doğrulanmış şoförler',
    description:
      'Tüm sürücülerin evrakları, K1 ve psikoteknik belgeleri admin panelinde sıkı denetimden geçer. Güven önceliğimizdir.',
    icon: <IconVerified />,
    layout: 'md',
  },
  {
    title: 'Teslimatta serbest bırakılan güvenli ödeme',
    description:
      'Ödeme yük teslim edilene kadar güvence altında tutulur. Teslimat sorunsuz tamamlandığında şoföre aktarılır.',
    icon: <IconEscrow />,
    layout: 'wide',
  },
]

function layoutClass(layout: Feature['layout']) {
  if (layout === 'tall') return 'lm-feature-card--tall'
  if (layout === 'wide') return 'lm-feature-card--wide'
  return 'lm-feature-card--md'
}

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <article
      data-feature-card
      className={`marketing-surface-card lm-feature-card ${layoutClass(feature.layout)}`}
    >
      <div>
        <div className="lm-feature-icon">{feature.icon}</div>
        <div className="lm-feature-title-row">
          <h3 className="lm-feature-title">{feature.title}</h3>
          {feature.aiFeature ? <span className="lm-ai-badge">AI</span> : null}
        </div>
        <p className="lm-feature-desc">{feature.description}</p>
      </div>
      <span
        aria-hidden
        className={`lm-feature-accent ${feature.aiFeature ? 'lm-feature-accent--ai' : ''}`}
      />
    </article>
  )
}

export function Features() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const reducedMotion = window.matchMedia(REDUCED_MOTION).matches
      const cards = sectionRef.current?.querySelectorAll('[data-feature-card]')
      if (!cards?.length) return

      if (reducedMotion) {
        gsap.set(cards, { opacity: 1, y: 0 })
        return
      }

      gsap.fromTo(
        cards,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.15,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        },
      )
    },
    { scope: sectionRef },
  )

  return (
    <section
      ref={sectionRef}
      id="ozellikler"
      className="section-rhythm-a section-rhythm--fade lm-section-pad"
      aria-labelledby="features-heading"
    >
      <div className="lm-section-inner lm-container">
        <header className="lm-text-center lm-header-block">
          <p className="section-eyebrow section-eyebrow--accent">Özellikler</p>
          <h2 id="features-heading" className="section-heading" style={{ marginTop: '0.75rem' }}>
            Lojistiği yeniden tanımlayan güç
          </h2>
          <p className="section-lead section-lead--center">
            Eşleşmeden ödemeye kadar her adımda şeffaflık ve kontrol.
          </p>
        </header>

        <div className="lm-features-grid">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  )
}
