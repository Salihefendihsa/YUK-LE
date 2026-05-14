const cities = [
  { name: 'İstanbul', x: 175, y: 145, size: 'lg' as const, factories: 487 },
  { name: 'Bursa', x: 195, y: 165, size: 'md' as const, factories: 178 },
  { name: 'Ankara', x: 355, y: 175, size: 'lg' as const, factories: 312 },
  { name: 'İzmir', x: 130, y: 195, size: 'md' as const, factories: 234 },
  { name: 'Antalya', x: 275, y: 230, size: 'sm' as const, factories: 142 },
  { name: 'Konya', x: 330, y: 215, size: 'sm' as const, factories: 98 },
  { name: 'Kayseri', x: 430, y: 195, size: 'sm' as const, factories: 87 },
  { name: 'Adana', x: 425, y: 230, size: 'sm' as const, factories: 156 },
  { name: 'Gaziantep', x: 495, y: 220, size: 'sm' as const, factories: 128 },
  { name: 'Samsun', x: 420, y: 135, size: 'sm' as const, factories: 76 },
  { name: 'Trabzon', x: 540, y: 142, size: 'sm' as const, factories: 54 },
  { name: 'Erzurum', x: 620, y: 160, size: 'sm' as const, factories: 42 },
  { name: 'Diyarbakır', x: 560, y: 210, size: 'sm' as const, factories: 67 },
  { name: 'Van', x: 670, y: 190, size: 'sm' as const, factories: 38 },
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

const TURKEY_PATH =
  'M 90 180 Q 75 175 70 165 Q 65 155 75 145 Q 90 138 105 142 L 130 138 Q 145 135 160 132 L 185 128 Q 205 122 225 120 L 250 118 Q 275 115 305 112 L 345 108 Q 385 105 425 102 L 470 100 Q 510 98 555 100 L 600 105 Q 640 110 670 118 L 700 128 Q 720 138 730 152 Q 735 165 730 178 L 720 195 Q 710 208 695 215 L 670 225 Q 645 232 615 235 L 580 238 Q 545 240 510 242 L 470 245 Q 430 248 390 250 L 350 252 Q 310 252 275 252 L 240 248 Q 210 244 185 238 L 160 230 Q 140 222 125 212 Q 110 202 100 192 Z'

function dotRadius(size: 'lg' | 'md' | 'sm') {
  if (size === 'lg') return 5
  if (size === 'md') return 4
  return 3
}

function showPermanentCityLabel(city: (typeof cities)[number]) {
  return city.size === 'lg' || city.name === 'İzmir' || city.name === 'Adana'
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
          <linearGradient id="turkeyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 107, 0, 0.08)" />
            <stop offset="50%" stopColor="rgba(255, 255, 255, 0.04)" />
            <stop offset="100%" stopColor="rgba(255, 107, 0, 0.06)" />
          </linearGradient>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff6b00" stopOpacity="0" />
            <stop offset="30%" stopColor="#ffb627" stopOpacity="1" />
            <stop offset="70%" stopColor="#ff6b00" stopOpacity="1" />
            <stop offset="100%" stopColor="#ffb627" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path className="turkey-outline" d={TURKEY_PATH} />

        {routePaths.map((rp) => (
          <path
            key={rp.key}
            d={rp.d}
            fill="none"
            stroke="url(#routeGradient)"
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
          const pulseClass = reduceMotion ? 'city-pulse city-pulse--static' : 'city-pulse'
          const tipX = Math.min(city.x + 8, 620)
          const tipY = city.y - 38
          const showLabel = showPermanentCityLabel(city)
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
                  style={{ animationDelay: `${(i % 12) * 0.3}s` }}
                />
              </g>
              <circle cx={city.x} cy={city.y} r={r} fill="#ff6b00" className="city-dot" />
              {showLabel ? (
                <text
                  x={city.x + 10}
                  y={city.y + 4}
                  className="city-label"
                  fill="rgba(255, 255, 255, 0.7)"
                  fontSize={11}
                  fontWeight={500}
                >
                  {city.name}
                </text>
              ) : null}
              <g className="city-tooltip-svg" pointerEvents="none">
                <rect x={tipX} y={tipY} width="168" height="44" rx="10" className="city-tooltip-bg" />
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
