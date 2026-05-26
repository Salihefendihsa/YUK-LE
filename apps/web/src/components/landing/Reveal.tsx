import { type ReactNode, useRef } from 'react'
import { useScrollReveal } from './hooks/useScrollReveal'

type RevealGroupProps = {
  children: ReactNode
  className?: string
  stagger?: number
  start?: string
}

export function RevealGroup({
  children,
  className,
  stagger = 0.1,
  start = 'top 82%',
}: RevealGroupProps) {
  const ref = useRef<HTMLDivElement>(null)
  useScrollReveal(ref, { stagger, start })

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
