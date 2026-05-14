import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  variant?: 'orange' | 'gold' | 'white'
}

export function ShimmerText({ children, variant = 'orange' }: Props) {
  return <span className={`shimmer-text shimmer-${variant}`}>{children}</span>
}
