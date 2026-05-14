import { useEffect, useRef } from 'react'

export function LandingCursor() {
  const dot = useRef<HTMLDivElement>(null)
  const hoverRef = useRef(false)
  const downRef = useRef(false)

  useEffect(() => {
    const el = dot.current
    if (!el) return
    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let targetX = x
    let targetY = y
    let raf = 0

    const move = (e: MouseEvent) => {
      targetX = e.clientX
      targetY = e.clientY
    }

    const tick = () => {
      x += (targetX - x) * 0.18
      y += (targetY - y) * 0.18
      const hover = hoverRef.current
      const down = downRef.current
      const size = hover ? 40 : 20
      const scale = down ? 0.85 : 1
      el.style.width = `${size * scale}px`
      el.style.height = `${size * scale}px`
      el.style.transform = `translate3d(${x - (size * scale) / 2}px, ${y - (size * scale) / 2}px, 0)`
      raf = requestAnimationFrame(tick)
    }

    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      if (t?.closest('a, button, [data-cursor-hover]')) hoverRef.current = true
    }
    const out = (e: MouseEvent) => {
      const rt = e.relatedTarget as HTMLElement | null
      if (!rt?.closest('a, button, [data-cursor-hover]')) hoverRef.current = false
    }

    window.addEventListener('mousemove', move, { passive: true })
    document.addEventListener('mouseover', over, true)
    document.addEventListener('mouseout', out, true)
    const onDown = () => {
      downRef.current = true
    }
    const onUp = () => {
      downRef.current = false
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', move)
      document.removeEventListener('mouseover', over, true)
      document.removeEventListener('mouseout', out, true)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  return <div ref={dot} className="landing-cursor" aria-hidden />
}
