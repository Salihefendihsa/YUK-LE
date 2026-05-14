type SkeletonVariant = 'list' | 'table' | 'card'

export function PageSkeleton({ rows = 4, variant = 'list' }: { rows?: number; variant?: SkeletonVariant }) {
  const height = variant === 'table' ? 36 : variant === 'card' ? 120 : 44
  return (
    <div className="card skeleton-wrap panel-skeleton" aria-busy>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ height, marginBottom: i === rows - 1 ? 0 : 12 }}
        />
      ))}
    </div>
  )
}

export function PageError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-banner panel-error-banner" role="alert" style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      <span>{message || 'Bir hata oluştu. Lütfen tekrar deneyin.'}</span>
      <button className="btn btn-ghost btn-sm" onClick={() => (onRetry ? onRetry() : window.location.reload())}>
        Tekrar Dene
      </button>
    </div>
  )
}

export function PageEmpty({ icon = '📭', title, description, actionLabel, onAction }: { icon?: string; title: string; description: string; actionLabel: string; onAction: () => void }) {
  return (
    <div className="empty-state panel-empty-state">
      <p style={{ fontSize: 28 }}>{icon}</p>
      <strong>{title}</strong>
      <p className="muted" style={{ marginTop: 6 }}>{description}</p>
      <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  )
}
