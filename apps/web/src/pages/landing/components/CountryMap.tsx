import { useEffect, useMemo, useState } from 'react'
import type { City, CitySize, CountryConfig } from '../data/countries'

type Props = {
  country: CountryConfig
  onBackToGlobe: () => void
  reduceMotion?: boolean
}

function parseViewBoxDims(viewBox: string): { w: number; h: number } {
  const parts = viewBox.trim().split(/\s+/).map(Number)
  const w = parts[2]
  const h = parts[3]
  return {
    w: Number.isFinite(w) && w > 0 ? w : 980,
    h: Number.isFinite(h) && h > 0 ? h : 470,
  }
}

function parseRootViewBox(svgText: string): string | null {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  const root = doc.documentElement
  if (!root || root.tagName.toLowerCase() !== 'svg') return null
  const vb = root.getAttribute('viewBox')?.trim()
  if (vb) return vb
  const wAttr = root.getAttribute('width')
  const hAttr = root.getAttribute('height')
  if (wAttr && hAttr) {
    const w = parseFloat(wAttr.replace(/px$/i, ''))
    const h = parseFloat(hAttr.replace(/px$/i, ''))
    if (Number.isFinite(w) && Number.isFinite(h)) return `0 0 ${w} ${h}`
  }
  return null
}

function extractMainPathD(svgText: string): string | null {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  const paths = [...doc.querySelectorAll('path[d]')]
  let best = ''
  for (const p of paths) {
    const d = p.getAttribute('d')?.trim() ?? ''
    if (d.length > best.length) best = d
  }
  return best.length > 30 ? best : null
}

function isBadSvgPayload(text: string): boolean {
  const t = text.trimStart()
  return t.startsWith('<!') || !t.includes('<svg') || t.includes('Wikimedia Error') || t.toLowerCase().includes('<html')
}

function projectCity(
  city: City,
  bounds: CountryConfig['bounds'],
  vbW: number,
  vbH: number,
): { x: number; y: number } {
  const x = ((city.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * vbW
  const y = ((bounds.maxLat - city.lat) / (bounds.maxLat - bounds.minLat)) * vbH
  return { x, y }
}

function getSize(size: CitySize): number {
  switch (size) {
    case 'xl':
      return 8
    case 'lg':
      return 6
    case 'md':
      return 5
    default:
      return 4
  }
}

function showCityLabel(size: CitySize): boolean {
  return size === 'xl' || size === 'lg' || size === 'md'
}

export function CountryMap({ country, onBackToGlobe, reduceMotion = false }: Props) {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null)
  const [outlinePath, setOutlinePath] = useState<string | null>(null)
  const [usePlaceholder, setUsePlaceholder] = useState(false)
  const [effectiveViewBox, setEffectiveViewBox] = useState(country.viewBox)

  useEffect(() => {
    const ac = new AbortController()
    let cancelled = false

    setOutlinePath(null)
    setUsePlaceholder(false)
    setEffectiveViewBox(country.viewBox)

    async function load() {
      try {
        const res = await fetch(country.svgPath, { signal: ac.signal })
        const text = await res.text()
        if (cancelled) return
        if (!res.ok || isBadSvgPayload(text)) {
          setUsePlaceholder(true)
          return
        }
        const d = extractMainPathD(text)
        const rootVb = parseRootViewBox(text)
        if (rootVb) setEffectiveViewBox(rootVb)
        if (d) {
          setOutlinePath(d)
          setUsePlaceholder(false)
        } else {
          setUsePlaceholder(true)
        }
      } catch {
        if (!cancelled) setUsePlaceholder(true)
      }
    }

    void load()
    return () => {
      cancelled = true
      ac.abort()
    }
  }, [country.svgPath, country.viewBox, country.code])

  const { w: vbW, h: vbH } = useMemo(() => parseViewBoxDims(effectiveViewBox), [effectiveViewBox])

  const cities = useMemo(() => {
    return country.cities.map((c) => ({
      ...c,
      ...projectCity(c, country.bounds, vbW, vbH),
    }))
  }, [country.bounds, country.cities, vbW, vbH])

  const cityByName = useMemo(() => Object.fromEntries(cities.map((c) => [c.name, c])), [cities])
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

      <svg viewBox={effectiveViewBox} className="country-svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label={country.name}>
        <defs>
          <linearGradient id={`grad-${code}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 107, 0, 0.12)" />
            <stop offset="100%" stopColor="rgba(255, 107, 0, 0.04)" />
          </linearGradient>
          <linearGradient id={`route-${code}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff6b00" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffb627" stopOpacity="1" />
            <stop offset="100%" stopColor="#ff6b00" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={`glow-${code}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff6b00" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ff6b00" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g className="country-grid" opacity="0.35" aria-hidden>
          {Array.from({ length: 21 }, (_, i) => (
            <line
              key={`v${i}`}
              x1={(i * vbW) / 20}
              y1="0"
              x2={(i * vbW) / 20}
              y2={vbH}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
            />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <line
              key={`h${i}`}
              x1="0"
              y1={(i * vbH) / 9}
              x2={vbW}
              y2={(i * vbH) / 9}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
            />
          ))}
        </g>

        {usePlaceholder ? (
          <g aria-hidden>
            <rect
              x={vbW * 0.08}
              y={vbH * 0.12}
              width={vbW * 0.84}
              height={vbH * 0.76}
              rx={Math.min(vbW, vbH) * 0.04}
              fill="rgba(255,255,255,0.02)"
              stroke="rgba(255,107,0,0.25)"
              strokeWidth="1.5"
              strokeDasharray="8 6"
            />
            <text
              x={vbW / 2}
              y={vbH / 2 - 8}
              textAnchor="middle"
              fill="rgba(255,255,255,0.35)"
              fontSize="13"
              fontWeight="600"
            >
              Harita yüklenemedi
            </text>
            <text x={vbW / 2} y={vbH / 2 + 14} textAnchor="middle" fill="rgba(255,182,39,0.85)" fontSize="12" fontWeight="700">
              Yakında
            </text>
          </g>
        ) : outlinePath ? (
          <path
            d={outlinePath}
            fill={`url(#grad-${code})`}
            stroke="rgba(255, 107, 0, 0.5)"
            strokeWidth="1.5"
            className="country-outline-path"
          />
        ) : (
          <text x={vbW / 2} y={vbH / 2} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="14">
            Harita yükleniyor...
          </text>
        )}

        {country.routes?.map((route, i) => {
          const from = cityByName[route[0]]
          const to = cityByName[route[1]]
          if (!from || !to) return null
          const midX = (from.x + to.x) / 2
          const midY = (from.y + to.y) / 2 - 30
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

        {cities.map((city, i) => {
          const r = getSize(city.size)
          const fill = city.highlighted ? '#ffb627' : '#ff6b00'
          return (
            <g
              key={city.name}
              onMouseEnter={() => setHoveredCity(city.name)}
              onMouseLeave={() => setHoveredCity(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={city.x} cy={city.y} r="20" fill={`url(#glow-${code})`} opacity={0.45} />
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
                  fill="rgba(255,255,255,0.85)"
                  fontSize="11"
                  fontWeight="600"
                  className="country-city-label"
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
