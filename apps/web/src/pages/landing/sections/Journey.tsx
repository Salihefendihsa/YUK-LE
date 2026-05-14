import { motion } from 'framer-motion'
import { TurkeyMap } from '../components/TurkeyMap'
import { LiveMetrics } from '../components/LiveMetrics'
import { TrustBar } from '../components/TrustBar'

const ease = [0.22, 1, 0.36, 1] as const

export function JourneySection({ reduceMotion }: { reduceMotion: boolean }) {
  const r = reduceMotion

  return (
    <section className="section-network" id="journey">
      <div className="section-network-container">
        <motion.header
          className="section-network-header"
          initial={r ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease, delay: r ? 0 : 0.1 }}
        >
          <p className="section-network-eyebrow">AĞ</p>
          <h2 className="section-network-title">
            <span className="section-network-title-line">81 ilde,</span>
            <span className="section-network-title-line">tek tuşla.</span>
          </h2>
          <p className="section-network-subtitle">
            Türkiye&apos;nin dört bir yanında aktif şoför ağı. Yükünüzü saniyeler içinde eşleştirin, anlık takip edin.
          </p>
        </motion.header>

        <div className="section-network-grid">
          <motion.div
            initial={r ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease, delay: r ? 0 : 0.3 }}
          >
            <TurkeyMap reduceMotion={r} />
          </motion.div>
          <motion.div
            className="section-network-metrics"
            initial={r ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease, delay: r ? 0 : 0.5 }}
          >
            <LiveMetrics reduceMotion={r} />
          </motion.div>
        </div>

        <motion.div
          initial={r ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.75, ease, delay: r ? 0 : 0.7 }}
        >
          <TrustBar />
        </motion.div>
      </div>
    </section>
  )
}
