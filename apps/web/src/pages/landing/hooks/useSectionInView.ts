import { useEffect, useState, type RefObject } from 'react'

export function useSectionInView(
  ref: RefObject<HTMLElement | null>,
  rootMargin = '120px 0px',
) {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { rootMargin, threshold: 0.05 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, rootMargin])

  return inView
}
