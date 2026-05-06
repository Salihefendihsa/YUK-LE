export function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="card">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ height: 44, marginBottom: i === rows - 1 ? 0 : 12 }}
        />
      ))}
    </div>
  )
}

export function PageError({ message }: { message: string }) {
  return (
    <div className="error-banner" role="alert">
      {message}
    </div>
  )
}
