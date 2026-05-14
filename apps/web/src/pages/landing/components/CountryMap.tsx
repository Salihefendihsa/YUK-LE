import { useMemo, useState } from 'react'
import { geoEqualEarth, geoMercator, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Feature, FeatureCollection, Polygon } from 'geojson'
import worldTopology from 'world-atlas/countries-110m.json'
import type { City, CitySize, CountryConfig } from '../data/countries'

const VIEWBOX_WIDTH = 1000
const VIEWBOX_HEIGHT = 600
const MAP_PAD = 40

/** Singapore is omitted from 110m countries; use a tight bbox so d3 fitExtent still works. */
const SG_FALLBACK: Feature<Polygon> = {
  type: 'Feature',
  id: '702',
  properties: { name: 'Singapore' },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [103.59, 1.16],
        [104.12, 1.16],
        [104.12, 1.48],
        [103.59, 1.48],
        [103.59, 1.16],
      ],
    ],
  },
}

const worldCountries = feature(
  worldTopology as never,
  (worldTopology as { objects: { countries: unknown } }).objects.countries as never,
) as unknown as FeatureCollection

function resolveCountryFeature(country: CountryConfig): Feature | undefined {
  const hit = worldCountries.features.find((f) => f.id != null && String(f.id) === country.isoNumeric)
  if (hit) return hit
  if (country.code === 'sg') return SG_FALLBACK
  return undefined
}

function useEqualEarth(code: string): boolean {
  return code === 'us' || code === 'au' || code === 'br' || code === 'sg'
}

function getSize(size: CitySize): number {
  switch (size) {
    case 'xl':
      return 7
    case 'lg':
      return 5.5
    case 'md':
      return 4.5
    default:
      return 3.5
  }
}

function showCityLabel(size: CitySize): boolean {
  return size === 'xl' || size === 'lg' || size === 'md'
}

type Props = {
  country: CountryConfig
  onBackToGlobe: () => void
  reduceMotion?: boolean
}

export function CountryMap({ country, onBackToGlobe, reduceMotion = false }: Props) {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null)

  const { countryPath, cityPositions } = useMemo(() => {
    const countryFeature = resolveCountryFeature(country)
    if (!countryFeature?.geometry) {
      return { countryPath: null as string | null, cityPositions: [] as Array<City & { x: number; y: number }> }
    }

    const base = useEqualEarth(country.code) ? geoEqualEarth() : geoMercator()
    const projection = base.fitExtent(
      [
        [MAP_PAD, MAP_PAD],
        [VIEWBOX_WIDTH - MAP_PAD, VIEWBOX_HEIGHT - MAP_PAD],
      ],
      countryFeature,
    )

    const pathGen = geoPath(projection)
    const pathString = pathGen(countryFeature)
    if (!pathString) {
      return { countryPath: null, cityPositions: [] }
    }

    const positions = country.cities.map((city) => {
      const projected = projection([city.lng, city.lat])
      const x = projected?.[0] ?? 0
      const y = projected?.[1] ?? 0
      return { ...city, x, y }
    })

    return { countryPath: pathString, cityPositions: positions }
  }, [country])

  const cityByName = useMemo(() => Object.fromEntries(cityPositions.map((c) => [c.name, c])), [cityPositions])
  const code = country.code

  return (
    <div className="country-map">
      <button type="button" className="country-back-btn" onClick={onBackToGlobe}>
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

      <div className="country-header">
        <span className="country-flag" aria-hidden>
          {country.flag}
        </span>
        <div className="country-header-text">
          <h3 className="country-name">{country.name}</h3>
          <p className="country-hub">{country.hubInfo}</p>
        </div>
        {country.status === 'coming_soon' ? <span className="country-badge-coming">Yakında</span> : null}
      </div>

      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        className="country-svg"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={country.name}
      >
        <defs>
          <linearGradient id={`grad-${code}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 107, 0, 0.14)" />
            <stop offset="100%" stopColor="rgba(255, 107, 0, 0.04)" />
          </linearGradient>
          <linearGradient id={`route-${code}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff6b00" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffb627" stopOpacity="1" />
            <stop offset="100%" stopColor="#ff6b00" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={`glow-${code}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff6b00" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ff6b00" stopOpacity="0" />
          </radialGradient>
        </defs>

        {countryPath ? (
          <path
            d={countryPath}
            fill={`url(#grad-${code})`}
            stroke="rgba(255, 107, 0, 0.55)"
            strokeWidth="1.5"
            strokeLinejoin="round"
            className="country-outline-path"
          />
        ) : (
          <text x={VIEWBOX_WIDTH / 2} y={VIEWBOX_HEIGHT / 2} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="14">
            Harita bulunamadı
          </text>
        )}

        {country.routes?.map((route, i) => {
          const from = cityByName[route[0]]
          const to = cityByName[route[1]]
          if (!from || !to) return null
          const midX = (from.x + to.x) / 2
          const midY = (from.y + to.y) / 2 - 40
          return (
            <path
              key={`${route[0]}-${route[1]}-${i}`}
              d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
              fill="none"
              stroke={`url(#route-${code})`}
              strokeWidth="1.5"
              pathLength={100}
              strokeDasharray={100}
              strokeDashoffset={100}
              strokeLinecap="round"
              className={reduceMotion ? 'country-route country-route--static' : 'country-route'}
              style={{ animationDelay: `${i * 0.4}s` }}
            />
          )
        })}

        {cityPositions.map((city, i) => {
          const r = getSize(city.size)
          const fill = city.highlighted ? '#ffb627' : '#ff6b00'
          return (
            <g
              key={city.name}
              onMouseEnter={() => setHoveredCity(city.name)}
              onMouseLeave={() => setHoveredCity(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={city.x} cy={city.y} r="18" fill={`url(#glow-${code})`} opacity={0.45} />
              {!reduceMotion ? (
                <circle
                  cx={city.x}
                  cy={city.y}
                  r={r}
                  fill="none"
                  stroke="#ff6b00"
                  strokeOpacity={0.5}
                  className="country-city-pulse"
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
                className="country-city-dot"
              />
              {showCityLabel(city.size) ? (
                <text
                  x={city.x + r + 6}
                  y={city.y + 4}
                  fill="rgba(255,255,255,0.9)"
                  fontSize="11"
                  fontWeight="600"
                  className="country-city-label"
                  style={{ pointerEvents: 'none' }}
                >
                  {city.name}
                </text>
              ) : null}
              {hoveredCity === city.name ? (
                <g style={{ pointerEvents: 'none' }}>
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
                  {city.factories != null ? (
                    <text x={city.x + 20} y={city.y - 8} fill="#ffb627" fontSize="11" fontWeight="600">
                      {city.factories} fabrika
                    </text>
                  ) : null}
                </g>
              ) : null}
            </g>
          )
        })}
      </svg>

      <div className="country-caption">
        <span className="country-caption-dot" aria-hidden />
        <span>
          {country.cities.length} şehir
          {country.status === 'active' ? ' · Aktif operasyon' : ' · Yakında aktif'}
        </span>
      </div>
    </div>
  )
}
