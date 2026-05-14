import { useMemo } from 'react'

/** Lightweight CSS particles for stats / CTA sections */
export function CssParticles({ count = 48 }: { count?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: `${(i * 17) % 100}%`,
        top: `${(i * 23) % 100}%`,
        delay: `${(i % 10) * 0.4}s`,
        dur: `${4 + (i % 5)}s`,
      })),
    [count],
  )

  return (
    <div className="landing-css-particles" aria-hidden>
      {items.map((p) => (
        <span
          key={p.id}
          className="landing-css-particles__dot"
          style={{ left: p.left, top: p.top, animationDelay: p.delay, animationDuration: p.dur }}
        />
      ))}
    </div>
  )
}
