import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function usePixelNavigate() {
  const navigate = useNavigate()
  const [active, setActive] = useState(false)

  const go = (to: string) => {
    setActive(true)
    window.setTimeout(() => {
      navigate(to)
      setActive(false)
    }, 650)
  }

  const overlay = active ? (
    <div className="landing-pixel-nav" aria-hidden>
      {Array.from({ length: 400 }).map((_, i) => (
        <span
          key={i}
          className="landing-pixel-nav__cell"
          style={{ animationDelay: `${(i % 20) * 18}ms` }}
        />
      ))}
    </div>
  ) : null

  return { go, overlay }
}
