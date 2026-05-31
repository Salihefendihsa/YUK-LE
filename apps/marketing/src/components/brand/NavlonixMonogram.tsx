import type { SVGProps } from 'react'

const MARK_RX = 64 * 0.24
const STROKE = 6.75

const strokeProps = {
  stroke: '#FFFFFF',
  strokeWidth: STROKE,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  shapeRendering: 'geometricPrecision' as const,
}

/** Turuncu yuvarlak kare + beyaz N/oklar — statik vektör mark. */
export function NavlonixMonogram({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
      {...props}
    >
      <rect width="64" height="64" rx={MARK_RX} fill="#FF7A1A" />
      <path d="M16 48 L16 21" {...strokeProps} />
      <path d="M48 48 L48 21" {...strokeProps} />
      <path d="M16 21 L48 48" {...strokeProps} />
      <path d="M9 28 L16 19 L23 28" {...strokeProps} />
      <path d="M41 28 L48 19 L55 28" {...strokeProps} />
    </svg>
  )
}
