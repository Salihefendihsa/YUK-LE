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
    if (!container || !canUseParallax()) return

    const applyTransform = (targetX: number, targetY: number) => {
      for (const { ref, max, factor } of layers) {
        const el = ref.current
        if (!el) continue
        const x = targetX * max * 2 * factor
        const y = targetY * max * 2 * factor
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`
      }
    }

    const resetLayers = () => applyTransform(0, 0)

    const onMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return
      const targetX = (event.clientX - rect.left) / rect.width - 0.5
      const targetY = (event.clientY - rect.top) / rect.height - 0.5
      applyTransform(targetX, targetY)
    }

    const onLeave = () => resetLayers()

    container.addEventListener('mousemove', onMove)
    container.addEventListener('mouseleave', onLeave)

    const desktopMq = window.matchMedia(DESKTOP_BREAKPOINT)
    const motionMq = window.matchMedia(REDUCED_MOTION)

    const onMqChange = () => {
      if (!canUseParallax()) {
        resetLayers()
      }
    }

    desktopMq.addEventListener('change', onMqChange)
    motionMq.addEventListener('change', onMqChange)

    return () => {
      container.removeEventListener('mousemove', onMove)
      container.removeEventListener('mouseleave', onLeave)
      desktopMq.removeEventListener('change', onMqChange)
      motionMq.removeEventListener('change', onMqChange)
      resetLayers()
    }
    // layers ref'leri mount'ta sabit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef])
}
