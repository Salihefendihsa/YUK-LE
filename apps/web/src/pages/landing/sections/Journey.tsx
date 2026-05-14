import { motion } from 'framer-motion'
import { NetworkGlobe } from '../components/NetworkGlobe'
import { LiveMetrics } from '../components/LiveMetrics'
import { TrustBar } from '../components/TrustBar'

const ease = [0.22, 1, 0.36, 1] as const

export function JourneySection({ reduceMotion }: { reduceMotion: boolean }) {
  const r = reduceMotion

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
            AĞ
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
          <NetworkGlobe reduceMotion={r} />
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
