import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const DESKTOP_MQ = '(min-width: 768px)'
const REDUCED_MOTION_MQ = '(prefers-reduced-motion: reduce)'

function shouldEnableLenis(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia(DESKTOP_MQ).matches &&
    !window.matchMedia(REDUCED_MOTION_MQ).matches
  )
}

export function useLenisScroll() {
  useEffect(() => {
    if (!shouldEnableLenis()) return

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    lenis.on('scroll', ScrollTrigger.update)

    const onGsapTick = (time: number) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(onGsapTick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(onGsapTick)
      lenis.destroy()
    }
  }, [])
}
