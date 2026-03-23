import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useAnimation, useMotionValueEvent, useSpring } from 'framer-motion'
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

      {/* ── Mobile: editorial layout (Stitch design) ── */}
      <div className="md:hidden">

        {/* Selected Works */}
        <section className="bg-[#f8f3eb] py-16 px-6">
          <div className="flex justify-between items-end mb-10">
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#735c00] block mb-2">Curation</span>
              <h2 className="font-serif italic text-3xl leading-tight tracking-tight text-text-primary">Selected Works</h2>
            </div>
            <Link to="/portfolio" className="text-accent">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
            </Link>
          </div>

          <div className="flex flex-col gap-14">
            {/* Project 01 — NexaBank */}
            <article className="group">
              <div className="aspect-[4/5] overflow-hidden bg-[#ece8e0] mb-5">
                <img src="/imgs/nexa-hero.png" alt="NexaBank — Fintech Web App" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-[10px] uppercase tracking-widest text-text-muted">Fintech &amp; Web App</span>
                <span className="text-[10px] text-text-muted font-serif italic text-[#C6A84B]">01</span>
              </div>
              <h3 className="font-serif italic text-2xl tracking-tight text-text-primary mb-2">NexaBank</h3>
              <p className="text-text-muted text-sm leading-relaxed mb-4">A modern digital banking platform with real-time transaction feeds, account management, and a clean onboarding flow.</p>
              <Link to="/demo/fintech" className="inline-flex items-center gap-1.5 text-[#735c00] font-serif italic text-base border-b border-[rgba(198,168,75,0.4)] pb-0.5 hover:opacity-70 transition-opacity">
                View Demo
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
              </Link>
            </article>

            {/* Project 02 — Chez Laurent (offset right) */}
            <article className="group self-end w-[90%] ml-auto">
              <div className="aspect-square overflow-hidden bg-[#ece8e0] mb-5">
                <img src="/imgs/restaurant-hero-main.png" alt="Chez Laurent — Restaurant Branding" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-[10px] uppercase tracking-widest text-text-muted">Hospitality &amp; Branding</span>
                <span className="text-[10px] text-text-muted font-serif italic text-[#C6A84B]">02</span>
              </div>
              <h3 className="font-serif italic text-2xl tracking-tight text-text-primary mb-2">Chez Laurent</h3>
              <p className="text-text-muted text-sm leading-relaxed mb-4">Fine dining brand identity and website — elegant typography, reservation system, and a menu that makes you hungry.</p>
              <Link to="/demo/restaurant" className="inline-flex items-center gap-1.5 text-[#735c00] font-serif italic text-base border-b border-[rgba(198,168,75,0.4)] pb-0.5 hover:opacity-70 transition-opacity">
                View Demo
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
              </Link>
            </article>
          </div>
        </section>

        {/* Our Expertise */}
        <section className="bg-background py-16 px-6">
          <h2 className="font-serif italic text-3xl leading-tight tracking-tight text-text-primary mb-10">Our Expertise</h2>
          <div className="flex flex-col divide-y divide-[rgba(0,0,0,0.07)]">
            {[
              { num: '01', title: 'Brand Identity', desc: 'A cohesive visual system that makes your business instantly recognizable — from logo through every touchpoint.' },
              { num: '02', title: 'Web Design', desc: 'Conversion-optimized, pixel-perfect designs that balance aesthetic impact with measurable function.' },
              { num: '03', title: 'Web Development', desc: 'Fast, clean, accessible code built on modern frameworks — deployed and ready to scale.' },
            ].map(({ num, title, desc }) => (
              <div key={num} className="flex gap-5 py-10">
                <span className="font-serif italic text-xl text-[#C6A84B] pt-0.5 shrink-0">{num}</span>
                <div>
                  <h4 className="font-semibold text-sm uppercase tracking-widest text-text-primary mb-2">{title}</h4>
                  <p className="text-text-muted text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <Link to="/services" className="inline-flex items-center gap-2 mt-6 text-[#735c00] font-serif italic text-base border-b border-[rgba(198,168,75,0.4)] pb-0.5 hover:opacity-70 transition-opacity">
            All Services →
          </Link>
        </section>

        {/* Dark CTA block */}
        <section className="bg-[#1C1917] py-16 px-6 text-center">
          <h3 className="font-serif italic text-3xl text-[#F5F0E8] mb-6">Ready to transcend?</h3>
          <p className="text-[#78706A] text-sm mb-8 px-4 leading-relaxed">Custom design, clean code, and real results — for businesses serious about growing online.</p>
          <a href="#start-project" className="inline-block bg-accent text-[#1C1917] px-10 py-4 font-bold text-xs tracking-widest uppercase hover:bg-accent-dim transition-colors">
            Start Your Project
          </a>
        </section>

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

      {/* ── Desktop-only sections ── */}
      <div className="hidden md:block">

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

      </div>{/* end desktop-only sections */}

      <CTASection />
      <Footer />
    </PageWrapper>
  )
}
