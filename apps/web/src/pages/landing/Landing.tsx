import { useCallback, useEffect, useMemo, useState } from 'react'
import './landing.css'
import './gsapSetup'
import { useLenisScroll } from './hooks/useLenisScroll'
import { MinimalLoader } from './components/MinimalLoader'
import { LandingNavbar } from './components/Navbar'
import { HeroSection } from './sections/Hero'
import { JourneySection } from './sections/Journey'
import { AISection } from './sections/AI'
import { SecuritySection } from './sections/Security'
import { StatsSection } from './sections/Stats'
import { MobileDemoSection } from './sections/MobileDemo'
import { TestimonialsSection } from './sections/Testimonials'
import { PricingSection } from './sections/Pricing'
import { CTASection } from './sections/CTA'
import { LandingFooter } from './sections/Footer'

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
          <JourneySection reduceMotion={light3d} />
          <AISection reduceMotion={reduceMotion} />
          <SecuritySection reduceMotion={reduceMotion} />
          <StatsSection reduceMotion={reduceMotion} />
          <MobileDemoSection reduceMotion={light3d} />
          <TestimonialsSection />
          <PricingSection />
          <CTASection />
        </main>
        <LandingFooter />
      </div>
    </div>
  )
}
