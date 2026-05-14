import type { HTMLAttributes } from 'react'

/** Landing tarzı cam panel — yalnızca görsel sarmalayıcı */
export default function GlassCard({ className = '', children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`glass-card ${className}`.trim()} {...rest}>
      {children}
    </div>
  )
}
