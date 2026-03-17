import { useRef, useState, useEffect } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import { Check, ArrowRight, Star } from 'lucide-react'

// ── Data ──────────────────────────────────────────────────────────────────────

const SPECS = [
  { label: 'Driver Size',        value: '12mm Dynamic' },
  { label: 'Frequency Response', value: '20Hz – 20kHz' },
  { label: 'Battery Life',       value: '10hrs (40hrs w/ case)' },
  { label: 'Charging',           value: '90 min full · 15 min fast charge' },
  { label: 'Connectivity',       value: 'Bluetooth 5.3' },
  { label: 'Water Resistance',   value: 'IPX5' },
  { label: 'Noise Cancellation', value: 'Active (−38dB)' },
  { label: 'Weight',             value: '5.6g per earbud' },
]

const REVIEWS = [
  { name: 'Alex M.',   rating: 5, text: 'Best earbuds I\'ve ever owned. The ANC is unreal. I forgot I was on a flight.' },
  { name: 'Jordan T.', rating: 5, text: 'Sound quality is genuinely incredible. Rich bass, crystal highs. Nothing else at this price comes close.' },
  { name: 'Priya K.',  rating: 5, text: 'The call quality sold my entire team on these. No more "you\'re cutting out."' },
]

const HIGHLIGHTS = [
  { value: '40',    unit: 'hr',   label: 'Total battery life' },
  { value: '−38',  unit: 'dB',   label: 'Active noise cancellation' },
  { value: '6',    unit: '',      label: 'Beamforming microphones' },
  { value: 'IPX5', unit: '',      label: 'Water resistance rating' },
]

// ── Hover Border Button ────────────────────────────────────────────────────────

type BtnDirection = 'TOP' | 'LEFT' | 'BOTTOM' | 'RIGHT'
const DIRS: BtnDirection[] = ['TOP', 'LEFT', 'BOTTOM', 'RIGHT']

const BORDER_MAP: Record<BtnDirection, string> = {
  TOP:    'radial-gradient(20.7% 50% at 50% 0%,    rgba(0,229,255,1) 0%, rgba(0,229,255,0) 100%)',
  LEFT:   'radial-gradient(16.6% 43.1% at 0% 50%,  rgba(0,229,255,1) 0%, rgba(0,229,255,0) 100%)',
  BOTTOM: 'radial-gradient(20.7% 50% at 50% 100%,  rgba(0,229,255,1) 0%, rgba(0,229,255,0) 100%)',
  RIGHT:  'radial-gradient(16.2% 41.2% at 100% 50%,rgba(0,229,255,1) 0%, rgba(0,229,255,0) 100%)',
}
const BORDER_HIGHLIGHT = 'radial-gradient(75% 181% at 50% 50%, rgba(0,229,255,0.7) 0%, rgba(0,229,255,0) 100%)'

function HoverBorderButton({
  children,
  innerStyle,
  duration = 1.4,
  clockwise = true,
  onClick,
  outerStyle,
}: {
  children: React.ReactNode
  innerStyle?: React.CSSProperties
  outerStyle?: React.CSSProperties
  duration?: number
  clockwise?: boolean
  onClick?: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const [dir, setDir] = useState<BtnDirection>('BOTTOM')

  useEffect(() => {
    if (hovered) return
    const id = setInterval(() =>
      setDir(d => DIRS[clockwise ? (DIRS.indexOf(d) - 1 + 4) % 4 : (DIRS.indexOf(d) + 1) % 4])
    , duration * 1000)
    return () => clearInterval(id)
  }, [hovered, duration, clockwise])

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 980,
        padding: 1,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        ...outerStyle,
      }}
    >
      {/* animated gradient border */}
      <motion.div
        initial={{ background: BORDER_MAP[dir] }}
        animate={{ background: hovered ? [BORDER_MAP[dir], BORDER_HIGHLIGHT] : BORDER_MAP[dir] }}
        transition={{ ease: 'linear', duration: hovered ? 0.5 : duration }}
        style={{
          position: 'absolute', inset: 0,
          borderRadius: 'inherit',
          filter: 'blur(2px)',
          zIndex: 0,
        }}
      />
      {/* content */}
      <div style={{
        position: 'relative', zIndex: 1,
        borderRadius: 980,
        padding: '10px 24px',
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
        fontSize: 15,
        fontWeight: 600,
        transition: 'opacity 0.2s',
        ...innerStyle,
      }}>
        {children}
      </div>
    </button>
  )
}

// ── Mobile hook ───────────────────────────────────────────────────────────────
function useIsMobile() {
  const [m, setM] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false)
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return m
}

// ── Detail Section ────────────────────────────────────────────────────────────

const LINES = [
  { text: 'Engineered for every ear.', muted: false },
  { text: 'Obsessed over every detail.', muted: true },
]

function DetailSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const inView = useInView(textRef, { once: true, margin: '-15% 0px' })

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '12%'])

  return (
    <section ref={sectionRef} style={{ position: 'relative', height: '80vh', overflow: 'hidden' }}>
      <motion.img
        src="/imgs/apex-detail.png"
        alt="Apex Pro detail"
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          width: '100%', height: '115%',
          objectFit: 'cover', objectPosition: 'top',
          y: imgY,
        }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)' }} />

      <div ref={textRef} style={{ position: 'absolute', bottom: 64, left: 0, right: 0, textAlign: 'center', zIndex: 2 }}>
        {LINES.map((line, li) => (
          <p key={li} style={{ fontSize: 'clamp(24px, 4vw, 48px)', fontWeight: 600, lineHeight: 1.15, marginBottom: 4, overflow: 'hidden', display: 'block' }}>
            {line.text.split(' ').map((word, wi) => (
              <motion.span
                key={wi}
                initial={{ y: '110%', opacity: 0 }}
                animate={inView ? { y: '0%', opacity: 1 } : {}}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: li * 0.18 + wi * 0.065 }}
                style={{
                  display: 'inline-block',
                  marginRight: '0.28em',
                  color: line.muted ? 'rgba(255,255,255,0.4)' : '#ffffff',
                }}
              >
                {word}
              </motion.span>
            ))}
          </p>
        ))}
      </div>
    </section>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const FONT = "-apple-system, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif"
const CYAN = '#00E5FF'

// White glow for hero title only
const HERO_GLOW: React.CSSProperties = {
  color: '#ffffff',
  textShadow: '0 0 30px rgba(255,255,255,0.6), 0 0 60px rgba(255,255,255,0.3), 0 0 100px rgba(255,255,255,0.15)',
}

export default function ProductDemo() {
  const mobile = useIsMobile()
  const [hoveredNav, setHoveredNav] = useState<string | null>(null)

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', fontFamily: FONT, color: '#f5f5f7', overflowX: 'hidden' }}>

      {/* ── Nav ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: mobile ? '0 16px' : '0 48px',
        backgroundColor: 'rgba(0,0,0,0.8)',
        backdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 3, color: '#fff' }}>APEX</span>
        <div style={{ display: mobile ? 'none' : 'flex', gap: 32 }}>
          {['Products', 'Technology', 'Sound Lab', 'Support'].map(link => (
            <a
              key={link} href="#"
              style={{ fontSize: 13, color: hoveredNav === link ? '#f5f5f7' : 'rgba(245,245,247,0.5)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={() => setHoveredNav(link)}
              onMouseLeave={() => setHoveredNav(null)}
            >{link}</a>
          ))}
        </div>
        <HoverBorderButton
          innerStyle={{ backgroundColor: 'rgba(0,0,0,0.6)', color: CYAN, fontWeight: 500, padding: '7px 20px', fontSize: 13 }}
          duration={1.8}
        >
          Buy →
        </HoverBorderButton>
      </nav>

      {/* ── Hero ── */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 80, position: 'relative', overflow: 'hidden' }}>
        {/* Full-bleed background image */}
        <img
          src="/imgs/apex-hero.png"
          alt="Apex Pro earbuds"
          style={{ position: 'absolute', top: 52, left: 0, right: 0, bottom: 0, width: '100%', height: 'calc(100% - 52px)', objectFit: 'cover', objectPosition: 'center top' }}
        />
        {/* Bottom fade to black */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', background: 'linear-gradient(to top, #000 0%, rgba(0,0,0,0.7) 50%, transparent 100%)' }} />
        {/* Top fade */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '20%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)' }} />

        {/* Hero text */}
        <div style={{ position: 'relative', textAlign: 'center', zIndex: 2, maxWidth: 800 }}>
          <h1 style={{ fontSize: 'clamp(48px, 8vw, 96px)', fontWeight: 700, lineHeight: 1.02, letterSpacing: '-0.025em', marginBottom: 20, ...HERO_GLOW }}>
            Sound without limits.
          </h1>
          <p style={{ fontSize: 19, color: 'rgba(245,245,247,0.6)', marginBottom: 40, letterSpacing: '-0.01em' }}>
            From $249
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <HoverBorderButton
              innerStyle={{ backgroundColor: CYAN, color: '#000' }}
            >
              Buy <ArrowRight size={15} />
            </HoverBorderButton>
            <HoverBorderButton
              innerStyle={{ backgroundColor: 'rgba(20,20,22,0.85)', backdropFilter: 'blur(10px)', color: '#f5f5f7', fontWeight: 500 }}
              clockwise={false}
            >
              Learn more
            </HoverBorderButton>
          </div>
        </div>
      </section>

      {/* ── Cinematic statement ── */}
      <section style={{ padding: mobile ? '48px 20px' : '72px 48px', textAlign: 'center', backgroundColor: '#000' }}>
        <p style={{ fontSize: 12, color: CYAN, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Apex Sound Engine</p>
        <h2 style={{ fontSize: 'clamp(28px, 5vw, 60px)', fontWeight: 700, color: '#f5f5f7', lineHeight: 1.06, letterSpacing: '-0.03em', maxWidth: 820, margin: '0 auto 20px' }}>
          The most advanced audio<br />
          <span style={{ color: 'rgba(245,245,247,0.35)' }}>we've ever engineered.</span>
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(245,245,247,0.5)', maxWidth: 500, margin: '0 auto', lineHeight: 1.6, letterSpacing: '-0.01em' }}>
          12mm custom-tuned drivers. Concert-hall clarity. Deep, controlled bass with zero distortion.
        </p>
      </section>

      {/* ── Full-bleed detail image ── */}
      <DetailSection />

      {/* ── Highlight stats ── */}
      <section style={{ backgroundColor: '#000', padding: '64px 48px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: mobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 1, backgroundColor: 'rgba(255,255,255,0.06)' }}>
          {HIGHLIGHTS.map((h, i) => (
            <div key={i} style={{ backgroundColor: '#000', padding: mobile ? '24px 16px' : '36px 28px', textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: 700, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6 }}>
                {h.value}<span style={{ color: CYAN }}>{h.unit}</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(245,245,247,0.45)', letterSpacing: '-0.01em' }}>{h.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Lifestyle split ── */}
      <section style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', minHeight: mobile ? 'auto' : '70vh' }}>
        {/* Image */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <img
            src="/imgs/apex-lifestyle.png"
            alt="Apex Pro lifestyle"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 60%, #000)' }} />
        </div>

        {/* Text */}
        <div style={{ backgroundColor: '#000', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: mobile ? '36px 20px' : '56px 48px' }}>
          <p style={{ fontSize: 11, color: CYAN, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14 }}>Active Noise Cancellation</p>
          <h2 style={{ fontSize: 'clamp(26px, 3vw, 42px)', fontWeight: 700, color: '#f5f5f7', lineHeight: 1.06, letterSpacing: '-0.025em', marginBottom: 16 }}>
            Silence the world.<br />Hear only what matters.
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(245,245,247,0.5)', lineHeight: 1.65, letterSpacing: '-0.01em', marginBottom: 28, maxWidth: 380 }}>
            Up to −38dB of adaptive noise cancellation, powered by six beamforming microphones that adjust in real time to your environment.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {['Adaptive ANC adjusts to your surroundings', 'Transparency mode for situational awareness', 'Wind noise reduction built in'].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Check size={15} color={CYAN} />
                <span style={{ fontSize: 15, color: 'rgba(245,245,247,0.65)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Battery section ── */}
      <section style={{ backgroundColor: '#111', padding: mobile ? '48px 20px' : '72px 48px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontSize: 11, color: CYAN, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14 }}>Battery Life</p>
        <h2 style={{ fontSize: 'clamp(32px, 6vw, 76px)', fontWeight: 700, color: '#f5f5f7', lineHeight: 1, letterSpacing: '-0.04em', marginBottom: 16 }}>
          40 hours.<br /><span style={{ color: 'rgba(245,245,247,0.3)' }}>Not a typo.</span>
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(245,245,247,0.45)', maxWidth: 440, margin: '0 auto', lineHeight: 1.65, letterSpacing: '-0.01em' }}>
          10 hours per charge. 40 total with the wireless charging case. And 15 minutes of charging gives you 3 more hours when you need it.
        </p>
      </section>

      {/* ── Specs ── */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', backgroundColor: '#000', padding: mobile ? '40px 20px' : '64px 48px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: '#f5f5f7', letterSpacing: '-0.025em', marginBottom: 36, textAlign: 'center' }}>Tech specs</h2>
          {SPECS.map((spec, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 0',
              borderBottom: i < SPECS.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            }}>
              <span style={{ fontSize: 15, color: 'rgba(245,245,247,0.45)' }}>{spec.label}</span>
              <span style={{ fontSize: 15, color: '#f5f5f7', fontWeight: 500, textAlign: 'right', maxWidth: '55%' }}>{spec.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Reviews ── */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', position: 'relative', padding: mobile ? '40px 20px' : '64px 48px', overflow: 'hidden' }}>
        {/* Background image */}
        <img
          src="/imgs/apex-crowd.png"
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', filter: 'blur(6px)', transform: 'scale(1.05)' }}
        />
        {/* Dark overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.82)' }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 30, fontWeight: 700, color: '#f5f5f7', letterSpacing: '-0.025em', marginBottom: 36, textAlign: 'center' }}>People love it.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3,1fr)', gap: 2, backgroundColor: 'rgba(255,255,255,0.06)' }}>
            {REVIEWS.map((r, i) => (
              <div key={i} style={{ backgroundColor: '#000', padding: '28px 28px' }}>
                <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
                  {Array.from({ length: r.rating }).map((_, j) => (
                    <Star key={j} size={11} fill={CYAN} color={CYAN} />
                  ))}
                </div>
                <p style={{ fontSize: 14, color: 'rgba(245,245,247,0.75)', lineHeight: 1.6, marginBottom: 16, letterSpacing: '-0.01em' }}>"{r.text}"</p>
                <p style={{ fontSize: 12, color: 'rgba(245,245,247,0.3)' }}>{r.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Order ── */}
      <section style={{ backgroundColor: '#000', borderTop: '1px solid rgba(255,255,255,0.06)', padding: mobile ? '48px 20px' : '72px 48px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'rgba(245,245,247,0.45)', letterSpacing: '0.02em', marginBottom: 12 }}>Apex Pro · 3rd Generation</p>
        <h2 style={{ fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 700, color: '#f5f5f7', letterSpacing: '-0.03em', lineHeight: 1.02, marginBottom: 8 }}>
          From <span style={{ color: CYAN }}>$249.</span>
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(245,245,247,0.4)', marginBottom: 32 }}>Free shipping. 30-day returns. 2-year warranty.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <HoverBorderButton
            innerStyle={{ backgroundColor: CYAN, color: '#000', padding: '12px 32px' }}
          >
            Order now <ArrowRight size={14} />
          </HoverBorderButton>
          <HoverBorderButton
            innerStyle={{ backgroundColor: 'rgba(20,20,22,0.9)', color: '#f5f5f7', fontWeight: 500, padding: '12px 32px' }}
            clockwise={false}
          >
            Compare models
          </HoverBorderButton>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: mobile ? '16px 20px' : '18px 48px', backgroundColor: '#111' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: mobile ? 'column' : 'row', gap: mobile ? 6 : 0, justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 3, color: 'rgba(245,245,247,0.2)' }}>APEX</span>
          <p style={{ fontSize: 12, color: 'rgba(245,245,247,0.18)' }}>© 2026 Apex Audio · Demo by Designs by TA</p>
          <div style={{ display: mobile ? 'none' : 'flex', gap: 20 }}>
            {['Privacy', 'Warranty', 'Contact'].map(link => (
              <a key={link} href="#" style={{ fontSize: 12, color: 'rgba(245,245,247,0.2)', textDecoration: 'none' }}>{link}</a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  )
}
