import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ShootingStars } from '../ui/ShootingStars'

const slides = [
  {
    eyebrow: '01. The Basics',
    headline: 'What is a digital footprint?',
    body: 'A digital footprint is the trail of data your business leaves across the internet: your website, social media profiles, search rankings, reviews, and every interaction a potential customer has with your brand online. It exists whether you manage it or not.',
    stat: null,
  },
  {
    eyebrow: '02. The Reality',
    headline: 'Every search. Every click. Every review.',
    body: 'Before a customer ever calls, emails, or walks through your door, they\'ve already formed an opinion about your business. Your digital presence is your first, and often your only, chance to make an impression.',
    stat: { value: '97%', label: 'of consumers search online before making a purchasing decision' },
  },
  {
    eyebrow: '03. Your #1 Asset',
    headline: 'Your website is your best salesperson.',
    body: 'Unlike any human rep, your website works around the clock, never calls in sick, and can simultaneously serve thousands of potential clients. It\'s the foundation that every other piece of your digital presence is built on.',
    stat: { value: '24/7', label: 'always working, always converting, always representing your brand' },
  },
  {
    eyebrow: '04. First Impressions',
    headline: 'You have 0.05 seconds.',
    body: 'Research shows users form an opinion about your website in just 50 milliseconds. A poorly designed digital presence signals unprofessionalism instantly and sends potential clients straight to your competitors before they\'ve read a single word.',
    stat: { value: '75%', label: 'of users judge a company\'s credibility based on their web design alone' },
  },
  {
    eyebrow: '05. Brand Power',
    headline: 'Consistency builds trust. Trust builds revenue.',
    body: 'Consistent brand presentation across all digital platforms (website, social, email, ads) increases revenue by up to 23%. Every touchpoint is an opportunity to reinforce your identity and convert interest into action.',
    stat: { value: '+23%', label: 'average revenue increase from consistent brand presentation' },
  },
  {
    eyebrow: '06. Your Story',
    headline: 'What does yours say right now?',
    body: 'Customers don\'t just buy products or services. They buy into the brand behind them. A powerful digital presence communicates your values, expertise, and why you\'re the obvious choice. If your digital footprint isn\'t telling the right story, we\'ll build one that does.',
    stat: null,
  },
]

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
}

export default function DigitalFootprintSection() {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)

  const go = (next: number) => {
    if (next < 0 || next >= slides.length) return
    setDirection(next > current ? 1 : -1)
    setCurrent(next)
  }

  const slide = slides[current]

  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-center bg-background overflow-hidden">
      <ShootingStars minDelay={1000} maxDelay={3500} minSpeed={8} maxSpeed={25} />
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-white/[0.04] blur-[140px] pointer-events-none" />

      {/* Section label */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 z-10">
        <span className="font-body text-white/50 text-xs tracking-[0.25em] uppercase">Digital Presence</span>
      </div>

      {/* Slide content */}
      <div className="relative z-10 w-full overflow-hidden py-20">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'tween', duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex flex-col items-center text-center px-6 sm:px-14 lg:px-20 max-w-4xl mx-auto"
          >
            <span className="font-body text-text-muted text-xs tracking-[0.2em] uppercase mb-5">
              {slide.eyebrow}
            </span>
            <h2 className="font-body font-semibold text-[clamp(1.75rem,4vw,3.25rem)] text-white leading-[1.05] tracking-tight mb-5">
              {slide.headline}
            </h2>
            <p className="font-body text-text-muted text-base md:text-lg max-w-2xl leading-relaxed mb-8">
              {slide.body}
            </p>
            {slide.stat && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="flex flex-col items-center gap-2 backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl px-8 py-4"
              >
                <span className="font-body font-bold text-[3.5rem] text-white leading-none">{slide.stat.value}</span>
                <span className="font-body text-text-muted text-sm max-w-xs text-center">{slide.stat.label}</span>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Left arrow */}
      <button
        onClick={() => go(current - 1)}
        disabled={current === 0}
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/10 flex items-center justify-center text-text-muted hover:text-text-primary hover:border-white/30 hover:bg-white/[0.05] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      {/* Right arrow */}
      <button
        onClick={() => go(current + 1)}
        disabled={current === slides.length - 1}
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/10 flex items-center justify-center text-text-muted hover:text-text-primary hover:border-white/30 hover:bg-white/[0.05] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className={`h-[3px] rounded-full transition-all duration-400 ${
              i === current ? 'w-8 bg-white' : 'w-2 bg-white/20 hover:bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
