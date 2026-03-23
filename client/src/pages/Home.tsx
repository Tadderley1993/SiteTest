import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useAnimation, useMotionValueEvent, useSpring, AnimatePresence } from 'framer-motion'
import React, { useRef, useState } from 'react'
import PageWrapper from '../components/layout/PageWrapper'
import TabletPreview from '../components/layout/TabletPreview'

import CTASection from '../components/layout/CTASection'
import Footer from '../components/layout/Footer'
import SectionLabel from '../components/layout/SectionLabel'
import FadeUp from '../components/layout/FadeUp'
import AnimatedHeading from '../components/layout/AnimatedHeading'
import { staggerContainer, staggerItem } from '../components/layout/animations'


// ── "looks" — TextPressure: letters respond to cursor proximity ──────
function TextPressureWord({ children, onHoverChange }: { children: string; onHoverChange?: (v: boolean) => void }) {
  const containerRef = useRef<HTMLSpanElement>(null)
  const chars = children.split('')

  const handleMouseMove = (e: React.MouseEvent) => {
    const spans = containerRef.current?.querySelectorAll<HTMLSpanElement>('[data-char]')
    if (!spans) return
    spans.forEach(span => {
      const rect = span.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dist = Math.sqrt((e.clientX - cx) ** 2 + (e.clientY - cy) ** 2)
      const t = Math.max(0, 1 - dist / 80)
      span.style.fontWeight = String(Math.round(400 + t * 500))
      span.style.transform = `scale(${1 + t * 0.35})`
    })
  }

  const handleMouseLeave = () => {
    containerRef.current?.querySelectorAll<HTMLSpanElement>('[data-char]').forEach(span => {
      span.style.fontWeight = ''
      span.style.transform = ''
    })
    onHoverChange?.(false)
  }

  return (
    <span
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={handleMouseLeave}
      style={{ display: 'inline-block', cursor: 'default', whiteSpace: 'nowrap', padding: '0 0.25em 2px' }}
    >
      {chars.map((char, i) => (
        <span
          key={i}
          data-char=""
          style={{ display: 'inline-block', transition: 'font-weight 0.12s ease-out, transform 0.12s ease-out' }}
        >
          {char}
        </span>
      ))}
    </span>
  )
}

// ── First line of quote with shrink-on-looks-hover ───────────────────
function QuoteFirstLine() {
  const beforeRef = useRef<HTMLSpanElement>(null)
  const afterRef  = useRef<HTMLSpanElement>(null)

  const handleLooksHover = (hovered: boolean) => {
    const before = beforeRef.current
    const after  = afterRef.current
    if (!before || !after) return
    const transition = 'transform 0.16s cubic-bezier(0.4,0,0.2,1), opacity 0.16s cubic-bezier(0.4,0,0.2,1)'
    before.style.transition = transition
    after.style.transition  = transition
    if (hovered) {
      before.style.transform = 'scale(0.78)'
      before.style.opacity   = '0.25'
      after.style.transform  = 'scale(0.78)'
      after.style.opacity    = '0.25'
    } else {
      before.style.transform = ''
      before.style.opacity   = ''
      after.style.transform  = ''
      after.style.opacity    = ''
    }
  }

  return (
    <span style={{ display: 'block' }}>
      <span ref={beforeRef} style={{ display: 'inline-block', transformOrigin: 'right center' }}>
        "Design is not just what it{' '}
      </span>
      <TextPressureWord onHoverChange={handleLooksHover}>looks</TextPressureWord>
      <span ref={afterRef} style={{ display: 'inline-block', transformOrigin: 'left center' }}>
        {' '}like and
      </span>
    </span>
  )
}

// ── "feels" — scale + rumble on hover ───────────────────────────────
function ExpandWord({ children }: { children: string }) {
  return (
    <motion.span
      style={{ display: 'inline-block', cursor: 'default', whiteSpace: 'nowrap', paddingBottom: '2px' }}
      whileHover={{
        scale: 1.22,
        x: [0, -4, 4, -4, 4, -3, 3, -2, 2, 0],
      }}
      transition={{
        scale: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
        x: { duration: 0.4, times: [0, 0.11, 0.22, 0.33, 0.44, 0.56, 0.67, 0.78, 0.89, 1], ease: 'easeInOut' },
      }}
    >
      {children}
    </motion.span>
  )
}

// ── "works" — letters physically shuffle positions like cards ────────
function ShuffleWord({ children }: { children: string }) {
  const chars = children.split('')
  const charRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [offsets, setOffsets] = useState<number[]>(chars.map(() => 0))
  const shuffling = useRef(false)

  const shuffle = () => {
    if (shuffling.current) return
    shuffling.current = true

    const positions = charRefs.current.map(el => el?.offsetLeft ?? 0)
    const order = chars.map((_, i) => i)
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]]
    }
    setOffsets(chars.map((_, i) => positions[order[i]] - positions[i]))

    setTimeout(() => {
      setOffsets(chars.map(() => 0))
      setTimeout(() => { shuffling.current = false }, 450)
    }, 550)
  }

  return (
    <span onMouseEnter={shuffle} style={{ display: 'inline-block', cursor: 'default', whiteSpace: 'nowrap', paddingBottom: '2px' }}>
      {chars.map((char, i) => (
        <motion.span
          key={i}
          ref={el => { charRefs.current[i] = el }}
          animate={{ x: offsets[i] }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          style={{ display: 'inline-block' }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  )
}

// ── Horizontal reveal line ──────────────────────────────────────────
function _RevealLine({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`h-px bg-[rgba(0,0,0,0.1)] origin-left ${className}`}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    />
  )
}

// ── Web Design icon (UX/UI monitor) ──────────────────────────────────
function WebDesignIcon() {
  return (
    <svg viewBox="0 0 512 512" width="120" height="120" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      {/*
        Monitor frame (outer rounded rect) + screen cutout + indicator dot cutout.
        fillRule="evenodd": outer=filled, screen=transparent, dot=transparent.
      */}
      <path fillRule="evenodd" d="
        M46 6 L466 6 Q494 6 494 34 L494 380 Q494 408 466 408 L46 408 Q18 408 18 380 L18 34 Q18 6 46 6 Z
        M46 36 L466 36 L466 308 L46 308 Z
        M236 358 A20 20 0 1 0 276 358 A20 20 0 1 0 236 358 Z
      " />
      {/* Stand neck */}
      <rect x="214" y="408" width="84" height="52" />
      {/* Base */}
      <rect x="148" y="460" width="216" height="30" rx="10" />
      {/* Top rule inside screen */}
      <rect x="64" y="58" width="384" height="10" rx="5" />
      {/* Bottom rule inside screen */}
      <rect x="64" y="278" width="384" height="10" rx="5" />
      {/* UX/UI text */}
      <text
        x="256" y="178"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="96"
        fontWeight="900"
        fontFamily="Arial Black, Arial, sans-serif"
        letterSpacing="-4"
      >UX/UI</text>
    </svg>
  )
}

// ── PNG icon helper — themes uploaded images to gold on dark background ─
const imgIcon = (src: string) => (active: boolean) => (
  <img
    src={src}
    alt=""
    draggable={false}
    style={{
      width: 100, height: 100, objectFit: 'contain', display: 'block',
      filter: active
        ? 'invert(1) sepia(1) saturate(2) hue-rotate(5deg) brightness(0.88)'
        : 'invert(1) opacity(0.35)',
      mixBlendMode: 'screen' as const,
    }}
  />
)

// ── SEO icon ──────────────────────────────────────────────────────────
function _SeoIcon() {
  return (
    <svg viewBox="0 0 512 512" width="120" height="120" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      {/* S */}
      <text x="0" y="375" fontSize="220" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif">S</text>
      {/* E */}
      <text x="126" y="375" fontSize="220" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif">E</text>
      {/* Magnifying glass ring — acts as the O */}
      <path fillRule="evenodd" d="
        M405 84 C462 84 508 130 508 187 C508 244 462 290 405 290 C348 290 302 244 302 187 C302 130 348 84 405 84 Z
        M405 127 C372 127 345 154 345 187 C345 220 372 247 405 247 C438 247 465 220 465 187 C465 154 438 127 405 127 Z
      " />
      {/* Handle */}
      <line x1="480" y1="272" x2="506" y2="400" stroke="currentColor" strokeWidth="42" strokeLinecap="round" />
    </svg>
  )
}

// ── E-Commerce icon ───────────────────────────────────────────────────
function EcommerceIcon() {
  return (
    <svg viewBox="0 0 512 512" width="120" height="120" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      {/*
        Phone frame + screen cutout + home-button cutout (evenodd).
        Outer phone: (152,20)→(478,492), rx≈44.
        Screen: (168,72)→(462,422). Home dot: cx=315, cy=457, r=18.
      */}
      <path fillRule="evenodd" d="
        M196 20 L434 20 Q478 20 478 64 L478 448 Q478 492 434 492 L196 492 Q152 492 152 448 L152 64 Q152 20 196 20 Z
        M168 72 L462 72 L462 422 L168 422 Z
        M297 457 A18 18 0 1 0 333 457 A18 18 0 1 0 297 457 Z
      " />
      {/* Cart handle — horizontal bar then vertical drop */}
      <line x1="96" y1="143" x2="190" y2="143" stroke="currentColor" strokeWidth="22" strokeLinecap="round" />
      <line x1="106" y1="143" x2="106" y2="185" stroke="currentColor" strokeWidth="22" strokeLinecap="round" />
      {/* Cart body — trapezoid */}
      <path d="M 118 185 L 358 185 L 332 295 L 148 295 Z" />
      {/* Cart base rail */}
      <rect x="143" y="292" width="196" height="22" rx="11" />
      {/* Wheels */}
      <circle cx="180" cy="344" r="31" />
      <circle cx="298" cy="344" r="31" />
      {/* Speed lines */}
      <rect x="20" y="186" width="80" height="18" rx="9" />
      <rect x="38" y="224" width="62" height="18" rx="9" />
      <rect x="20" y="262" width="80" height="18" rx="9" />
    </svg>
  )
}

// ── Laptop SVG icon ───────────────────────────────────────────────────
function LaptopIcon() {
  return (
    <svg viewBox="0 0 512 512" width="120" height="120" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      {/* Lid + screen cutout + webcam cutout (all evenodd) */}
      <path fillRule="evenodd" d="
        M48 50 C48 44 53 38 60 38 L452 38 C459 38 464 44 464 50 L464 362 L48 362 Z
        M76 66 L436 66 L436 346 L76 346 Z
        M248 52 A8 8 0 1 0 264 52 A8 8 0 1 0 248 52 Z
      " />
      {/* Hinge bar (lid bottom center) */}
      <rect x="196" y="362" width="120" height="14" />
      {/* Base — full width bar, rounded bottom */}
      <path d="M0 376 L196 376 L196 362 L316 362 L316 376 L512 376 L512 400 C512 412 502 420 490 420 L22 420 C10 420 0 412 0 400 Z" />
      {/* LED indicator */}
      <rect x="44" y="404" width="28" height="8" fill="rgba(8,9,13,0.6)" />
    </svg>
  )
}

// ── Services data ────────────────────────────────────────────────────
const SERVICES: { icon: React.ReactNode | ((active: boolean) => React.ReactNode); title: string; desc: string }[] = [
  { icon: imgIcon('/imgs/branding.png'),     title: 'Brand Identity', desc: 'Logo, color system, typography — a cohesive identity that commands attention and builds trust from first glance.' },
  { icon: <WebDesignIcon />,                 title: 'Web Design',     desc: 'Pixel perfect, conversion optimized designs that balance beauty with function. Every screen intentional.' },
  { icon: <LaptopIcon />,                    title: 'Web Dev',        desc: 'Fast, accessible, SEO ready code built on modern frameworks. Performance baked in from the start.' },
  { icon: imgIcon('/imgs/seo.png'),           title: 'SEO',            desc: 'Boston-focused keyword strategy and technical SEO that gets you found by the right people at the right time.' },
  { icon: <EcommerceIcon />,                 title: 'E-Commerce',     desc: 'Online stores engineered to sell — from product pages to checkout. Optimized for conversion at every step.' },
  { icon: imgIcon('/imgs/maintenance.png'),  title: 'Maintenance',    desc: 'Ongoing support, updates, and performance monitoring so your site never slows down or falls behind.' },
]

const CARD_W = 260
const CARD_GAP = 20

// ── Single carousel card (pos = position relative to active: -1, 0, 1…) ──
function ServiceSlideCard({
  service, pos, onPrev, onNext,
}: { service: typeof SERVICES[0]; pos: number; onPrev: () => void; onNext: () => void }) {
  const [hovered, setHovered] = useState(false)
  const isActive  = pos === 0
  const isVisible = Math.abs(pos) <= 1
  const showDetail = isActive && hovered
  const iconContent = typeof service.icon === 'function'
    ? (service.icon as (a: boolean) => React.ReactNode)(isActive)
    : service.icon

  return (
    <motion.div
      animate={{
        x:       pos * (CARD_W + CARD_GAP),
        scale:   isActive ? 1 : 0.72,
        opacity: isVisible ? (isActive ? 1 : 0.32) : 0,
        filter:  isActive ? 'blur(0px)' : 'blur(1.5px)',
        zIndex:  isActive ? 2 : 1,
      }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      onClick={!isActive ? (pos < 0 ? onPrev : onNext) : undefined}
      onMouseEnter={() => isActive && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute',
        left: '50%',
        marginLeft: -CARD_W / 2,
        width: CARD_W,
        height: 320,
        background: 'transparent',
        border: 'none',
        overflow: 'hidden',
        cursor: isActive ? 'default' : 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Large icon */}
      <motion.span
        animate={{ y: showDetail ? -22 : 0 }}
        transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
        style={{
          lineHeight: 1,
          color: isActive ? '#C6A84B' : 'rgba(198,168,75,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          userSelect: 'none',
          width: 120, height: 120, flexShrink: 0,
        }}
      >
        {iconContent}
      </motion.span>

      {/* Title */}
      <motion.p
        animate={{ y: showDetail ? -18 : 0 }}
        transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
        style={{
          marginTop: 20, fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em',
          color: isActive ? '#C6A84B' : 'rgba(198,168,75,0.4)',
          textAlign: 'center',
        }}
      >
        {service.title}
      </motion.p>

      {/* Gold tick */}
      {isActive && (
        <motion.div
          animate={{ opacity: showDetail ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          style={{ marginTop: 14, width: 24, height: 1, background: 'rgba(198,168,75,0.5)' }}
        />
      )}

      {/* Hover reveal */}
      <AnimatePresence>
        {showDetail && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '28px 24px 26px',
              background: 'linear-gradient(to top, rgba(8,9,13,0.97) 60%, transparent 100%)',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 13, lineHeight: 1.65, color: 'rgba(245,240,232,0.62)', letterSpacing: '0.01em' }}>
              {service.desc}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Services carousel ─────────────────────────────────────────────────
function _ServicesSlider() {
  const [active, setActive] = useState(0)
  const prev = () => setActive(i => (i - 1 + SERVICES.length) % SERVICES.length)
  const next = () => setActive(i => (i + 1) % SERVICES.length)

  // Shortest-path position relative to active index
  const getPos = (i: number) => {
    let diff = i - active
    const half = Math.floor(SERVICES.length / 2)
    while (diff > half)  diff -= SERVICES.length
    while (diff < -half) diff += SERVICES.length
    return diff
  }

  const ArrowBtn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 38, height: 38,
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'transparent',
        color: '#F5F0E8', fontSize: 18,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'border-color 0.2s, color 0.2s',
        flexShrink: 0,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(198,168,75,0.55)'; (e.currentTarget as HTMLElement).style.color = '#C6A84B' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.10)'; (e.currentTarget as HTMLElement).style.color = '#F5F0E8' }}
    >{children}</button>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <SectionLabel number="01" label="What We Build" className="mb-3" />
          <AnimatedHeading
            text="Everything your brand needs to win online."
            className="text-h2 font-medium tracking-tighter text-text-primary max-w-lg"
          />
        </div>
        <Link to="/services" className="text-[13px] font-semibold tracking-[0.06em] uppercase text-accent hover:text-accent-dim transition-colors shrink-0 mb-1">
          All services →
        </Link>
      </div>

      {/* Carousel */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <ArrowBtn onClick={prev}>←</ArrowBtn>

        {/* Clipping window — only 3 cards wide */}
        <div style={{
          position: 'relative',
          flex: 1,
          height: 340,
          overflow: 'hidden',
        }}>
          {SERVICES.map((service, i) => (
            <ServiceSlideCard
              key={i}
              service={service}
              pos={getPos(i)}
              onPrev={prev}
              onNext={next}
            />
          ))}
        </div>

        <ArrowBtn onClick={next}>→</ArrowBtn>
      </div>

      {/* Counter */}
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <span style={{ fontSize: 11, color: 'rgba(245,240,232,0.28)', letterSpacing: '0.1em', fontVariantNumeric: 'tabular-nums' }}>
          {String(active + 1).padStart(2, '0')} / {String(SERVICES.length).padStart(2, '0')}
        </span>
      </div>
    </div>
  )
}

// ── Featured case study ─────────────────────────────────────────────
function FeaturedCase() {
  return (
    <div className="relative rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[rgba(0,0,0,0.02)] overflow-hidden p-8 md:p-10">
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-accent opacity-[0.04] translate-x-20 -translate-y-20 pointer-events-none" />
      <SectionLabel label="Featured Case Study" className="mb-5" />
      <FadeUp delay={0.1}>
        <p className="text-[13px] text-text-muted mb-2">Harvest Table · Food & Beverage · Boston, MA</p>
        <h3 className="text-[26px] font-medium tracking-tighter text-text-primary mb-3">
          +340% online reservations in 60 days
        </h3>
        <p className="text-[15px] text-text-muted leading-relaxed mb-6 max-w-lg">
          A full brand identity refresh and performance focused website that turned a local Boston restaurant into a fully booked destination.
        </p>
        <div className="flex flex-wrap gap-2.5 mb-6">
          {['Brand Identity', 'Web Design', 'SEO'].map(t => (
            <span key={t} className="px-3 py-1 rounded-full text-[12px] text-accent border border-[rgba(198,168,75,0.3)] bg-[rgba(198,168,75,0.06)]">
              {t}
            </span>
          ))}
        </div>
        <Link to="/case-studies" className="inline-flex items-center gap-1 text-[14px] font-semibold text-accent hover:text-accent-dim transition-colors">
          View all case studies →
        </Link>
      </FadeUp>
    </div>
  )
}

// ── Service image cards ──────────────────────────────────────────────
const SERVICE_CARDS = [
  {
    image: '/imgs/svc-brand.jpg',
    category: 'Branding',
    title: 'Brand Identity',
    desc: 'Logo, color system, typography — a cohesive identity that commands attention and builds trust from first glance.',
  },
  {
    image: '/imgs/svc-seo.jpg',
    category: 'Growth',
    title: 'SEO',
    desc: 'Boston-focused keyword strategy and technical SEO that gets you found by the right people at the right time.',
  },
  {
    image: '/imgs/svc-webdesign.jpg',
    category: 'Design',
    title: 'Web Design',
    desc: 'Pixel perfect, conversion optimized designs that balance beauty with function. Every screen intentional.',
  },
  {
    image: '/imgs/svc-webdev.jpg',
    category: 'Development',
    title: 'Web Dev',
    desc: 'Fast, accessible, SEO ready code built on modern frameworks. Performance baked in from the start.',
  },
  {
    image: '/imgs/svc-ecomm.jpg',
    category: 'Commerce',
    title: 'E-Commerce',
    desc: 'Online stores engineered to sell — from product pages to checkout. Optimized for conversion at every step.',
  },
  {
    image: '/imgs/svc-maintenance.jpg',
    category: 'Support',
    title: 'Maintenance',
    desc: 'Ongoing support, updates, and performance monitoring so your site never slows down or falls behind.',
  },
]

function ServiceGrid() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <SectionLabel number="01" label="What We Build" className="mb-3" />
          <AnimatedHeading
            text="Everything your brand needs to win online."
            className="text-h2 font-medium tracking-tighter text-text-primary max-w-lg"
          />
        </div>
        <Link
          to="/services"
          className="text-[13px] font-semibold tracking-[0.06em] uppercase text-accent hover:text-accent-dim transition-colors shrink-0 mb-1"
        >
          All services →
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {SERVICE_CARDS.map((card, i) => (
          <FadeUp key={card.title}>
            <article className={`svc-card${i < 3 ? ' svc-card--top' : ''}`}>
              <div className="svc-card__img-wrap" style={{ position: 'relative' }}>
                <img
                  src={card.image}
                  alt={card.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                {/* Blur + darken overlay */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0.35)',
                  backdropFilter: 'blur(3px)',
                  WebkitBackdropFilter: 'blur(3px)',
                }} />
                {/* Gradient for title legibility — flips direction per row */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: i < 3
                    ? 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)'
                    : 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 60%)',
                }} />
                <h3 style={{
                  position: 'absolute',
                  ...(i < 3 ? { bottom: 14 } : { top: 14 }),
                  left: 16, right: 16,
                  fontSize: 'clamp(22px, 3.5vw, 30px)',
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                  lineHeight: 1.05,
                  color: '#fff',
                  wordBreak: 'break-word',
                }}>
                  {card.title}
                </h3>
              </div>
              <div className="svc-card__data">
                <span style={{
                  display: 'block', fontSize: 10, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: '#C6A84B', fontWeight: 600, marginBottom: 6,
                }}>
                  {card.category}
                </span>
                <h3 style={{
                  fontSize: 17, fontWeight: 600, letterSpacing: '-0.03em',
                  color: '#1C1917', marginBottom: 8, lineHeight: 1.2,
                }}>
                  {card.title}
                </h3>
                <p style={{
                  fontSize: 13, color: '#78706A', lineHeight: 1.62, marginBottom: 12,
                }}>
                  {card.desc}
                </p>
                <Link
                  to="/services"
                  style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                    textTransform: 'uppercase', color: '#1C1917', textDecoration: 'none',
                  }}
                >
                  Learn More
                </Link>
              </div>
            </article>
          </FadeUp>
        ))}
      </div>
    </div>
  )
}

// ── Main ────────────────────────────────────────────────────────────
export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '40%'])

  // Sticky scroll: 300vh track
  // Phase 1 (0–35%):  tablet tilts 62°→0°
  // Phase 2 (35–75%): preview scrolls through TabletPreview
  // Phase 3: auto-fires when stickyProgress crosses 0.74 — tablet jets right, text reveals
  const stickyRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: stickyProgress } = useScroll({ target: stickyRef, offset: ['start start', 'end end'] })

  const tabletRotateX  = useTransform(stickyProgress, [0, 0.35],   [62, 0])
  const tabletOpacity  = useTransform(stickyProgress, [0, 0.08],   [0.4, 1])
  const screenRef = useRef<HTMLDivElement>(null)
  const previewWrapperRef = useRef<HTMLDivElement>(null)
  const previewScrollY = useTransform(stickyProgress, (v) => {
    const screenH  = screenRef.current?.clientHeight ?? 550
    const contentH = previewWrapperRef.current?.scrollHeight ?? 1450
    const maxScroll = Math.max(0, contentH - screenH)
    const t = Math.max(0, Math.min(1, (v - 0.35) / 0.40))
    return -maxScroll * t
  })

  // Prestige phrase expand — spring-smoothed scroll drives letter-spacing + scale
  const smoothPhrase        = useSpring(stickyProgress, { stiffness: 60, damping: 20, restDelta: 0.001 })
  const phraseLetterSpacing = useTransform(smoothPhrase, [0, 0.08, 0.22, 0.35], ['-0.05em', '0.015em', '0.075em', '0.11em'])
  const phraseWordSpacing   = useTransform(smoothPhrase, [0, 0.08, 0.22, 0.35], ['0em',     '0.06em',  '0.135em', '0.21em'])
  const phraseScale         = useTransform(smoothPhrase, [0, 0.08, 0.22, 0.35], [0.82, 0.90, 0.97, 1.00])

  // "precision" — white glow only, same scale as all words
  const precisionGlow = useTransform(smoothPhrase,
    [0.05, 0.35],
    ['0 0 0px rgba(255,255,255,0), 0 0 0px rgba(255,255,255,0)',
     '0 0 18px rgba(255,255,255,0.85), 0 0 48px rgba(255,255,255,0.35)']
  )

  // "prestige." — gold glow only, same scale as all words
  const prestigeGlow = useTransform(smoothPhrase,
    [0.08, 0.35],
    ['0 0 0px rgba(198,168,75,0), 0 0 0px rgba(198,168,75,0)',
     '0 0 22px rgba(198,168,75,0.95), 0 0 55px rgba(198,168,75,0.45)']
  )

  // Phase 3: imperative animation — fires once when phase 2 completes
  const tabletControls = useAnimation()
  const textControls   = useAnimation()
  const phase3Fired    = useRef(false)

  // Prestige heading — fixed top right, appears at 90% hero scroll, exits at 65% tablet
  const headingControls = useAnimation()
  const headingShown    = useRef(false)
  const headingExited   = useRef(false)

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (v > 0.90 && !headingShown.current) {
      headingShown.current = true
      headingExited.current = false
      headingControls.start({ opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } })
    } else if (v <= 0.90 && headingShown.current) {
      headingShown.current = false
      headingControls.start({ opacity: 0, y: 16, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } })
    }
  })

  useMotionValueEvent(stickyProgress, 'change', (v) => {
    // Heading exit at 65% tablet scroll
    if (v >= 0.65 && headingShown.current && !headingExited.current) {
      headingExited.current = true
      headingControls.start({ opacity: 0, y: -32, transition: { duration: 0.45, ease: [0.4, 0, 1, 1] } })
    } else if (v < 0.65 && headingExited.current) {
      headingExited.current = false
      headingControls.start({ opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } })
    }

    if (v >= 0.74 && !phase3Fired.current) {
      phase3Fired.current = true
      tabletControls.start({
        x: '180%',
        transition: { duration: 0.5, ease: [0.4, 0, 1, 1] },
      })
      textControls.start({
        opacity: 1, y: 0, scale: 1,
        transition: { duration: 0.65, delay: 0.18, ease: [0.16, 1, 0.3, 1] },
      })
    } else if (v < 0.74 && phase3Fired.current) {
      phase3Fired.current = false
      tabletControls.start({
        x: 0,
        transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
      })
      textControls.start({
        opacity: 0, y: 32, scale: 0.88,
        transition: { duration: 0.25, ease: [0.4, 0, 1, 1] },
      })
    }
  })

  return (
    <PageWrapper
      title="Designs By TA — Web Design Agency Boston MA"
      description="Designs By TA is a freelance web design agency in Boston, MA. We build high-performance websites, brand identities, and digital experiences that drive real results."
      canonical="https://designsbyta.com/"
    >


      {/* ── Hero — full-bleed editorial ──────────────────────── */}
      <section className="bg-background overflow-hidden" aria-label="Hero">

        {/* Parallax hero — full viewport, image drifts slower than scroll */}
        <div ref={heroRef} className="relative w-full overflow-hidden" style={{ height: '100dvh' }}>
          <motion.div
            className="absolute inset-0 w-full"
            style={{ y: imageY, height: '140%', top: '-20%' }}
          >
            <img
              src="/imgs/hero-desk.png"
              alt="Designs By TA studio — web design agency Boston MA"
              className="w-full h-full object-cover object-center"
            />
          </motion.div>

          {/* Edge shadows — vignette for depth */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%)'
          }} />
          {/* Left edge */}
          <div className="absolute inset-y-0 left-0 w-40 pointer-events-none bg-gradient-to-r from-black/50 to-transparent" />
          {/* Right edge */}
          <div className="absolute inset-y-0 right-0 w-40 pointer-events-none bg-gradient-to-l from-black/50 to-transparent" />
          {/* Top edge */}
          <div className="absolute inset-x-0 top-0 h-40 pointer-events-none bg-gradient-to-b from-black/40 to-transparent" />
          {/* Bottom gradient for text legibility */}
          <div className="absolute bottom-0 left-0 right-0 h-72 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

          {/* DESIGN — left · POWER — right, baseline flush to section edge */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-6 md:px-10 pointer-events-none select-none overflow-hidden"
            aria-hidden="true"
          >
            <span
              className="font-black tracking-tighter leading-none block"
              style={{ fontSize: 'clamp(36px, 12vw, 180px)', color: '#ffffff', marginBottom: '-0.18em', textShadow: '0 4px 12px rgba(0,0,0,0.5), 0 12px 40px rgba(0,0,0,0.35), 0 24px 80px rgba(0,0,0,0.2)' }}
            >
              DESIGN
            </span>
            <span
              className="font-black tracking-tighter leading-none block"
              style={{ fontSize: 'clamp(36px, 12vw, 180px)', color: '#ffffff', marginBottom: '-0.18em', textShadow: '0 4px 12px rgba(0,0,0,0.5), 0 12px 40px rgba(0,0,0,0.35), 0 24px 80px rgba(0,0,0,0.2)' }}
            >
              POWER
            </span>
          </motion.div>
        </div>

      </section>

      {/* ── Mobile: replaces 3D tablet section ── */}
      <div className="md:hidden bg-[#1C1917] py-14 px-6 text-center">
        <p className="text-[11px] tracking-[0.14em] uppercase text-[#78706A] mb-4">Where precision meets prestige.</p>
        <p
          className="font-black tracking-tighter leading-[1.05] mb-5"
          style={{ fontSize: 'clamp(34px, 9vw, 52px)', color: '#F5F0E8' }}
        >
          See,{' '}
          <span style={{ color: '#C6A84B', fontStyle: 'italic' }}>I told ya.</span>
        </p>
        <p className="text-[14px] text-[#78706A] leading-relaxed mb-8 max-w-xs mx-auto">
          Custom design, clean code, and real results — for businesses serious about growing online.
        </p>
        <a
          href="#start-project"
          className="inline-flex items-center px-6 py-3 rounded-full bg-accent text-[#1C1917] text-[14px] font-semibold tracking-[0.03em] hover:bg-accent-dim transition-colors"
        >
          Start Your Project
        </a>
      </div>

      {/* ── Tablet sticky section — desktop only, must live outside overflow-hidden ancestors ── */}
      <div className="hidden md:block bg-background">
        <div ref={stickyRef} style={{ height: '300vh', position: 'relative' }}>
          <div style={{
            position: 'sticky', top: 0, height: '100vh',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {/* Phase 3: "See, I told ya" — sits behind the tablet, revealed as it exits */}
            <motion.div
              animate={textControls}
              initial={{ opacity: 0, y: 32, scale: 0.88 }}
              style={{
                position: 'absolute',
                left: '50%',
                x: '-50%',
                textAlign: 'center',
                pointerEvents: 'none',
                userSelect: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              <p style={{
                fontSize: 'clamp(32px, 4.5vw, 72px)',
                fontWeight: 900,
                letterSpacing: '-0.04em',
                lineHeight: 1,
                color: '#F5F0E8',
              }}>
                <span style={{ color: '#ffffff' }}>See,</span>{' '}
                <span style={{ color: '#C6A84B', fontStyle: 'italic' }}>I told ya.</span>
              </p>
              <p style={{
                fontSize: 'clamp(12px, 1vw, 16px)',
                fontWeight: 400,
                color: 'rgba(245,240,232,0.45)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginTop: '1.2em',
              }}>That's what we build for our clients.</p>
            </motion.div>

            {/* Column: phrase floats above the tablet */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Prestige phrase — right-aligned, 5px above tablet */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={headingControls}
                style={{ alignSelf: 'flex-end', marginBottom: '5px', pointerEvents: 'none' }}
              >
                <motion.h2
                  className="font-medium whitespace-nowrap"
                  style={{ fontSize: 'clamp(16px, 2.2vw, 36px)', textAlign: 'right', letterSpacing: phraseLetterSpacing, wordSpacing: phraseWordSpacing, scale: phraseScale, transformOrigin: 'right center' }}
                >
                  <motion.span className="inline-block mr-[0.28em]" style={{ color: '#1C1917', scale: phraseScale, transformOrigin: 'center center' }}>Where</motion.span>
                  <motion.span className="inline-block mr-[0.28em]" style={{ color: '#ffffff', scale: phraseScale, textShadow: precisionGlow, transformOrigin: 'center center' }}>precision</motion.span>
                  <motion.span className="inline-block mr-[0.28em]" style={{ color: '#1C1917', scale: phraseScale, transformOrigin: 'center center' }}>meets</motion.span>
                  <motion.span className="inline-block mr-[0.28em]" style={{ color: '#C6A84B', scale: phraseScale, textShadow: prestigeGlow, transformOrigin: 'center center' }}>prestige.</motion.span>
                </motion.h2>
              </motion.div>

            <div style={{ perspective: '1400px', perspectiveOrigin: '50% 50%' }}>
              <motion.div
                animate={tabletControls}
                style={{
                  rotateX: tabletRotateX,
                  opacity: tabletOpacity,
                  transformOrigin: 'center center',
                  position: 'relative',
                  width: '60vw',
                  filter: 'drop-shadow(0 40px 60px rgba(0,0,0,0.25)) drop-shadow(0 10px 24px rgba(0,0,0,0.15))',
                }}
              >
                {/* Tablet frame — sits on top */}
                <img
                  src="/imgs/tablet-landscape.png"
                  alt="Web design showcase — Designs By TA"
                  style={{ width: '100%', display: 'block', position: 'relative', zIndex: 2 }}
                />
                {/* Screen area */}
                <div
                  ref={screenRef}
                  style={{
                    position: 'absolute',
                    top: '4.6%', left: '6.5%', right: '4.5%', bottom: '5%',
                    overflow: 'hidden',
                    borderRadius: '4px',
                    zIndex: 1,
                  }}
                >
                  {/* Phase 2: scroll drives TabletPreview upward */}
                  <motion.div ref={previewWrapperRef} style={{ y: previewScrollY }}>
                    <TabletPreview />
                  </motion.div>
                </div>
              </motion.div>
            </div>
            </div>{/* end column wrapper */}
          </div>
        </div>

      </div>

      {/* ── CTA strip ── */}
      <section className="bg-white py-6" aria-label="Call to action">
        <div className="max-w-2xl mx-auto px-6 flex flex-col items-center text-center gap-4">
          <FadeUp>
            <p className="text-[15px] text-text-muted leading-[1.7]">
              High-performance web design for Boston businesses ready to grow.<br />
              Brand identity, SEO, and development — under one roof.
            </p>
          </FadeUp>
          <FadeUp delay={0.15}>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href="#start-project"
                className="inline-flex items-center px-6 py-3 rounded-full bg-accent text-[#1C1917] text-[14px] font-semibold tracking-[0.03em] hover:bg-accent-dim transition-colors"
              >
                Start Your Project
              </a>
              <Link
                to="/portfolio"
                className="inline-flex items-center px-6 py-3 rounded-full border border-[rgba(0,0,0,0.15)] text-text-primary text-[14px] font-medium hover:border-accent hover:text-accent transition-colors"
              >
                View Work →
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── The Problem ──────────────────────────────────────── */}
      <section className="py-14 bg-background border-t border-[rgba(0,0,0,0.06)]" aria-label="Common pain points">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <FadeUp className="mb-10">
            <SectionLabel number="01" label="The Problem" className="mb-3" />
            <AnimatedHeading
              text="Why most websites fail their owners."
              className="text-h2 font-medium tracking-tighter text-text-primary"
            />
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {[
              {
                number: '01',
                title: 'Invisible to Search Engines',
                body: 'No keyword strategy, no local SEO, no technical foundation. Your site exists — but Google doesn\'t know it.',
              },
              {
                number: '02',
                title: 'Design That Repels, Not Converts',
                body: 'Cluttered layouts and unclear CTAs mean visitors leave in seconds because nothing guides them toward action.',
              },
              {
                number: '03',
                title: 'Not Built to Sell',
                body: 'No e-commerce, no booking system, no lead capture. Revenue that should come through your site goes elsewhere.',
              },
              {
                number: '04',
                title: 'Broken on Mobile',
                body: 'Over 60% of traffic is on a phone. A site that isn\'t fast and responsive hands those customers to competitors.',
              },
              {
                number: '05',
                title: 'No Brand Consistency',
                body: 'Mismatched fonts, clashing colors, and a fragmented identity. Customers can\'t remember you — let alone trust you.',
              },
              {
                number: '06',
                title: 'Slow Load, Lost Sales',
                body: 'Every extra second of load time costs conversions. A sluggish site signals low quality before a word is read.',
              },
            ].map((item) => (
              <FadeUp key={item.number}>
                <div className="group p-5 rounded-xl border border-[rgba(0,0,0,0.07)] bg-[rgba(0,0,0,0.02)] hover:border-accent/30 hover:bg-[rgba(198,168,75,0.03)] transition-all duration-300">
                  <p className="text-[10px] tracking-[0.12em] uppercase text-accent/50 font-medium mb-2.5">{item.number}</p>
                  <h3 className="text-[15px] font-medium tracking-tight text-text-primary mb-2 leading-snug">{item.title}</h3>
                  <p className="text-[13px] text-text-muted leading-relaxed">{item.body}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quote focal section ───────────────────────────────── */}
      <section className="relative bg-background py-12 overflow-hidden" aria-label="Design philosophy">

        {/* Atmospheric background glow */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(198,168,75,0.07) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(198,168,75,0.4), transparent)',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(198,168,75,0.4), transparent)',
        }} />

        <div className="relative max-w-none px-6 lg:px-8 text-center">

          {/* Quote */}
          <FadeUp>
            <blockquote>
              <p
                className="font-medium tracking-tighter text-text-primary italic leading-[1.18]"
                style={{ fontSize: 'clamp(28px, 4vw, 62px)' }}
              >
                <QuoteFirstLine />
                <span style={{ display: 'block' }}><ExpandWord>feels</ExpandWord> like. Design is how it <ShuffleWord>works</ShuffleWord>."</span>
              </p>

              {/* Attribution — tight to the quote */}
              <p className="mt-3 text-[12px] tracking-[0.08em] uppercase text-text-muted">
                — Steve Jobs, Co-founder of Apple
              </p>
            </blockquote>
          </FadeUp>

        </div>
      </section>

      {/* ── Services ─────────────────────────────────────────── */}
      <section className="py-14 bg-background" aria-label="Services overview">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <ServiceGrid />
        </div>
      </section>

      {/* ── Featured case study ──────────────────────────────── */}
      <section className="py-14 bg-[rgba(0,0,0,0.02)] border-y border-[rgba(0,0,0,0.06)]" aria-label="Featured case study">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <FadeUp className="mb-8">
            <SectionLabel number="02" label="Case Studies" className="mb-3" />
            <AnimatedHeading
              text="Real results, real clients."
              className="text-h2 font-medium tracking-tighter text-text-primary"
            />
          </FadeUp>
          <div className="max-w-3xl">
            <FeaturedCase />
          </div>
        </div>
      </section>

      {/* ── Social proof ─────────────────────────────────────── */}
      <section className="py-12 bg-background" aria-label="Client roster">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <FadeUp>
            <p className="text-center text-[12px] tracking-[0.14em] uppercase text-text-muted mb-8">
              Trusted by businesses in Boston and beyond
            </p>
          </FadeUp>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4"
          >
            {[
              'Harvest Table · F&B',
              'Summit Wealth · Finance',
              'FORMA Skincare · E-Commerce',
              'Clearview Dental · Healthcare',
              'Apex Audio · Electronics',
            ].map(client => (
              <motion.span key={client} variants={staggerItem} className="text-[14px] text-text-muted font-medium">
                {client}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      <CTASection />
      <Footer />
    </PageWrapper>
  )
}
