import { motion } from 'framer-motion'
import { MetricCard } from './MetricCard'

function TruckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2m0 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 0 4 0m10 0a2 2 0 1 0 4 0m-4 0h2a1 1 0 0 0 1-1v-3.65L19.74 8.35A1 1 0 0 0 19 8h-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ZapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const ease = [0.22, 1, 0.36, 1] as const

type Props = {
  reduceMotion: boolean
}

export function LiveMetrics({ reduceMotion }: Props) {
  return (
    <div className="live-metrics">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.65, ease, delay: reduceMotion ? 0 : 0.1 }}
      >
        <MetricCard
          label="Aktif Sefer"
          target={247}
          suffix=""
          trend="+12 son saatte"
          icon={<TruckIcon />}
          showLiveDot
          reduceMotion={reduceMotion}
        />
      </motion.div>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.65, ease, delay: reduceMotion ? 0 : 0.2 }}
      >
        <MetricCard
          label="Zamanında Teslimat"
          target={98.4}
          decimals={1}
          suffix="%"
          trend="Son 30 gün"
          icon={<CheckIcon />}
          reduceMotion={reduceMotion}
        />
      </motion.div>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.65, ease, delay: reduceMotion ? 0 : 0.3 }}
      >
        <MetricCard
          label="Ortalama Eşleşme"
          target={2}
          suffix=" dk"
          trend="Sektör ortalaması: 47 dk"
          icon={<ZapIcon />}
          reduceMotion={reduceMotion}
        />
      </motion.div>
    </div>
  )
}
