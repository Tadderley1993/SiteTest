import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { ShootingStars } from '../ui/ShootingStars'

const projects = [
  {
    name: 'NexaBank',
    category: 'Fintech / Digital Banking',
    description:
      'A full digital banking platform featuring a trust-first design language, conversion-optimized landing pages, and a seamless account onboarding flow for a next-generation financial institution.',
    tags: ['Fintech', 'Brand Identity', 'Web Application'],
    color: '#1D6AFF',
    colorLight: '#5B96FF',
    href: '/demo/fintech',
    highlights: [
      'Zero-friction account onboarding',
      'Trust-first visual hierarchy',
      'Regulatory-compliant UX patterns',
    ],
    previewBg: 'linear-gradient(135deg, #0A1628 0%, #0D1F3C 50%, #061220 100%)',
    previewAccent: '#1D6AFF',
  },
  {
    name: 'Chez Laurent',
    category: 'Fine Dining / Hospitality',
    description:
      'An immersive digital experience for a premier fine dining restaurant. Designed to evoke elegance, communicate exclusivity, and drive reservations through seamless visual storytelling.',
    tags: ['Restaurant', 'Experience Design', 'Reservations'],
    color: '#C9A84C',
    colorLight: '#E5C876',
    href: '/demo/restaurant',
    highlights: [
      'Immersive full-bleed visual storytelling',
      'Integrated reservation flow',
      'Award-winning luxury aesthetic',
    ],
    previewBg: 'linear-gradient(135deg, #1A120B 0%, #221508 50%, #0F0A05 100%)',
    previewAccent: '#C9A84C',
  },
  {
    name: 'Apex Audio',
    category: 'Consumer Electronics / Product',
    description:
      'A high-impact product showcase for a premium wireless earbud brand. Designed to convert browsers into buyers through bold visuals, scroll-driven reveals, and precision copywriting.',
    tags: ['E-Commerce', 'Product', 'Conversion'],
    color: '#00E5FF',
    colorLight: '#40EEFF',
    href: '/demo/product',
    highlights: [
      'Scroll-driven product reveal animations',
      'Technical spec comparison module',
      'Conversion-optimized purchase flow',
    ],
    previewBg: 'linear-gradient(135deg, #000D10 0%, #001518 50%, #000A0C 100%)',
    previewAccent: '#00E5FF',
  },
]

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
}

export default function ExampleProjectsSection() {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)

  const go = (next: number) => {
    if (next < 0 || next >= projects.length) return
    setDirection(next > current ? 1 : -1)
    setCurrent(next)
  }

  const p = projects[current]

  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-center bg-background overflow-hidden">
      <ShootingStars minDelay={1200} maxDelay={3800} minSpeed={10} maxSpeed={28} />
      {/* Ambient glow */}
      <div
        className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full blur-[140px] opacity-[0.1] pointer-events-none transition-colors duration-700"
        style={{ backgroundColor: p.color }}
      />

      {/* Section label */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 z-10">
        <span className="font-body text-white/50 text-xs tracking-[0.25em] uppercase">Example Projects</span>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full overflow-hidden px-6 sm:px-14 lg:px-20 py-8 lg:py-14">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'tween', duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -50) go(current + 1)
              else if (info.offset.x > 50) go(current - 1)
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center max-w-6xl mx-auto"
          >
            {/* Left — info */}
            <div>
              <div className="flex flex-wrap gap-2 mb-6">
                {p.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-body text-xs px-3 py-1.5 rounded-full border"
                    style={{
                      borderColor: `${p.color}40`,
                      color: p.colorLight,
                      backgroundColor: `${p.color}10`,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p className="font-body text-text-muted text-xs tracking-[0.2em] uppercase mb-3">{p.category}</p>
              <h2 className="font-body font-semibold text-[clamp(2rem,5vw,4.5rem)] text-white leading-[1.0] tracking-tight mb-3">
                {p.name}
              </h2>
              <p className="font-body text-text-muted text-sm leading-relaxed mb-6">{p.description}</p>

              <div className="flex flex-col gap-2.5 mb-7">
                {p.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="font-body text-text-primary/80 text-sm">{h}</span>
                  </div>
                ))}
              </div>

              <a
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-body font-semibold text-sm transition-all hover:opacity-90 hover:gap-4"
                style={{ backgroundColor: p.color, color: '#000000' }}
              >
                View Live Demo <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Right — browser mockup (hidden on mobile) */}
            <div className="hidden md:block">
              <div
                className="rounded-2xl overflow-hidden border border-white/[0.12] shadow-2xl backdrop-blur-sm"
                style={{ boxShadow: `0 0 80px ${p.color}18` }}
              >
                {/* Browser chrome */}
                <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.04] border-b border-white/[0.06]">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/50" />
                    <div className="w-3 h-3 rounded-full bg-green-400/50" />
                  </div>
                  <div className="flex-1 mx-3">
                    <div className="h-6 rounded-md bg-white/[0.05] flex items-center px-3">
                      <span className="font-body text-text-muted text-xs">
                        designsbyta.com{p.href}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div
                  className="h-56 flex flex-col items-center justify-center gap-3 relative overflow-hidden"
                  style={{ background: p.previewBg }}
                >
                  {/* Glow in preview */}
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: `radial-gradient(ellipse at center, ${p.previewAccent}30 0%, transparent 70%)`,
                    }}
                  />
                  {/* Preview content */}
                  <div className="relative z-10 text-center px-8">
                    <div
                      className="font-body font-bold text-5xl mb-2"
                      style={{ color: p.previewAccent }}
                    >
                      {p.name}
                    </div>
                    <div className="font-body text-white/40 text-sm">{p.category}</div>
                  </div>
                  {/* Mock nav bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-10 flex items-center px-6 gap-6"
                    style={{ borderBottom: `1px solid ${p.previewAccent}20` }}
                  >
                    <div
                      className="font-body font-semibold text-lg"
                      style={{ color: p.previewAccent }}
                    >
                      {p.name}
                    </div>
                    <div className="flex gap-4 ml-auto">
                      {['Features', 'Pricing', 'About'].map((item) => (
                        <div key={item} className="font-body text-white/30 text-xs">{item}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Project counter */}
              <div className="mt-4 flex items-center justify-between px-1">
                <span className="font-body text-text-muted text-xs">
                  Project {current + 1} of {projects.length}
                </span>
                <div className="flex gap-1">
                  {projects.map((_, i) => (
                    <div
                      key={i}
                      className="h-[2px] w-6 rounded-full transition-all duration-300"
                      style={{ backgroundColor: i === current ? p.color : 'rgba(255,255,255,0.15)' }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Left arrow */}
      <button
        onClick={() => go(current - 1)}
        disabled={current === 0}
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/10 flex items-center justify-center text-text-muted hover:text-text-primary hover:border-white/30 hover:bg-white/[0.05] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Right arrow */}
      <button
        onClick={() => go(current + 1)}
        disabled={current === projects.length - 1}
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/10 flex items-center justify-center text-text-muted hover:text-text-primary hover:border-white/30 hover:bg-white/[0.05] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {projects.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className={`h-[3px] rounded-full transition-all duration-300 ${
              i === current ? 'w-8 bg-white' : 'w-2 bg-white/20 hover:bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
