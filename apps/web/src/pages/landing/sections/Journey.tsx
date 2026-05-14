import { Suspense, useLayoutEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { RouteScene } from '../scenes/RouteScene'

const stages = [
  'Yola çıkıyoruz...',
  'Yapay zeka rota optimize ediyor',
  'Şoför ve müşteri eşleşti',
  'Hedefe ulaşıldı ✓',
]

export function JourneySection({ reduceMotion }: { reduceMotion: boolean }) {
  const wrap = useRef<HTMLElement>(null)
  const progressRef = useRef(0)
  const labelRef = useRef<HTMLParagraphElement>(null)

  useLayoutEffect(() => {
    const el = wrap.current
    if (!el) return
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
      onUpdate: (self) => {
        progressRef.current = self.progress
        const idx = Math.min(stages.length - 1, Math.floor(self.progress * stages.length))
        if (labelRef.current) labelRef.current.textContent = stages[idx]!
      },
    })
    return () => st.kill()
  }, [])

  useLayoutEffect(() => {
    const el = wrap.current
    if (!el || reduceMotion) return
    gsap.fromTo(
      el.querySelectorAll('.landing-journey__copy > *'),
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.12,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 75%' },
      },
    )
  }, [reduceMotion])

  return (
    <section ref={wrap} className="landing-journey" id="journey">
      <div className="landing-journey__canvas" aria-hidden>
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 4.2, 11], fov: 58, near: 0.1, far: 120 }}
          shadows
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <RouteScene progressRef={progressRef} reduceTrees={reduceMotion} />
          </Suspense>
        </Canvas>
      </div>
      <div className="landing-journey__overlay">
        <div className="landing-journey__hud" aria-hidden>
          <div className="landing-journey__hud-tile landing-journey__hud-tile--tl">
            <span className="landing-journey__hud-label">Hız</span>
            <strong>85 km/s</strong>
          </div>
          <div className="landing-journey__hud-tile landing-journey__hud-tile--tr">
            <span className="landing-journey__hud-label">GPS</span>
            <strong>İstanbul → Ankara</strong>
          </div>
          <div className="landing-journey__hud-tile landing-journey__hud-tile--br">
            <span className="landing-journey__hud-label">Kalan</span>
            <strong>230 km</strong>
          </div>
        </div>
        <div className="landing-journey__copy">
          <p className="landing-journey__eyebrow">Yolculuk</p>
          <h2 className="landing-journey__h2">Türkiye Genelinde Akıcı Lojistik</h2>
          <p ref={labelRef} className="landing-journey__stage">
            {stages[0]}
          </p>
        </div>
      </div>
    </section>
  )
}
