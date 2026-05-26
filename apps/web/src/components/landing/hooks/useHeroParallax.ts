import { useEffect, type RefObject } from 'react'

const DESKTOP_BREAKPOINT = '(min-width: 1024px)'
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

export type ParallaxLayer = {
  ref: RefObject<HTMLElement | null>
  max: number
  factor: number
}

function canUseParallax() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia(DESKTOP_BREAKPOINT).matches &&
    !window.matchMedia(REDUCED_MOTION).matches
  )
}

export function useHeroParallax(
  containerRef: RefObject<HTMLElement | null>,
  layers: ParallaxLayer[],
) {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0
    let rafId = 0
    let enabled = false

    const resetLayers = () => {
      for (const { ref } of layers) {
        const el = ref.current
        if (el) el.style.transform = ''
      }
    }

    const tick = () => {
      currentX += (targetX - currentX) * 0.07
      currentY += (targetY - currentY) * 0.07

      for (const { ref, max, factor } of layers) {
        const el = ref.current
        if (!el) continue
        const x = currentX * max * 2 * factor
        const y = currentY * max * 2 * factor
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`
      }

      rafId = requestAnimationFrame(tick)
    }

    const onMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return
      targetX = (event.clientX - rect.left) / rect.width - 0.5
      targetY = (event.clientY - rect.top) / rect.height - 0.5
    }

    const onLeave = () => {
      targetX = 0
      targetY = 0
    }

    const start = () => {
      if (!canUseParallax() || enabled) return
      enabled = true
      container.addEventListener('mousemove', onMove)
      container.addEventListener('mouseleave', onLeave)
      rafId = requestAnimationFrame(tick)
    }

    const stop = () => {
      if (!enabled) return
      enabled = false
      container.removeEventListener('mousemove', onMove)
      container.removeEventListener('mouseleave', onLeave)
      cancelAnimationFrame(rafId)
      targetX = 0
      targetY = 0
      currentX = 0
      currentY = 0
      resetLayers()
    }

    const desktopMq = window.matchMedia(DESKTOP_BREAKPOINT)
    const motionMq = window.matchMedia(REDUCED_MOTION)

    const onMqChange = () => {
      stop()
      start()
    }

    start()
    desktopMq.addEventListener('change', onMqChange)
    motionMq.addEventListener('change', onMqChange)

    return () => {
      desktopMq.removeEventListener('change', onMqChange)
      motionMq.removeEventListener('change', onMqChange)
      stop()
    }
    // layers ref'leri mount'ta sabit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef])
}
