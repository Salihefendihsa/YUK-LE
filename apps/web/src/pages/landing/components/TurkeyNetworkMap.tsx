import { useMemo } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import type { Feature, FeatureCollection, MultiPolygon } from 'geojson'
import turkeyGeo from '../data/turkey.geo.json'

const VIEWBOX_WIDTH = 1000
const VIEWBOX_HEIGHT = 620
const MAP_PAD = 48

const TURKEY_CITIES = [
  { name: 'İstanbul', lat: 41.0082, lng: 28.9784 },
  { name: 'Ankara', lat: 39.9334, lng: 32.8597 },
  { name: 'İzmir', lat: 38.4192, lng: 27.1287 },
  { name: 'Bursa', lat: 40.1885, lng: 29.061 },
  { name: 'Antalya', lat: 36.8969, lng: 30.7133 },
  { name: 'Adana', lat: 37.0, lng: 35.3213 },
  { name: 'Gaziantep', lat: 37.0662, lng: 37.3833 },
  { name: 'Trabzon', lat: 41.0015, lng: 39.7178 },
] as const

const TURKEY_ROUTES: ReadonlyArray<readonly [string, string]> = [
  ['İstanbul', 'Ankara'],
  ['İstanbul', 'İzmir'],
  ['İstanbul', 'Bursa'],
  ['Ankara', 'Trabzon'],
  ['Ankara', 'Adana'],
  ['İzmir', 'Antalya'],
  ['Adana', 'Gaziantep'],
  ['Ankara', 'Gaziantep'],
  ['Bursa', 'Ankara'],
]

type Props = {
  reduceMotion?: boolean
}

export function TurkeyNetworkMap({ reduceMotion = false }: Props) {
  const { mapPath, cityPositions } = useMemo(() => {
    const collection = turkeyGeo as FeatureCollection<MultiPolygon>
    const feature = collection.features[0] as Feature<MultiPolygon> | undefined
    if (!feature?.geometry) {
      return { mapPath: null as string | null, cityPositions: [] as Array<(typeof TURKEY_CITIES)[number] & { x: number; y: number }> }
    }

    const projection = geoMercator().fitExtent(
      [
        [MAP_PAD, MAP_PAD],
        [VIEWBOX_WIDTH - MAP_PAD, VIEWBOX_HEIGHT - MAP_PAD],
      ],
      feature,
    )

    const pathGen = geoPath(projection)
    const pathString = pathGen(feature)
    if (!pathString) {
      return { mapPath: null, cityPositions: [] }
    }

    const positions = TURKEY_CITIES.map((city) => {
      const projected = projection([city.lng, city.lat])
      return {
        ...city,
        x: projected?.[0] ?? 0,
        y: projected?.[1] ?? 0,
      }
    })

    return { mapPath: pathString, cityPositions: positions }
  }, [])

  const cityByName = useMemo(
    () => Object.fromEntries(cityPositions.map((c) => [c.name, c])),
    [cityPositions],
  )

  return (
    <div className="turkey-network-map">
      <div className="turkey-network-map__ambient" aria-hidden />
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        className="turkey-network-map__svg"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Türkiye operasyon ağı haritası"
      >
        <defs>
          <pattern id="turkey-dot-fill" patternUnits="userSpaceOnUse" width="10" height="10">
            <circle cx="2" cy="2" r="1.1" fill="rgba(255, 107, 0, 0.22)" />
          </pattern>
          <linearGradient id="turkey-map-fill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 107, 0, 0.12)" />
            <stop offset="100%" stopColor="rgba(255, 107, 0, 0.03)" />
          </linearGradient>
          <linearGradient id="turkey-route-flow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff6b00" stopOpacity="0.15" />
            <stop offset="45%" stopColor="#ffb627" stopOpacity="1" />
            <stop offset="100%" stopColor="#ff6b00" stopOpacity="0.15" />
          </linearGradient>
          <radialGradient id="turkey-city-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff6b00" stopOpacity="0.55" />
            <stop offset="70%" stopColor="#ffb627" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ff6b00" stopOpacity="0" />
          </radialGradient>
        </defs>

        {mapPath ? (
          <>
            <path
              d={mapPath}
              fill="url(#turkey-dot-fill)"
              stroke="none"
              className="turkey-network-map__fill-dots"
            />
            <path
              d={mapPath}
              fill="url(#turkey-map-fill)"
              stroke="rgba(255, 107, 0, 0.45)"
              strokeWidth="1.25"
              strokeLinejoin="round"
              className="turkey-network-map__outline"
            />
          </>
        ) : (
          <text
            x={VIEWBOX_WIDTH / 2}
            y={VIEWBOX_HEIGHT / 2}
            textAnchor="middle"
            fill="rgba(255,255,255,0.35)"
            fontSize="14"
          >
            Harita yüklenemedi
          </text>
        )}

        {TURKEY_ROUTES.map((route, i) => {
          const from = cityByName[route[0]]
          const to = cityByName[route[1]]
          if (!from || !to) return null
          const midX = (from.x + to.x) / 2
          const midY = (from.y + to.y) / 2 - 36
          return (
            <path
              key={`${route[0]}-${route[1]}`}
              d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
              fill="none"
              stroke="url(#turkey-route-flow)"
              strokeWidth="1.25"
              pathLength={100}
              strokeDasharray={100}
              strokeDashoffset={100}
              strokeLinecap="round"
              className={
                reduceMotion
                  ? 'turkey-network-route turkey-network-route--static'
                  : 'turkey-network-route'
              }
              style={{ animationDelay: `${i * 0.35}s` }}
            />
          )
        })}

        {cityPositions.map((city, i) => (
          <g key={city.name} className="turkey-network-city">
            <circle cx={city.x} cy={city.y} r="20" fill="url(#turkey-city-glow)" opacity={0.5} />
            {!reduceMotion ? (
              <circle
                cx={city.x}
                cy={city.y}
                r="5"
                fill="none"
                stroke="#ff6b00"
                strokeOpacity={0.45}
                className="turkey-network-city__pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ) : null}
            <circle cx={city.x} cy={city.y} r="4.5" fill="#ff6b00" className="turkey-network-city__core" />
            <circle cx={city.x} cy={city.y} r="2" fill="#ffb627" />
            <text
              x={city.x + 8}
              y={city.y + 4}
              fill="rgba(255,255,255,0.88)"
              fontSize="11"
              fontWeight="600"
              className="turkey-network-city__label"
            >
              {city.name}
            </text>
          </g>
        ))}
      </svg>

      <p className="turkey-network-map__tagline">
        Tüm Türkiye · Canlı Eşleştirme Ve Anlık Takip.
      </p>
    </div>
  )
}
