import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { NetworkGlobe } from '../components/NetworkGlobe'
import { TurkeyDetailMap } from '../components/TurkeyDetailMap'
import { LiveMetrics } from '../components/LiveMetrics'
import { TrustBar } from '../components/TrustBar'

const ease = [0.22, 1, 0.36, 1] as const

export function JourneySection({ reduceMotion }: { reduceMotion: boolean }) {
  const r = reduceMotion
  const [view, setView] = useState<'globe' | 'turkey'>('globe')
  const goTurkey = useCallback(() => setView('turkey'), [])
  const goGlobe = useCallback(() => setView('globe'), [])
  const stageTransition = r ? { duration: 0 } : { duration: 0.7, ease }

  return (
    <section className="section-network" id="journey">
      <div className="section-network-glow" aria-hidden />
      <div className="section-network-container">
        <motion.header
          className="section-network-header"
          initial={r ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease, delay: r ? 0 : 0.1 }}
        >
          <p className="section-network-eyebrow">
            <span className="eyebrow-dot" aria-hidden />
            OPERASYONEL GÜÇ
          </p>
          <h2 className="section-network-title">
            <span className="section-network-title-line">81 İlde,</span>
            <span className="section-network-title-line">Tek Tuşla.</span>
          </h2>
          <p className="section-network-subtitle">
            Türkiye&apos;nin dört bir yanında aktif şoför ağı.
            <br />
            Yükünüzü saniyeler içinde eşleştirin, anlık takip edin.
          </p>
        </motion.header>

        <motion.div
          className="globe-stage"
          initial={r ? false : { opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1.2, ease, delay: r ? 0 : 0.2 }}
        >
          <AnimatePresence mode="wait">
            {view === 'globe' ? (
              <motion.div
                key="globe"
                className="stage-content"
                initial={r ? false : { opacity: 0, scale: 1.08 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={r ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.88 }}
                transition={stageTransition}
              >
                <NetworkGlobe reduceMotion={r} onZoomToTurkey={goTurkey} />
              </motion.div>
            ) : (
              <motion.div
                key="turkey"
                className="stage-content"
                initial={r ? false : { opacity: 0, scale: 1.08 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={r ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.88 }}
                transition={stageTransition}
              >
                <TurkeyDetailMap onBackToGlobe={goGlobe} reduceMotion={r} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          className="network-metrics-row"
          initial={r ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease, delay: r ? 0 : 0.4 }}
        >
          <LiveMetrics horizontal reduceMotion={r} />
        </motion.div>

        <motion.div
          initial={r ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.65, ease, delay: r ? 0 : 0.55 }}
        >
          <TrustBar />
        </motion.div>
      </div>
    </section>
  )
}
