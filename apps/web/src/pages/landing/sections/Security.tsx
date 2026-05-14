import { Suspense, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { gsap } from 'gsap'
import { SecurityScene } from '../scenes/SecurityScene'

const badges = ['🔐 AES-256', '🛡️ KVKK', '💳 Escrow', '📊 U-ETDS', '✓ Doğrulanmış', '🔒 Şifreli']

const features = [
  { title: 'KVKK uyumlu', text: 'Tüm veriler şifreli ve erişim kontrollü saklanır.' },
  { title: 'Escrow ödeme', text: 'Para güvenli havuzda; teslim onayıyla serbest bırakılır.' },
  { title: 'U-ETDS entegre', text: 'Yasal bildirimler ve sefer kayıtları düzenli akar.' },
]

export function SecuritySection({ reduceMotion }: { reduceMotion: boolean }) {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el || reduceMotion) return
    gsap.fromTo(
      el.querySelectorAll('.landing-sec__feat'),
      { y: 56, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.14,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 72%' },
      },
    )
  }, [reduceMotion])

  return (
    <section ref={root} className="landing-security" id="security">
      <div className="landing-security__canvas" aria-hidden>
        <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0.4, 4.2], fov: 45 }} gl={{ alpha: true }}>
          <Suspense fallback={null}>
            <SecurityScene />
          </Suspense>
        </Canvas>
      </div>
      <div className="landing-security__badges" aria-hidden>
        {badges.map((b) => (
          <span key={b} className="landing-security__chip">
            {b}
          </span>
        ))}
      </div>
      <div className="landing-security__content">
        <h2 className="landing-security__h2">Güvenliğiniz önceliğimiz</h2>
        <div className="landing-security__grid">
          {features.map((f) => (
            <article key={f.title} className="landing-sec__feat landing-security__card" data-cursor-hover>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
