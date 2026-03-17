import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Users, DollarSign, Star } from 'lucide-react'
import { ShootingStars } from '../ui/ShootingStars'

const cases = [
  {
    category: 'Food & Beverage',
    client: 'Harvest Table',
    type: 'Independent Restaurant, Atlanta, GA',
    challenge: 'Zero digital presence. No website, no Google listing, no social media.',
    result: '340% increase in online reservations within 90 days of launching a new website, Google Business profile, and local SEO strategy.',
    metrics: [
      { Icon: TrendingUp, value: '+340%', label: 'Online Reservations' },
      { Icon: Users,      value: '12K',   label: 'Monthly Website Visitors' },
      { Icon: Star,       value: '4.9★',  label: 'Google Rating' },
    ],
    color: '#FF6B35',
    quote: '"We went from empty tables on weeknights to fully booked every weekend within two months."',
    source: 'James Okafor, Owner',
  },
  {
    category: 'Financial Services',
    client: 'Summit Wealth',
    type: 'Independent Financial Advisory, Miami, FL',
    challenge: 'Generic, outdated website. Zero inbound leads from digital.',
    result: '58% more qualified leads per month and a $40K+ increase in average deal size after a complete brand and digital overhaul.',
    metrics: [
      { Icon: TrendingUp,  value: '+58%',  label: 'Qualified Monthly Leads' },
      { Icon: DollarSign,  value: '+$40K', label: 'Average Deal Size' },
      { Icon: Users,       value: '3.2×',  label: 'Conversion Rate Lift' },
    ],
    color: '#47C6FF',
    quote: '"Clients now arrive pre-sold on our value. The website does the positioning before we even get on a call."',
    source: 'Marcus Webb, Managing Partner',
  },
  {
    category: 'E-Commerce',
    client: 'FORMA Skincare',
    type: 'DTC Beauty Brand, Los Angeles, CA',
    challenge: 'Disconnected brand identity causing high cart abandonment and poor repeat purchases.',
    result: '2.7× revenue growth in six months through a unified brand identity, redesigned storefront UX, and content strategy.',
    metrics: [
      { Icon: DollarSign,  value: '2.7×',  label: 'Revenue Growth (6 Mo)' },
      { Icon: TrendingUp,  value: '−45%',  label: 'Cart Abandonment' },
      { Icon: Star,        value: '89%',   label: 'Customer Retention' },
    ],
    color: '#E8FF47',
    quote: '"Our brand finally looks as premium as our product. The numbers followed almost immediately."',
    source: 'Priya Nair, Founder',
  },
  {
    category: 'Healthcare',
    client: 'Clearview Dental',
    type: 'Multi-Location Dental Practice, Phoenix, AZ',
    challenge: 'Outdated website, no online booking, declining patient reviews stifling growth.',
    result: '220% increase in new patient bookings and 89% retention rate after a full digital transformation.',
    metrics: [
      { Icon: Users,       value: '+220%', label: 'New Patient Bookings' },
      { Icon: Star,        value: '89%',   label: 'Patient Retention' },
      { Icon: TrendingUp,  value: '4.8★',  label: 'Avg Google Rating' },
    ],
    color: '#A78BFA',
    quote: '"Patients tell us they chose us because of how professional the website looked."',
    source: 'Dr. Alicia Ferreira, Practice Director',
  },
]

const AUTO_PLAY = 4000
const ITEM_H = 64

const wrap = (min: number, max: number, v: number) => {
  const r = max - min
  return ((((v - min) % r) + r) % r) + min
}

export default function CaseStudiesSection() {
  const [step, setStep]       = useState(0)
  const [paused, setPaused]   = useState(false)

  const len     = cases.length
  const current = ((step % len) + len) % len
  const c       = cases[current]

  const next = useCallback(() => setStep(s => s + 1), [])

  useEffect(() => {
    if (paused) return
    const id = setInterval(next, AUTO_PLAY)
    return () => clearInterval(id)
  }, [next, paused])

  const goTo = (i: number) => {
    const diff = (i - current + len) % len
    if (diff > 0) setStep(s => s + diff)
  }

  const cardStatus = (i: number) => {
    let d = i - current
    if (d >  len / 2) d -= len
    if (d < -len / 2) d += len
    if (d ===  0) return 'active'
    if (d === -1) return 'prev'
    if (d ===  1) return 'next'
    return 'hidden'
  }

  return (
    <div
      className="relative h-screen w-full flex flex-col items-center justify-center bg-background overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <ShootingStars minDelay={1400} maxDelay={4000} minSpeed={8} maxSpeed={22} />
      {/* Ambient glow */}
      <motion.div
        className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[160px] opacity-[0.07] pointer-events-none"
        animate={{ backgroundColor: c.color }}
        transition={{ duration: 0.8 }}
      />

      {/* Section label */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 z-10">
        <span className="font-body text-white/50 text-xs tracking-[0.25em] uppercase">Case Studies</span>
      </div>

      {/* ── Carousel container ── */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 sm:px-10 lg:px-20">
        <div className="relative overflow-hidden rounded-3xl flex flex-col lg:flex-row border border-white/[0.08]" style={{ minHeight: 480 }}>

          {/* ── LEFT: vertical chip list ── */}
          <div className="w-full lg:w-[38%] relative z-30 flex flex-col items-start justify-center overflow-hidden px-8 lg:px-10 py-10 bg-[#0a0c10]">

            {/* Fade masks */}
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#0a0c10] to-transparent z-40 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0a0c10] to-transparent z-40 pointer-events-none" />

            <div className="relative w-full h-full flex items-center justify-start z-20" style={{ height: ITEM_H * 3 }}>
              {cases.map((item, i) => {
                const isActive = i === current
                const dist     = wrap(-(len / 2), len / 2, i - current)

                return (
                  <motion.div
                    key={item.client}
                    style={{ height: ITEM_H, width: 'fit-content' }}
                    animate={{
                      y:       dist * ITEM_H,
                      opacity: 1 - Math.abs(dist) * 0.28,
                    }}
                    transition={{ type: 'spring', stiffness: 90, damping: 22, mass: 1 }}
                    className="absolute flex items-center justify-start"
                  >
                    <button
                      type="button"
                      onClick={() => goTo(i)}
                      className={`relative flex items-center gap-3 px-5 py-3 rounded-full transition-all duration-500 text-left border ${
                        isActive
                          ? 'border-white/20 bg-white/[0.07] text-white'
                          : 'bg-transparent text-white/35 border-white/[0.06] hover:border-white/20 hover:text-white/60'
                      }`}
                    >
                      {/* Color dot */}
                      <motion.span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        animate={{ backgroundColor: isActive ? item.color : 'rgba(255,255,255,0.18)' }}
                        transition={{ duration: 0.4 }}
                      />
                      <span className="text-sm font-medium tracking-tight whitespace-nowrap">
                        {item.client}
                      </span>
                      {isActive && (
                        <motion.span
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-[10px] tracking-[0.15em] uppercase"
                          style={{ color: item.color }}
                        >
                          {item.category}
                        </motion.span>
                      )}
                    </button>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* ── RIGHT: stacked detail cards ── */}
          <div className="flex-1 relative flex items-center justify-center py-10 px-6 lg:px-10 overflow-hidden border-t lg:border-t-0 lg:border-l border-white/[0.06] bg-background">
            <div className="relative w-full max-w-[360px]" style={{ height: 380 }}>
              {cases.map((item, i) => {
                const status   = cardStatus(i)
                const isActive = status === 'active'
                const isPrev   = status === 'prev'
                const isNext   = status === 'next'

                return (
                  <motion.div
                    key={item.client}
                    initial={false}
                    animate={{
                      x:      isActive ? 0 : isPrev ? -80 : isNext ? 80 : 0,
                      scale:  isActive ? 1 : (isPrev || isNext) ? 0.86 : 0.72,
                      opacity: isActive ? 1 : (isPrev || isNext) ? 0.3 : 0,
                      rotate: isPrev ? -4 : isNext ? 4 : 0,
                      zIndex: isActive ? 20 : (isPrev || isNext) ? 10 : 0,
                    }}
                    transition={{ type: 'spring', stiffness: 260, damping: 26, mass: 0.8 }}
                    className="absolute inset-0 rounded-2xl overflow-hidden border border-white/[0.1] bg-[#0a0c10] origin-center"
                    style={{ pointerEvents: isActive ? 'auto' : 'none' }}
                  >
                    {/* Top color streak */}
                    <div
                      className="absolute top-0 left-0 right-0 h-px"
                      style={{ background: `linear-gradient(to right, transparent, ${item.color}70, transparent)` }}
                    />
                    {/* Subtle radial glow */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: `radial-gradient(ellipse 60% 40% at 30% 20%, ${item.color}12 0%, transparent 70%)` }}
                    />

                    {/* "Case Study" indicator */}
                    <div className="absolute top-5 left-5 flex items-center gap-2">
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full"
                        animate={{ backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}` }}
                        transition={{ duration: 0.5 }}
                      />
                      <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/30">
                        Case Study
                      </span>
                    </div>

                    {/* Card body */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.35 }}
                          className="absolute inset-0 flex flex-col justify-end p-6"
                        >
                          {/* Headline metric */}
                          <div className="mb-4">
                            <div
                              className="text-5xl font-bold leading-none mb-1 font-body"
                              style={{ color: item.color }}
                            >
                              {item.metrics[0].value}
                            </div>
                            <div className="text-[10px] text-white/35 uppercase tracking-[0.18em]">
                              {item.metrics[0].label}
                            </div>
                          </div>

                          {/* Category chip */}
                          <div
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-[0.15em] w-fit mb-3 border"
                            style={{ borderColor: `${item.color}30`, color: item.color, backgroundColor: `${item.color}10` }}
                          >
                            {item.category}
                          </div>

                          {/* Result */}
                          <p className="text-white text-sm font-medium leading-snug mb-4">
                            {item.result}
                          </p>

                          {/* Quote */}
                          <blockquote
                            className="border-l-2 pl-3"
                            style={{ borderColor: `${item.color}50` }}
                          >
                            <p className="text-white/35 text-xs leading-relaxed italic">{item.quote}</p>
                            <p className="text-white/20 text-[10px] mt-1">{item.source}</p>
                          </blockquote>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {cases.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            className={`h-[3px] rounded-full transition-all duration-300 ${
              i === current ? 'w-8 bg-white' : 'w-2 bg-white/20 hover:bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
