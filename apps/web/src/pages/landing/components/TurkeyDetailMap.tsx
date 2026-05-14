import { useState } from 'react'

/** Natural Earth–style country boundary (GeoJSON), projected with same bounds as cities. Source: `public/assets/turkey.geo.json`. */
const TURKEY_OUTLINE_PATH =
  'M573.58,78.20L645.68,104.17L704.22,93.81L747.49,99.80L806.82,64.75L860.37,61.56L908.77,94.53L917.31,118.16L912.48,150.83L949.85,167.52L969.65,187.13L935.23,206.25L950.92,283.26L941.09,304.05L968.58,357.84L944.49,369.18L926.84,352.08L868.39,343.42L846.80,353.85L789.63,364.29L762.55,363.16L704.72,388.35L663.38,388.56L636.63,375.92L581.30,394.60L564.86,381.54L562.14,418.99L548.68,433.70L535.22,448.41L516.74,417.96L535.77,392.75L505.12,398.46L463.09,383.01L428.53,421.66L352.26,429.21L311.57,393.17L257.39,390.91L245.81,418.77L211.08,426.74L162.47,390.98L107.61,392.19L77.84,325.42L41.12,288.17L65.57,235.96L33.71,203.87L89.46,139.66L166.85,136.97L187.96,85.94L283.74,94.83L344.15,51.28L402.72,32.30L485.86,30.87L573.58,78.20ZM85.05,121.49L43.12,157.65L27.31,126.38L27.99,112.52L39.93,104.99L55.49,62.97L31.01,45.19L82.21,24.07L125.48,33.08L131.45,58.89L175.32,80.58L166.17,97.02L106.49,100.73L85.05,121.49Z'

const TURKEY_VIEWBOX = { w: 980, h: 470 } as const

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

type TurkeyCityInput = Omit<TurkeyCity, 'x' | 'y'> & { lat: number; lng: number }

function projectToSVG(lat: number, lng: number, viewBoxW = TURKEY_VIEWBOX.w, viewBoxH = TURKEY_VIEWBOX.h) {
  const minLng = 25.5
  const maxLng = 45.0
  const minLat = 35.5
  const maxLat = 42.5

  const x = ((lng - minLng) / (maxLng - minLng)) * viewBoxW
  const y = ((maxLat - lat) / (maxLat - minLat)) * viewBoxH

  return { x, y }
}

const TURKEY_CITIES: TurkeyCity[] = (
  [
  { name: 'İstanbul', lat: 41.0, lng: 28.9, factories: 487, size: 'xl', region: 'marmara' },
  { name: 'Bursa', lat: 40.18, lng: 29.0, factories: 178, size: 'md', region: 'marmara' },
  { name: 'İzmir', lat: 38.4, lng: 27.1, factories: 234, size: 'lg', region: 'aegean' },
  { name: 'Ankara', lat: 39.9, lng: 32.8, factories: 312, size: 'xl', region: 'central' },
  { name: 'Eskişehir', lat: 39.7, lng: 30.5, factories: 62, size: 'sm', region: 'central' },
  { name: 'Konya', lat: 37.8, lng: 32.4, factories: 98, size: 'md', region: 'central' },
  { name: 'Kayseri', lat: 38.7, lng: 35.4, factories: 87, size: 'md', region: 'central' },
  { name: 'Antalya', lat: 36.8, lng: 30.7, factories: 142, size: 'md', region: 'mediterranean' },
  { name: 'Mersin', lat: 36.8, lng: 34.6, factories: 89, size: 'md', region: 'mediterranean' },
  { name: 'Adana', lat: 37.0, lng: 35.3, factories: 156, size: 'lg', region: 'mediterranean' },
  { name: 'Elazığ', lat: 38.6, lng: 39.2, factories: 48, size: 'md', region: 'east', highlighted: true },
  { name: 'Malatya', lat: 38.3, lng: 38.3, factories: 41, size: 'sm', region: 'east' },
  { name: 'Erzurum', lat: 39.9, lng: 41.2, factories: 42, size: 'sm', region: 'east' },
  { name: 'Van', lat: 38.4, lng: 43.4, factories: 38, size: 'sm', region: 'east' },
  { name: 'Gaziantep', lat: 37.0, lng: 37.3, factories: 128, size: 'md', region: 'southeast' },
  { name: 'Şanlıurfa', lat: 37.1, lng: 38.7, factories: 58, size: 'sm', region: 'southeast' },
  { name: 'Diyarbakır', lat: 37.9, lng: 40.2, factories: 67, size: 'sm', region: 'southeast' },
  { name: 'Samsun', lat: 41.2, lng: 36.3, factories: 76, size: 'sm', region: 'blacksea' },
  { name: 'Trabzon', lat: 41.0, lng: 39.7, factories: 54, size: 'sm', region: 'blacksea' },
] satisfies TurkeyCityInput[]
).map((c) => {
  const { lat, lng, ...rest } = c
  const { x, y } = projectToSVG(lat, lng)
  return { ...rest, x, y }
})

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
  const viewBoxStr = `0 0 ${TURKEY_VIEWBOX.w} ${TURKEY_VIEWBOX.h}`

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

      <svg
        viewBox={viewBoxStr}
        className="turkey-svg"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Turkiye sehir agi haritasi"
      >
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
            <line
              key={`v${i}`}
              x1={(i * TURKEY_VIEWBOX.w) / 20}
              y1="0"
              x2={(i * TURKEY_VIEWBOX.w) / 20}
              y2={TURKEY_VIEWBOX.h}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
            />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <line
              key={`h${i}`}
              x1="0"
              y1={(i * TURKEY_VIEWBOX.h) / 9}
              x2={TURKEY_VIEWBOX.w}
              y2={(i * TURKEY_VIEWBOX.h) / 9}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
            />
          ))}
        </g>

        <path
          d={TURKEY_OUTLINE_PATH}
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
