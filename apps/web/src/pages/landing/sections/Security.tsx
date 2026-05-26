import { Suspense, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { gsap } from 'gsap'
import { SecurityScene } from '../scenes/SecurityScene'

const chips = [
  { title: 'Banka Düzeyinde Şifreleme', hint: 'Verileriniz bankacılık seviyesinde korunur.', icon: '🔐' },
  { title: 'KVKK Uyumlu', hint: 'Kişisel verileriniz koruma altında.', icon: '🛡️' },
  { title: 'Güvenli Havuz Ödeme', hint: 'Paranız teslimat sonrası şoföre.', icon: '💳' },
  { title: 'U-ETDS Yasal Bildirim', hint: 'Yasal yük bildirimleri düzenli.', icon: '📊' },
  { title: 'Doğrulanmış Şoför', hint: 'Belgeler yapay zekâ ile kontrol edilir.', icon: '✓' },
  { title: 'Uçtan Uca Şifreli', hint: 'İletişim ve dosyalar korunur.', icon: '🔒' },
]

const features = [
  { title: 'KVKK Uyumlu', text: 'Tüm veriler şifreli ve erişim kontrollü saklanır.' },
  { title: 'Güvenli Havuz Ödeme', text: 'Para güvenli havuzda; teslim onayıyla serbest bırakılır.' },
  { title: 'U-ETDS Entegre', text: 'Yasal bildirimler ve sefer kayıtları düzenli akar.' },
]

export function SecuritySection({ reduceMotion }: { reduceMotion: boolean }) {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el || reduceMotion) return
    gsap.fromTo(
      el.querySelectorAll('.landing-security__reveal'),
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.1,
        duration: 0.6,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 75%', once: true },
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
      <div className="landing-security__badges landing-security__reveal">
        {chips.map((c) => (
          <div key={c.title} className="landing-security__chip">
            <span className="landing-security__chip-icon" aria-hidden>
              {c.icon}
            </span>
            <div>
              <p className="landing-security__chip-title">{c.title}</p>
              <p className="landing-security__chip-hint">{c.hint}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="landing-security__content landing-security__reveal">
        <h2 className="landing-security__h2">Güvenliğiniz Önceliğimiz</h2>
        <div className="landing-security__grid">
          {features.map((f) => (
            <article
              key={f.title}
              className="landing-sec__feat landing-security__card landing-security__reveal"
              data-cursor-hover
            >
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
