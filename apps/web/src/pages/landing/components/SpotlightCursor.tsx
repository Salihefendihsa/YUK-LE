import { useEffect, useRef } from 'react'

type Props = {
  disabled?: boolean
}

export function SpotlightCursor({ disabled }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (disabled) return
    const el = ref.current
    if (!el) return

    const handler = (e: MouseEvent) => {
      const parent = el.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      el.style.background = `radial-gradient(600px circle at ${x}px ${y}px, rgba(255, 107, 0, 0.08), transparent 40%)`
    }

    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [disabled])

  if (disabled) return null

  return <div ref={ref} className="spotlight-cursor" aria-hidden />
}
