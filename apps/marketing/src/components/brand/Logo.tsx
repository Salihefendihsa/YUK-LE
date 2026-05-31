import type { HTMLAttributes } from 'react'
import { NavlonixMonogram } from './NavlonixMonogram'

export type LogoVariant = 'full' | 'mark' | 'wordmark'
export type LogoSize = 'sm' | 'md' | 'lg'
export type LogoTheme = 'dark' | 'light'

export type LogoProps = {
  variant?: LogoVariant
  size?: LogoSize
  theme?: LogoTheme
  fadeIn?: boolean
} & HTMLAttributes<HTMLSpanElement>

const SIZE_CAP: Record<LogoSize, string> = {
  sm: '14px',
  md: '16px',
  lg: '20px',
}

function Wordmark({ capSize, theme }: { capSize: string; theme: LogoTheme }) {
  const textColor = theme === 'light' ? '#18181b' : '#f4f4f5'

  return (
    <span
      className="whitespace-nowrap leading-none"
      style={{
        fontFamily: 'var(--font-logo), var(--font-display), system-ui, sans-serif',
        fontWeight: 700,
        fontSize: capSize,
        letterSpacing: '-1px',
        color: textColor,
        transform: 'translateY(0.05em)',
      }}
      aria-label="Navlonix"
    >
      Navlonix
    </span>
  )
}

export function Logo({
  variant = 'full',
  size = 'md',
  theme = 'dark',
  fadeIn = false,
  className = '',
  style,
  ...rest
}: LogoProps) {
  const capSize = SIZE_CAP[size]
  const markSize = `calc(${capSize} * 1.5)`
  const gap = `calc(${markSize} * 0.4)`

  const baseStyle = {
    ...style,
    ...(fadeIn ? { animation: 'logo-fade-in 0.45s ease both' } : {}),
  }

  if (variant === 'mark') {
    return (
      <span className={`inline-flex items-center ${className}`} style={baseStyle} {...rest}>
        <NavlonixMonogram
          className="block shrink-0"
          style={{ height: markSize, width: markSize }}
        />
      </span>
    )
  }

  if (variant === 'wordmark') {
    return (
      <span className={`inline-flex items-center ${className}`} style={baseStyle} {...rest}>
        <Wordmark capSize={capSize} theme={theme} />
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center ${className}`} style={baseStyle} {...rest}>
      <span className="inline-flex items-center" style={{ gap }}>
        <NavlonixMonogram
          className="block shrink-0"
          style={{ height: markSize, width: markSize }}
        />
        <Wordmark capSize={capSize} theme={theme} />
      </span>
    </span>
  )
}
