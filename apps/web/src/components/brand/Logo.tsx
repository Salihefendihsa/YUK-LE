import type { HTMLAttributes } from 'react'
import { NavlonixMonogram } from './NavlonixMonogram'
import './Logo.css'

export type LogoVariant = 'full' | 'mark' | 'wordmark'
export type LogoSize = 'sm' | 'md' | 'lg'
export type LogoTheme = 'dark' | 'light'

export type LogoProps = {
  variant?: LogoVariant
  size?: LogoSize
  theme?: LogoTheme
  fadeIn?: boolean
} & HTMLAttributes<HTMLSpanElement>

function Wordmark() {
  return (
    <span className="logo__wordmark" aria-label="Navlonix">
      Navlonix
    </span>
  )
}

function MarkIcon() {
  return (
    <span className="logo__mark-wrap">
      <NavlonixMonogram className="logo__mark" />
    </span>
  )
}

export function Logo({
  variant = 'full',
  size = 'md',
  theme = 'dark',
  fadeIn = false,
  className = '',
  ...rest
}: LogoProps) {
  const classes = [
    'logo',
    `logo--${size}`,
    theme === 'light' ? 'logo--light' : '',
    fadeIn ? 'logo--fade-in' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (variant === 'mark') {
    return (
      <span className={classes} {...rest}>
        <MarkIcon />
      </span>
    )
  }

  if (variant === 'wordmark') {
    return (
      <span className={classes} {...rest}>
        <Wordmark />
      </span>
    )
  }

  return (
    <span className={classes} {...rest}>
      <span className="logo__lockup">
        <MarkIcon />
        <Wordmark />
      </span>
    </span>
  )
}
