import { lazy, useCallback, useEffect, useMemo, useState } from 'react'
import './landing.css'
import './gsapSetup'
import { useLenisScroll } from './hooks/useLenisScroll'
import { MinimalLoader } from './components/MinimalLoader'
import { LazySection } from './components/LazySection'
import { LandingNavbar } from './components/Navbar'
import { HeroSection } from './sections/Hero'

const JourneySection = lazy(() =>
  import('./sections/Journey').then((m) => ({ default: m.JourneySection })),
)
const AISection = lazy(() => import('./sections/AI').then((m) => ({ default: m.AISection })))
const StatsSection = lazy(() => import('./sections/Stats').then((m) => ({ default: m.StatsSection })))
const SecuritySection = lazy(() =>
  import('./sections/Security').then((m) => ({ default: m.SecuritySection })),
)
const MobileDemoSection = lazy(() =>
  import('./sections/MobileDemo').then((m) => ({ default: m.MobileDemoSection })),
)
const TestimonialsSection = lazy(() =>
  import('./sections/Testimonials').then((m) => ({ default: m.TestimonialsSection })),
)
const PricingSection = lazy(() =>
  import('./sections/Pricing').then((m) => ({ default: m.PricingSection })),
)
const CTASection = lazy(() => import('./sections/CTA').then((m) => ({ default: m.CTASection })))
const LandingFooter = lazy(() =>
  import('./sections/Footer').then((m) => ({ default: m.LandingFooter })),
)

function useLandingPrefs() {
  const reduceMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )
  const [mobileCoarse, setMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const fn = () => setMobile(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])

  const light3d = reduceMotion || mobileCoarse
  return { reduceMotion, light3d }
}

export default function Landing() {
  const [ready, setReady] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const { reduceMotion, light3d } = useLandingPrefs()
  useLenisScroll()

  const heroReveal = useMemo(() => {
    if (ready) return 1
    if (loadProgress < 80) return 0
    return Math.min((loadProgress - 80) / 20, 1)
  }, [loadProgress, ready])

  const contentRevealStyle = useMemo(() => {
    const vis: 'visible' | 'hidden' = loadProgress >= 80 || ready ? 'visible' : 'hidden'
    return {
      opacity: heroReveal,
      filter: `blur(${(1 - heroReveal) * 24}px)`,
      transform: `scale(${1 + (1 - heroReveal) * 0.04})`,
      visibility: vis,
      transition: 'opacity 0.15s ease-out, filter 0.15s ease-out, transform 0.15s ease-out',
    }
  }, [heroReveal, loadProgress, ready])

  const onIntroComplete = useCallback(() => {
    setReady(true)
  }, [])

  useEffect(() => {
    document.documentElement.classList.add('landing-page')
    document.body.style.overflow = ready ? '' : 'hidden'
    return () => {
      document.documentElement.classList.remove('landing-page')
      document.body.style.overflow = ''
    }
  }, [ready])

  return (
    <div className={`landing-root ${ready ? 'landing-root--ready' : ''}`}>
      {!ready && (
        <MinimalLoader onComplete={onIntroComplete} onProgress={setLoadProgress} duration={2500} />
      )}
      <div className="landing-root-content" style={contentRevealStyle}>
        <LandingNavbar />
        <main>
          <HeroSection reduceMotion={light3d} />
          <LazySection id="journey" rootMargin="500px" minHeight="700px">
            <JourneySection reduceMotion={light3d} />
          </LazySection>
          <LazySection id="ai" rootMargin="500px" minHeight="700px">
            <AISection reduceMotion={reduceMotion} />
          </LazySection>
          <LazySection id="stats" rootMargin="400px" minHeight="400px">
            <StatsSection reduceMotion={reduceMotion} />
          </LazySection>
          <LazySection id="security" rootMargin="500px" minHeight="700px">
            <SecuritySection reduceMotion={reduceMotion} />
          </LazySection>
          <LazySection id="mobile" rootMargin="500px" minHeight="700px">
            <MobileDemoSection reduceMotion={light3d} />
          </LazySection>
          <LazySection id="testimonials" rootMargin="400px" minHeight="500px">
            <TestimonialsSection />
          </LazySection>
          <LazySection id="pricing" rootMargin="400px" minHeight="600px">
            <PricingSection />
          </LazySection>
          <LazySection id="cta" rootMargin="300px" minHeight="400px">
            <CTASection />
          </LazySection>
        </main>
        <LazySection id="footer" rootMargin="200px" minHeight="300px">
          <LandingFooter />
        </LazySection>
      </div>
    </div>
  )
}
