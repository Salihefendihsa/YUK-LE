import { useState } from 'react'

const TURKEY_PATH =
  'M 80 220 C 70 210, 65 195, 75 185 L 95 175 C 120 168, 145 162, 175 160 L 220 158 C 260 155, 305 152, 355 148 L 420 144 C 480 140, 540 138, 600 138 L 670 140 C 730 142, 780 148, 820 158 L 860 170 C 890 180, 910 195, 920 215 L 925 240 C 920 260, 905 275, 880 285 L 840 295 C 800 302, 750 308, 690 312 L 620 315 C 555 318, 490 320, 425 320 L 360 318 C 310 315, 265 308, 225 298 L 195 290 C 165 280, 140 265, 115 248 L 95 235 Z'

type CitySize = 'xl' | 'lg' | 'md' | 'sm'

type TurkeyCity = {
  name: string
  x: number
  y: number
  size: CitySize
  factories: number
  region: string
  highlighted?: boolean
}

const TURKEY_CITIES: TurkeyCity[] = [
  { name: 'İstanbul', x: 215, y: 175, size: 'xl', factories: 487, region: 'marmara' },
  { name: 'Ankara', x: 470, y: 205, size: 'xl', factories: 312, region: 'central' },
  { name: 'İzmir', x: 150, y: 230, size: 'lg', factories: 234, region: 'aegean' },
  { name: 'Adana', x: 545, y: 265, size: 'lg', factories: 156, region: 'mediterranean' },
  { name: 'Bursa', x: 235, y: 200, size: 'md', factories: 178, region: 'marmara' },
  { name: 'Antalya', x: 360, y: 280, size: 'md', factories: 142, region: 'mediterranean' },
  { name: 'Gaziantep', x: 625, y: 270, size: 'md', factories: 128, region: 'southeast' },
  { name: 'Konya', x: 425, y: 245, size: 'md', factories: 98, region: 'central' },
  { name: 'Kayseri', x: 555, y: 225, size: 'md', factories: 87, region: 'central' },
  { name: 'Mersin', x: 510, y: 280, size: 'md', factories: 89, region: 'mediterranean' },
  { name: 'Samsun', x: 530, y: 165, size: 'sm', factories: 76, region: 'blacksea' },
  { name: 'Trabzon', x: 660, y: 175, size: 'sm', factories: 54, region: 'blacksea' },
  { name: 'Diyarbakır', x: 685, y: 250, size: 'sm', factories: 67, region: 'southeast' },
  { name: 'Eskişehir', x: 360, y: 200, size: 'sm', factories: 62, region: 'central' },
  { name: 'Elazığ', x: 650, y: 225, size: 'md', factories: 48, region: 'east', highlighted: true },
  { name: 'Malatya', x: 615, y: 240, size: 'sm', factories: 41, region: 'east' },
  { name: 'Erzurum', x: 745, y: 195, size: 'sm', factories: 42, region: 'east' },
  { name: 'Van', x: 800, y: 235, size: 'sm', factories: 38, region: 'east' },
  { name: 'Şanlıurfa', x: 645, y: 280, size: 'sm', factories: 58, region: 'southeast' },
]

const TURKEY_ROUTES = [
  { from: 'İstanbul', to: 'Ankara' },
  { from: 'İstanbul', to: 'İzmir' },
  { from: 'Ankara', to: 'Adana' },
  { from: 'Ankara', to: 'Elazığ' },
  { from: 'İzmir', to: 'Antalya' },
  { from: 'Gaziantep', to: 'Elazığ' },
  { from: 'Samsun', to: 'Ankara' },
  { from: 'Konya', to: 'Antalya' },
] as const

const cityByName = Object.fromEntries(TURKEY_CITIES.map((c) => [c.name, c]))

function getSize(size: CitySize) {
  switch (size) {
    case 'xl':
      return 7
    case 'lg':
      return 6
    case 'md':
      return 5
    default:
      return 4
  }
}

function showCityLabel(city: TurkeyCity) {
  return city.size === 'xl' || city.size === 'lg' || city.size === 'md'
}

type Props = {
  onBackToGlobe: () => void
  reduceMotion?: boolean
}

export function TurkeyDetailMap({ onBackToGlobe, reduceMotion = false }: Props) {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null)

  return (
    <div className="turkey-detail-map">
      <button type="button" className="turkey-back-btn" onClick={onBackToGlobe}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M19 12H5M12 19l-7-7 7-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Dünyaya Dön
      </button>

      <svg viewBox="0 0 1000 460" className="turkey-svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Turkiye sehir agi haritasi">
        <defs>
          <linearGradient id="turkeyDetailGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 107, 0, 0.12)" />
            <stop offset="100%" stopColor="rgba(255, 107, 0, 0.04)" />
          </linearGradient>
          <linearGradient id="turkeyRouteGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff6b00" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffb627" stopOpacity="1" />
            <stop offset="100%" stopColor="#ff6b00" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="cityGlowTurkey" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff6b00" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ff6b00" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g className="turkey-grid" opacity="0.35" aria-hidden>
          {Array.from({ length: 21 }, (_, i) => (
            <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="460" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 50} x2="1000" y2={i * 50} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          ))}
        </g>

        <path
          d={TURKEY_PATH}
          fill="url(#turkeyDetailGradient)"
          stroke="rgba(255, 107, 0, 0.5)"
          strokeWidth="1.5"
          className="turkey-outline-detail"
        />

        {TURKEY_ROUTES.map((route, i) => {
          const from = cityByName[route.from]
          const to = cityByName[route.to]
          if (!from || !to) return null
          const midX = (from.x + to.x) / 2
          const midY = (from.y + to.y) / 2 - 25
          return (
            <path
              key={`${route.from}-${route.to}`}
              d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
              fill="none"
              stroke="url(#turkeyRouteGradient)"
              strokeWidth="1.5"
              pathLength={100}
              strokeDasharray={100}
              strokeDashoffset={100}
              strokeLinecap="round"
              className={reduceMotion ? 'turkey-route turkey-route--static' : 'turkey-route'}
              style={{ animationDelay: `${i * 0.4}s` }}
            />
          )
        })}

        {TURKEY_CITIES.map((city, i) => {
          const r = getSize(city.size)
          const fill = city.highlighted ? '#ffb627' : '#ff6b00'
          return (
            <g
              key={city.name}
              onMouseEnter={() => setHoveredCity(city.name)}
              onMouseLeave={() => setHoveredCity(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={city.x} cy={city.y} r="16" fill="url(#cityGlowTurkey)" opacity={0.45} />
              {!reduceMotion ? (
                <circle
                  cx={city.x}
                  cy={city.y}
                  r={r}
                  fill="none"
                  stroke="#ff6b00"
                  strokeOpacity={0.5}
                  className="turkey-city-pulse"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ) : null}
              <circle
                cx={city.x}
                cy={city.y}
                r={city.highlighted ? r + 1.5 : r}
                fill={fill}
                stroke={city.highlighted ? 'rgba(255, 182, 39, 0.9)' : 'none'}
                strokeWidth={city.highlighted ? 1.5 : 0}
                className="turkey-city-dot"
              />
              {showCityLabel(city) ? (
                <text
                  x={city.x + r + 6}
                  y={city.y + 4}
                  fill="rgba(255,255,255,0.85)"
                  fontSize="11"
                  fontWeight="600"
                  className="turkey-city-label"
                  style={{ pointerEvents: 'none' }}
                >
                  {city.name}
                </text>
              ) : null}
              {hoveredCity === city.name ? (
                <g>
                  <rect
                    x={city.x + 12}
                    y={city.y - 36}
                    width={Math.max(120, city.name.length * 8 + 72)}
                    height="40"
                    rx="8"
                    fill="rgba(9, 11, 14, 0.95)"
                    stroke="rgba(255,107,0,0.45)"
                    strokeWidth="1"
                  />
                  <text x={city.x + 20} y={city.y - 22} fill="#fff" fontSize="11" fontWeight="700">
                    {city.name}
                  </text>
                  <text x={city.x + 20} y={city.y - 8} fill="#ffb627" fontSize="11" fontWeight="600">
                    {city.factories} fabrika
                  </text>
                </g>
              ) : null}
            </g>
          )
        })}
      </svg>

      <div className="turkey-caption">
        <span className="turkey-caption-dot" aria-hidden />
        <span>14 büyük şehir · 81 ilde aktif şoför ağı</span>
      </div>
    </div>
  )
}
