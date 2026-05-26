import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { NetworkGlobe } from '../components/NetworkGlobe'
import { CountryMap } from '../components/CountryMap'
import { LiveMetrics } from '../components/LiveMetrics'
import { TrustBar } from '../components/TrustBar'
import { COUNTRIES, getCountry } from '../data/countries'

const ease = [0.22, 1, 0.36, 1] as const

const TURKEY = COUNTRIES.find((c) => c.code === 'tr')

export function JourneySection({ reduceMotion }: { reduceMotion: boolean }) {
  const r = reduceMotion
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const country = selectedCountry ? getCountry(selectedCountry) : null
  const goGlobe = useCallback(() => setSelectedCountry(null), [])
  const stageTransition = r ? { duration: 0 } : { duration: 0.7, ease }

  return (
    <section className="section-network" id="journey">
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
            OPERASYONEL GÜÇ
          </p>
          <h2 className="section-network-title">
            <span className="section-network-title-line">Türkiye&apos;den Başlar,</span>
            <span className="section-network-title-line">Dünyaya Akar.</span>
          </h2>
          <p className="section-network-subtitle">
            Türkiye&apos;de 2.847 fabrika ile başladık, 10 ülkede büyümeye devam ediyoruz.
            Yükünüzü saniyeler içinde eşleştirin, anlık takip edin.
          </p>
        </motion.header>

        <motion.div
          data-section-reveal
          className="globe-stage"
          initial={r ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease, delay: r ? 0 : 0.2 }}
        >
          <AnimatePresence mode="wait">
            {!country ? (
              <motion.div
                key="globe"
                className="stage-content"
                initial={r ? false : { opacity: 0, scale: 1.08 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={r ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.88 }}
                transition={stageTransition}
              >
                <NetworkGlobe reduceMotion={r} />
              </motion.div>
            ) : (
              <motion.div
                key={`country-${country.code}`}
                className="stage-content"
                initial={r ? false : { opacity: 0, scale: 1.08 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={r ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.88 }}
                transition={stageTransition}
              >
                <CountryMap country={country} onBackToGlobe={goGlobe} reduceMotion={r} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {!country ? (
          <motion.div
            data-section-reveal
            className="country-selector"
            initial={r ? false : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease, delay: r ? 0 : 0.3 }}
          >
            <div className="country-selector-title">
              <span className="country-selector-label">Ülke seçin</span>
              <span className="country-selector-arrow" aria-hidden>
                →
              </span>
            </div>

            {TURKEY ? (
              <div className="country-selector-featured">
                <button
                  type="button"
                  className="country-chip country-chip--featured country-chip--active"
                  onClick={() => setSelectedCountry('tr')}
                >
                  <span className="country-chip-flag" aria-hidden>
                    {TURKEY.flag}
                  </span>
                  <span className="country-chip-name">{TURKEY.shortName}</span>
                  <span className="country-chip-status-active">
                    <span className="country-chip-dot" aria-hidden />
                    Aktif
                  </span>
                </button>
              </div>
            ) : null}

            <div className="country-selector-grid">
              {COUNTRIES.filter((c) => c.code !== 'tr').map((c) => (
                <button
                  key={c.code}
                  type="button"
                  className="country-chip"
                  onClick={() => setSelectedCountry(c.code)}
                >
                  <span className="country-chip-flag" aria-hidden>
                    {c.flag}
                  </span>
                  <span className="country-chip-name">{c.shortName}</span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : null}

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
