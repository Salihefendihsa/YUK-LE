const cities = [
  { name: 'İstanbul', x: 180, y: 80, size: 'lg' as const, factories: 487 },
  { name: 'Ankara', x: 380, y: 150, size: 'md' as const, factories: 312 },
  { name: 'İzmir', x: 120, y: 200, size: 'md' as const, factories: 234 },
  { name: 'Bursa', x: 200, y: 130, size: 'sm' as const, factories: 178 },
  { name: 'Antalya', x: 260, y: 280, size: 'sm' as const, factories: 142 },
  { name: 'Adana', x: 460, y: 240, size: 'sm' as const, factories: 156 },
  { name: 'Gaziantep', x: 540, y: 220, size: 'sm' as const, factories: 128 },
  { name: 'Konya', x: 340, y: 220, size: 'sm' as const, factories: 98 },
  { name: 'Kayseri', x: 460, y: 180, size: 'sm' as const, factories: 87 },
  { name: 'Samsun', x: 460, y: 80, size: 'sm' as const, factories: 76 },
  { name: 'Trabzon', x: 580, y: 100, size: 'sm' as const, factories: 54 },
  { name: 'Erzurum', x: 640, y: 140, size: 'sm' as const, factories: 42 },
  { name: 'Diyarbakır', x: 600, y: 220, size: 'sm' as const, factories: 67 },
  { name: 'Van', x: 700, y: 180, size: 'sm' as const, factories: 38 },
]

const routes = [
  { from: 'İstanbul', to: 'Ankara' },
  { from: 'İstanbul', to: 'İzmir' },
  { from: 'Ankara', to: 'Adana' },
  { from: 'İzmir', to: 'Antalya' },
  { from: 'Ankara', to: 'Konya' },
  { from: 'Gaziantep', to: 'Adana' },
  { from: 'Samsun', to: 'Ankara' },
]

const cityByName = Object.fromEntries(cities.map((c) => [c.name, c]))

/** Stylized horizontal silhouette — geometric, not cartographic */
const TURKEY_PATH =
  'M 40 200 Q 30 120 95 85 Q 140 55 220 72 Q 280 78 320 110 Q 360 95 420 105 Q 520 100 600 125 Q 680 118 740 145 Q 775 175 765 220 Q 758 280 720 310 Q 660 345 580 330 Q 500 318 440 295 Q 380 305 300 285 Q 220 295 150 270 Q 80 250 45 220 Z'

function dotRadius(size: 'lg' | 'md' | 'sm') {
  if (size === 'lg') return 6
  if (size === 'md') return 4
  return 3
}

type Props = {
  reduceMotion?: boolean
}

export function TurkeyMap({ reduceMotion = false }: Props) {
  const routePaths = routes
    .map((r, index) => {
      const from = cityByName[r.from]
      const to = cityByName[r.to]
      if (!from || !to) return null
      const midX = (from.x + to.x) / 2
      const midY = (from.y + to.y) / 2 - 20
      return {
        key: `${r.from}-${r.to}`,
        d: `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`,
        delay: index * 0.4,
      }
    })
    .filter(Boolean) as { key: string; d: string; delay: number }[]

  return (
    <div className="map-container">
      <svg
        className="turkey-map-svg"
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Türkiye üzerinde aktif lojistik ağı"
      >
        <defs>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff6b00" stopOpacity="0" />
            <stop offset="50%" stopColor="#ff6b00" stopOpacity="1" />
            <stop offset="100%" stopColor="#ff8c42" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path className="turkey-outline" d={TURKEY_PATH} />

        {routePaths.map((rp) => (
          <path
            key={rp.key}
            d={rp.d}
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="1.5"
            pathLength={100}
            strokeDasharray={100}
            strokeDashoffset={100}
            strokeLinecap="round"
            className={reduceMotion ? 'route-line route-line--static' : 'route-line'}
            style={{ animationDelay: `${rp.delay}s` }}
          />
        ))}

        {cities.map((city, i) => {
          const r = dotRadius(city.size)
          const pulseClass = reduceMotion ? 'city-pulse-ring city-pulse-ring--static' : 'city-pulse-ring'
          const tipX = Math.min(city.x + 8, 620)
          const tipY = city.y - 38
          return (
            <g key={city.name} className="city-group">
              <circle cx={city.x} cy={city.y} r={18} fill="transparent" className="city-hit" />
              <g transform={`translate(${city.x} ${city.y})`}>
                <circle
                  r={r}
                  fill="none"
                  stroke="#ff6b00"
                  strokeOpacity={0.4}
                  className={pulseClass}
                  style={{ animationDelay: `${(i % 12) * 0.2}s` }}
                />
              </g>
              <circle cx={city.x} cy={city.y} r={r} fill="#ff6b00" className="city-dot" />
              <g className="city-tooltip-svg" pointerEvents="none">
                <rect
                  x={tipX}
                  y={tipY}
                  width="168"
                  height="44"
                  rx="10"
                  className="city-tooltip-bg"
                />
                <text x={tipX + 14} y={tipY + 20} className="city-tooltip-title">
                  {city.name}
                </text>
                <text x={tipX + 14} y={tipY + 36} className="city-tooltip-sub">
                  {city.factories} fabrika
                </text>
              </g>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
