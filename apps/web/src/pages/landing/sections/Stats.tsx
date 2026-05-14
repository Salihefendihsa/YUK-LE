import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CssParticles } from '../components/Particles'

type StatItem = {
  key: string
  /** animate 0 → endValue for counter */
  endValue: number
  format: (v: number) => string
}

const stats: StatItem[] = [
  { key: 'f', endValue: 500, format: (v) => `${Math.round(v)}+` },
  { key: 'd', endValue: 2000, format: (v) => `${Math.round(v).toLocaleString('tr-TR')}+` },
  { key: 't', endValue: 50000, format: (v) => `${Math.round(v / 1000)}K+` },
  { key: 's', endValue: 99.8, format: (v) => `${v.toFixed(1)}%` },
]

const labels = ['Aktif fabrika', 'Şoför', 'Sefer', 'Memnuniyet']

export function StatsSection({ reduceMotion }: { reduceMotion: boolean }) {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const nums = [...el.querySelectorAll<HTMLElement>('[data-stat-val]')]

    const applyFinal = () => {
      stats.forEach((s, i) => {
        const node = nums[i]
        if (node) node.textContent = s.format(s.endValue)
      })
    }

    if (reduceMotion) {
      applyFinal()
      return
    }

    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        stats.forEach((s, i) => {
          const node = nums[i]
          if (!node) return
          const obj = { v: 0 }
          gsap.to(obj, {
            v: s.endValue,
            duration: 2.1,
            ease: 'power2.out',
            onUpdate: () => {
              node.textContent = s.format(obj.v)
            },
          })
        })
      },
    })
    return () => st.kill()
  }, [reduceMotion])

  return (
    <section ref={root} className="landing-stats" id="stats">
      <CssParticles count={reduceMotion ? 24 : 48} />
      <div className="landing-stats__grid">
        {labels.map((label, i) => (
          <div key={label} className="landing-stats__cell">
            <div className="landing-stats__num" data-stat-val>
              {stats[i]!.format(0)}
            </div>
            <div className="landing-stats__line" />
            <p className="landing-stats__label">{label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
