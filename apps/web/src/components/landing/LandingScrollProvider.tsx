import { useEffect, type ReactNode } from 'react'
import Lenis from 'lenis'
import { gsap, registerGsapPlugins, ScrollTrigger } from '../../lib/gsap'

const DESKTOP_BREAKPOINT = '(min-width: 1024px)'
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

function shouldUseLenis() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia(DESKTOP_BREAKPOINT).matches &&
    !window.matchMedia(REDUCED_MOTION).matches
  )
}

export function LandingScrollProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    registerGsapPlugins()

    if (!shouldUseLenis()) return

    const lenis = new Lenis({
      lerp: 0.075,
      duration: 1.15,
      smoothWheel: true,
      syncTouch: false,
    })

    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time: number) => {
      lenis.raf(time * 1000)
    }

    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    const desktopQuery = window.matchMedia(DESKTOP_BREAKPOINT)
    const motionQuery = window.matchMedia(REDUCED_MOTION)

    const handleChange = () => {
      if (!shouldUseLenis()) {
        lenis.destroy()
        gsap.ticker.remove(raf)
      }
    }

    desktopQuery.addEventListener('change', handleChange)
    motionQuery.addEventListener('change', handleChange)

    return () => {
      desktopQuery.removeEventListener('change', handleChange)
      motionQuery.removeEventListener('change', handleChange)
      gsap.ticker.remove(raf)
      lenis.destroy()
    }
  }, [])

  return children
}
