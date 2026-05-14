export function FloatingParticles() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: `${(i * 37) % 100}%`,
    size: 1 + (i % 4),
    duration: 15 + (i % 10),
    delay: -(i * 1.3),
    opacity: 0.2 + (i % 5) * 0.1,
  }))

  return (
    <div className="particles-wrapper" aria-hidden>
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
