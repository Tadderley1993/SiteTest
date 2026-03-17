import { motion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import { ShootingStars } from '../ui/ShootingStars'

interface ReadySectionProps {
  onScrollToTop: () => void
}

export default function ReadySection({ onScrollToTop }: ReadySectionProps) {
  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-center bg-background overflow-hidden">
      <ShootingStars minDelay={900} maxDelay={3200} minSpeed={10} maxSpeed={30} />
      {/* Background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full bg-white/[0.03] blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-white/[0.03] blur-[150px] pointer-events-none" />

      {/* Top accent line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-transparent to-white/10" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto px-6 sm:px-10 pb-16">
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="font-body text-white/50 text-xs tracking-[0.25em] uppercase mb-6"
        >
          Let's Build Something Remarkable
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="font-body font-semibold text-[clamp(2rem,5vw,4.5rem)] leading-[1.05] tracking-tight text-white mb-6"
        >
          Ready to dominate your digital space?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35 }}
          className="font-body text-text-muted text-base max-w-xl leading-relaxed mb-8"
        >
          You've seen what's possible. Your questionnaire is already on its way to our team and we'll be in touch soon.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.45 }}
          className="flex items-center"
        >
          <button
            onClick={onScrollToTop}
            className="flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-white text-black font-body font-semibold text-sm hover:bg-white/90 transition-all"
          >
            <ArrowUp className="w-4 h-4" />
            Back to Top
          </button>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-8 px-8">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <p className="font-body text-text-muted text-xs tracking-[0.2em] uppercase whitespace-nowrap">
          Designs By TA © 2026
        </p>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>
    </div>
  )
}
