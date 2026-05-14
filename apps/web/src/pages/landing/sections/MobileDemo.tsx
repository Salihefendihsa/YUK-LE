import { Suspense, useLayoutEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Phone } from '../models/Phone'

function ScreenPanel({ hue }: { hue: string }) {
  return (
    <mesh position={[0, 0, 0]}>
      <planeGeometry args={[0.44, 0.95]} />
      <meshBasicMaterial color={hue} />
    </mesh>
  )
}

export function MobileDemoSection({ reduceMotion }: { reduceMotion: boolean }) {
  const root = useRef<HTMLElement>(null)
  const [scrollP, setScrollP] = useState(0)

  useLayoutEffect(() => {
    const el = root.current
    if (!el || reduceMotion) return
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
      onUpdate: (self) => setScrollP(self.progress),
    })
    return () => st.kill()
  }, [reduceMotion])

  useLayoutEffect(() => {
    const el = root.current
    if (!el || reduceMotion) return
    gsap.fromTo(
      el.querySelectorAll('.landing-mobile__text > *'),
      { x: -30, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        stagger: 0.1,
        duration: 0.65,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 75%' },
      },
    )
  }, [reduceMotion])

  const page = Math.min(2, Math.floor(scrollP * 3))
  const hues = ['#1a1428', '#14281a', '#281a14']
  const hue = hues[page] ?? '#1a1428'
  const rotY = reduceMotion ? 0.35 : scrollP * Math.PI * 0.9

  return (
    <section ref={root} className="landing-mobile" id="mobile">
      <div className="landing-mobile__inner">
        <div className="landing-mobile__text">
          <p className="landing-mobile__eyebrow">Mobil</p>
          <h2>Cebinizde yük yönetimi</h2>
          <p className="landing-mobile__p">
            İlan açın, teklifleri görün, teslimatı takip edin — tek uygulamada.
          </p>
          <div className="landing-mobile__stores">
            <span className="landing-mobile__badge">Yakında</span>
            <button type="button" className="landing-mobile__store" data-cursor-hover>
              App Store
            </button>
            <button type="button" className="landing-mobile__store" data-cursor-hover>
              Google Play
            </button>
          </div>
        </div>
        <div className="landing-mobile__device" aria-hidden>
          <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 2.4], fov: 42 }}>
            <Suspense fallback={null}>
              <ambientLight intensity={0.5} />
              <Phone rotateY={rotY} position={[0, -0.05, 0]}>
                <ScreenPanel hue={hue} />
              </Phone>
            </Suspense>
          </Canvas>
        </div>
      </div>
    </section>
  )
}
