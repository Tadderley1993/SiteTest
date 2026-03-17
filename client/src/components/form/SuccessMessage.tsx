import { motion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'

interface SuccessMessageProps {
  onContinue?: () => void
}

// 10 sparkle particles at staggered angles and distances
const SPARKLES = Array.from({ length: 10 }, (_, i) => ({
  angle: i * 36,
  distance: 38 + (i % 3) * 10,
  delay: 0.25 + i * 0.028,
  size: i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1.5,
}))

// 3 expanding rings at staggered delays
const RINGS = [0.2, 0.42, 0.64]

export default function SuccessMessage({ onContinue }: SuccessMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center justify-center py-10 text-center"
    >
      {/* Icon + burst container */}
      <div className="relative flex items-center justify-center mb-6" style={{ width: 80, height: 80 }}>

        {/* Expanding ring bursts */}
        {RINGS.map((delay, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-white/30"
            style={{ width: 56, height: 56 }}
            initial={{ scale: 0.6, opacity: 0.7 }}
            animate={{ scale: 2.8, opacity: 0 }}
            transition={{ duration: 0.9, delay, ease: 'easeOut' }}
          />
        ))}

        {/* Sparkle particles */}
        {SPARKLES.map((spark, i) => {
          const rad = (spark.angle * Math.PI) / 180
          const tx = Math.cos(rad) * spark.distance
          const ty = Math.sin(rad) * spark.distance
          return (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: spark.size,
                height: spark.size,
                top: '50%',
                left: '50%',
                marginTop: -spark.size / 2,
                marginLeft: -spark.size / 2,
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: tx, y: ty, opacity: 0, scale: 0 }}
              transition={{ duration: 0.55, delay: spark.delay, ease: [0.2, 0.8, 0.4, 1] }}
            />
          )
        })}

        {/* Icon circle */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
          className="relative w-16 h-16 rounded-full bg-white/[0.08] border border-white/[0.2] flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.22 }}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center"
          >
            <Check className="w-5 h-5 text-black" strokeWidth={3} />
          </motion.div>

          {/* Slow persistent pulse */}
          <motion.div
            className="absolute inset-0 rounded-full border border-white/15"
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: 'easeOut', delay: 1.2 }}
          />
        </motion.div>
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-xl font-semibold text-white mb-2"
      >
        We've got everything we need.
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-white/40 text-sm mb-8"
      >
        Expect to hear from us soon.
      </motion.p>

      {onContinue && (
        <motion.button
          initial={{ opacity: 0, y: 12, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.68, type: 'spring', stiffness: 200, damping: 18 }}
          onClick={onContinue}
          className="group flex flex-col items-center gap-2 cursor-pointer bg-transparent border-none focus:outline-none"
        >
          {/* Glowing pill */}
          <div className="relative px-5 py-1.5 rounded-full border border-white/[0.15] bg-white/[0.04] group-hover:border-white/30 group-hover:bg-white/[0.07] transition-all duration-300">
            {/* Top highlight */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <span className="text-[10px] tracking-[0.25em] uppercase text-white/40 group-hover:text-white/60 transition-colors duration-300">
              Continue Exploring
            </span>
          </div>
          {/* Bouncing chevron */}
          <motion.div
            animate={{ y: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-3.5 h-3.5 text-white/25 group-hover:text-white/40 transition-colors duration-300" />
          </motion.div>
        </motion.button>
      )}
    </motion.div>
  )
}
