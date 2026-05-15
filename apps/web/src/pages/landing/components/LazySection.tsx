import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react'

interface LazySectionProps {
  children: ReactNode
  fallback?: ReactNode
  rootMargin?: string
  minHeight?: string
  id?: string
}

export function LazySection({
  children,
  fallback,
  rootMargin = '400px',
  minHeight = '600px',
  id,
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (shouldRender) return

    const element = ref.current
    if (!element) return

    if (!('IntersectionObserver' in window)) {
      setShouldRender(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldRender(true)
          observer.disconnect()
        }
      },
      {
        rootMargin,
        threshold: 0,
      },
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [shouldRender, rootMargin])

  const defaultFallback = (
    <div
      className="lazy-section-placeholder"
      style={{ minHeight, width: '100%' }}
      aria-hidden
    />
  )

  return (
    <div ref={ref} id={id} style={{ minHeight: shouldRender ? undefined : minHeight }}>
      {shouldRender ? (
        <Suspense fallback={fallback ?? defaultFallback}>{children}</Suspense>
      ) : (
        (fallback ?? defaultFallback)
      )}
    </div>
  )
}
