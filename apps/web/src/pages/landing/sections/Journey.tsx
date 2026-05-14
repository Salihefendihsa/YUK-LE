import { Suspense, useLayoutEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { RouteScene } from '../scenes/RouteScene'

const stages = [
  'Yola çıkıyoruz...',
  'AI rota optimize ediyor',
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
          camera={{ position: [0, 3, 8], fov: 55, near: 0.1, far: 120 }}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <RouteScene progressRef={progressRef} reduceTrees={reduceMotion} />
          </Suspense>
        </Canvas>
      </div>
      <div className="landing-journey__overlay">
        <div className="landing-journey__copy">
          <p className="landing-journey__eyebrow">Yolculuk</p>
          <h2 className="landing-journey__h2">Türkiye genelinde akıcı lojistik</h2>
          <p ref={labelRef} className="landing-journey__stage">
            {stages[0]}
          </p>
        </div>
      </div>
    </section>
  )
}
