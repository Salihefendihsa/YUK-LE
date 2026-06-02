import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { TurkeyNetworkMap } from '../components/TurkeyNetworkMap'
import { LiveMetrics } from '../components/LiveMetrics'
import { TrustBar } from '../components/TrustBar'
import { COUNTRIES, getCountry } from '../data/countries'

const ease = [0.22, 1, 0.36, 1] as const

/** Haritada yalnızca TR; seçicide öne çıkan birkaç hedef pazar */
const COMING_SOON_CODES = ['de', 'gb', 'ae', 'us'] as const

const TURKEY = getCountry('tr')
const COMING_SOON = COMING_SOON_CODES.map((code) => getCountry(code)).filter(
  (c): c is NonNullable<typeof c> => c != null,
)
const COMING_SOON_SET = new Set<string>(COMING_SOON_CODES)
const MORE_REGIONS_COUNT = COUNTRIES.filter((c) => c.code !== 'tr' && !COMING_SOON_SET.has(c.code)).length

export function JourneySection({ reduceMotion }: { reduceMotion: boolean }) {
  const r = reduceMotion
  const mapStageRef = useRef<HTMLDivElement>(null)
  const [mapReduceMotion, setMapReduceMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [mapLite, setMapLite] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
  )
  const [mapInView, setMapInView] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setMapReduceMotion(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const onChange = () => setMapLite(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const el = mapStageRef.current
    if (!el || mapReduceMotion) {
      setMapInView(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => setMapInView(entry.isIntersecting),
      { root: null, rootMargin: '80px 0px', threshold: 0.12 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [mapReduceMotion])

  return (
    <section className="section-network section-network--story-lead" id="journey">
      <div className="section-network-glow" aria-hidden />
      <div className="section-network-container">
        <motion.header
          data-section-reveal
          className="section-network-header"
          initial={r ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease, delay: r ? 0 : 0.1 }}
        >
          <p className="section-network-eyebrow">
            <span className="eyebrow-dot" aria-hidden />
            TÜRKİYE AĞI
          </p>
          <h2 className="section-network-title">
            <span className="section-network-title-line">Türkiye Genelinde</span>
            <span className="section-network-title-line">Canlı Lojistik Ağı.</span>
          </h2>
          <p className="section-network-subtitle">
            2.847 Fabrika Ve Binlerce Belgeli Şoförle Ulusal Ağımızda Yükünüzü Saniyeler İçinde
            Eşleştirin; Sefer Boyunca Harita Üzerinden Anlık Takip Edin.
          </p>
        </motion.header>

        <motion.div
          ref={mapStageRef}
          data-section-reveal
          className="globe-stage"
          initial={r ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease, delay: r ? 0 : 0.2 }}
        >
          <div className="stage-content">
            <TurkeyNetworkMap
              reduceMotion={mapReduceMotion}
              liteMotion={mapLite && !mapReduceMotion}
              paused={!mapInView && !mapReduceMotion}
            />
          </div>
        </motion.div>

        <motion.div
          data-section-reveal
          className="country-selector country-selector--compact"
          initial={r ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease, delay: r ? 0 : 0.3 }}
        >
          <p className="country-selector-eyebrow">Sıradaki Bölgeler</p>
          <div className="country-selector-track" role="list">
            {TURKEY ? (
              <div
                className="country-chip country-chip--active"
                role="listitem"
                aria-current="true"
              >
                <span className="country-chip-flag" aria-hidden>
                  {TURKEY.flag}
                </span>
                <span className="country-chip-name">{TURKEY.shortName}</span>
                <span className="country-chip-status-active">
                  <span className="country-chip-dot" aria-hidden />
                  Aktif
                </span>
              </div>
            ) : null}
            {COMING_SOON.map((c) => (
              <div
                key={c.code}
                className="country-chip country-chip--soon"
                role="listitem"
                aria-disabled="true"
              >
                <span className="country-chip-flag" aria-hidden>
                  {c.flag}
                </span>
                <span className="country-chip-name">{c.shortName}</span>
                <span className="country-chip-status-soon">Yakında</span>
              </div>
            ))}
            {MORE_REGIONS_COUNT > 0 ? (
              <span className="country-selector-more" role="listitem">
                +{MORE_REGIONS_COUNT} bölge planlanıyor
              </span>
            ) : null}
          </div>
        </motion.div>

        <motion.div
          data-section-reveal
          className="network-metrics-row"
          initial={r ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease, delay: r ? 0 : 0.4 }}
        >
          <LiveMetrics horizontal reduceMotion={r} />
        </motion.div>

        <motion.div
          data-section-reveal
          initial={r ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease, delay: r ? 0 : 0.5 }}
        >
          <TrustBar />
        </motion.div>
      </div>
    </section>
  )
}
