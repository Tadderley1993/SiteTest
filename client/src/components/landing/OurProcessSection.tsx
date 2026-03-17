import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Search, Palette, Code2, Rocket, TrendingUp } from 'lucide-react'
import { ShootingStars } from '../ui/ShootingStars'

const steps = [
  {
    number: '01',
    Icon: Search,
    title: 'Discovery',
    subtitle: 'We start by listening',
    description:
      'Before a single pixel is designed or a line of code is written, we immerse ourselves in your world. Through deep-dive conversations, we map your brand, your audience, your competitive landscape, and your goals. Nothing gets built on assumptions.',
    details: [
      'Brand & competitive analysis',
      'Audience persona development',
      'Goal alignment session',
      'Existing digital audit',
    ],
    color: '#E8FF47',
  },
  {
    number: '02',
    Icon: Palette,
    title: 'Strategy & Design',
    subtitle: 'Building your visual identity',
    description:
      'Armed with real insight, our designers craft a visual language that\'s uniquely yours: color systems, typography, UI components, and full page mockups. You\'ll see exactly what your brand will look like before development begins.',
    details: [
      'Brand identity system',
      'UI/UX wireframing',
      'Interactive prototypes',
      'Design system & component library',
    ],
    color: '#47C6FF',
  },
  {
    number: '03',
    Icon: Code2,
    title: 'Development',
    subtitle: 'Engineered for performance',
    description:
      'Our engineers build fast, accessible, and scalable digital products using modern frameworks. Performance is engineered from day one, not bolted on after. Every component is built to convert and every interaction is deliberate.',
    details: [
      'Modern tech stack (React, Next.js)',
      'Mobile-first responsive development',
      'Core Web Vitals optimization',
      'QA across devices and browsers',
    ],
    color: '#A78BFA',
  },
  {
    number: '04',
    Icon: Rocket,
    title: 'Launch',
    subtitle: 'Go live with confidence',
    description:
      'We handle every detail of your launch: DNS configuration, hosting setup, SEO foundations, and analytics integration. Your debut on the digital stage is smooth, polished, and built for visibility from day one.',
    details: [
      'Deployment & cloud hosting setup',
      'On-page SEO foundation',
      'Analytics & conversion tracking',
      'Launch-day monitoring & support',
    ],
    color: '#FF6B35',
  },
  {
    number: '05',
    Icon: TrendingUp,
    title: 'Growth',
    subtitle: 'The launch is just the beginning',
    description:
      'We monitor, test, and iterate alongside you. Through performance data, A/B testing, and strategic content updates, we ensure your digital presence keeps evolving and growing in step with your business.',
    details: [
      'Monthly performance reporting',
      'A/B testing & conversion optimization',
      'Content strategy & updates',
      'Ongoing support & iteration',
    ],
    color: '#10B981',
  },
]

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0, scale: 0.97 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0, scale: 0.97 }),
}

export default function OurProcessSection() {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)

  const go = (next: number) => {
    if (next < 0 || next >= steps.length) return
    setDirection(next > current ? 1 : -1)
    setCurrent(next)
  }

  const s = steps[current]

  return (
    <div className="relative h-screen w-full flex items-center justify-center bg-background overflow-hidden">
      <ShootingStars minDelay={1100} maxDelay={3600} minSpeed={9} maxSpeed={26} />

      {/* Ambient glow */}
      <motion.div
        className="absolute bottom-0 left-0 w-[600px] h-[400px] rounded-full blur-[160px] opacity-[0.08] pointer-events-none"
        animate={{ backgroundColor: s.color }}
        transition={{ duration: 0.8 }}
      />

      {/* Section label */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 z-10">
        <span className="font-body text-white/50 text-xs tracking-[0.25em] uppercase">Our Process</span>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 sm:px-14 lg:px-20 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

        {/* Left — static heading */}
        <div className="flex flex-col items-start gap-6">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-medium tracking-[0.18em] uppercase"
            style={{ borderColor: `${s.color}40`, color: s.color, backgroundColor: `${s.color}10` }}
          >
            <motion.span
              className="w-1.5 h-1.5 rounded-full"
              animate={{ backgroundColor: s.color }}
              transition={{ duration: 0.5 }}
            />
            {s.subtitle}
          </div>

          <h2 className="font-body font-semibold text-[clamp(1.75rem,3.5vw,3rem)] text-white leading-[1.05] tracking-tight">
            From first conversation to lasting growth.
          </h2>

          <p className="font-body text-text-muted text-sm leading-relaxed max-w-sm">
            Every engagement follows the same five-step framework: built to minimize risk, maximize output, and keep you informed at every stage.
          </p>

          {/* Step progress */}
          <div className="flex gap-1.5 mt-2">
            {steps.map((st, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                className="h-[3px] rounded-full transition-all duration-500"
                style={{
                  width: i === current ? 32 : 8,
                  backgroundColor: i === current ? s.color : 'rgba(255,255,255,0.15)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Right — carousel card */}
        <div className="relative">
          <div className="relative overflow-hidden" style={{ minHeight: 320 }}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 280, damping: 28, mass: 0.8 }}
                className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl overflow-hidden p-5 flex flex-col gap-4"
              >
                {/* Top color streak */}
                <div
                  className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: `linear-gradient(to right, transparent, ${s.color}80, transparent)` }}
                />

                {/* Subtle radial glow */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse 70% 50% at 20% 0%, ${s.color}0d 0%, transparent 70%)` }}
                />

                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${s.color}18` }}
                    >
                      <s.Icon className="w-5 h-5" style={{ color: s.color }} />
                    </div>
                    <div>
                      <p className="font-body text-xs tracking-[0.2em] uppercase mb-0.5" style={{ color: s.color }}>
                        Step {s.number}
                      </p>
                      <h3 className="font-body font-semibold text-white text-base leading-tight">
                        {s.title}
                      </h3>
                    </div>
                  </div>
                  <span
                    className="font-body font-bold text-[3rem] leading-none select-none"
                    style={{ color: `${s.color}18` }}
                  >
                    {s.number}
                  </span>
                </div>

                {/* Description */}
                <p className="font-body text-text-muted text-sm leading-relaxed">
                  {s.description}
                </p>

                {/* Detail chips */}
                <div className="grid grid-cols-2 gap-2">
                  {s.details.map((d, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5"
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="font-body text-text-primary/70 text-xs leading-snug">{d}</span>
                    </div>
                  ))}
                </div>

                {/* Step counter + nav */}
                <div className="flex items-center justify-between pt-1">
                  <span className="font-body text-text-muted text-xs">
                    {current + 1} / {steps.length}
                    {current < steps.length - 1 && (
                      <span className="ml-2 text-white/25">Next: {steps[current + 1].title}</span>
                    )}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => go(current - 1)}
                      disabled={current === 0}
                      className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-text-muted hover:border-white/30 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => go(current + 1)}
                      disabled={current === steps.length - 1}
                      className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-text-muted hover:border-white/30 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  )
}
