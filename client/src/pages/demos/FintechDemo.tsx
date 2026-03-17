import { useState, useRef, useEffect } from 'react'
import { Shield, Zap, Globe, BarChart3, ArrowRight, CheckCircle, Star, CreditCard, TrendingUp, Building2, Wallet } from 'lucide-react'
import { ShimmerButton } from '@/components/ui/shimmer-button'
import { Button } from '@/components/ui/button'

// ── Tokens ────────────────────────────────────────────────────────────────────
const BG           = '#090F1E'
const BLUE         = '#1D6AFF'
const TEXT         = '#E8EDF5'
const MUTED        = 'rgba(232,237,245,0.5)'
const DIM          = 'rgba(232,237,245,0.25)'
const CARD_BG      = 'rgba(255,255,255,0.035)'
const BORDER       = 'rgba(255,255,255,0.08)'
const FONT_DISPLAY = "'Bebas Neue', sans-serif"
const FONT_BODY    = "'DM Sans', sans-serif"

// ── Data ──────────────────────────────────────────────────────────────────────
const NAV_LINKS = ['Personal', 'Business', 'Investing', 'Learn', 'Support']

const TABS = [
  { id: 'checking', label: 'Checking',   Icon: Wallet    },
  { id: 'savings',  label: 'Savings',    Icon: TrendingUp },
  { id: 'credit',   label: 'Credit',     Icon: CreditCard },
  { id: 'business', label: 'Business',   Icon: Building2  },
]

const PRODUCTS: Record<string, Array<{
  name: string; tagline: string; apy?: string; rate?: string
  features: string[]; badge?: string
}>> = {
  checking: [
    {
      name: 'NexaCheck',
      tagline: 'No fees. No minimums. No compromises.',
      features: ['No monthly fees', 'No minimum balance', 'Overdraft protection', 'Unlimited transactions'],
      badge: 'Most Popular',
    },
    {
      name: 'NexaCheck Pro',
      tagline: 'For those who move fast and spend smart.',
      features: ['Priority customer support', 'Instant international transfers', 'Virtual card generation', 'Cashback on debit purchases'],
    },
  ],
  savings: [
    {
      name: 'NexaSave',
      tagline: 'Your money grows while you sleep.',
      apy: '4.85% APY',
      features: ['High-yield savings rate', 'FDIC insured up to $250K', 'No withdrawal limits', 'Automatic savings rules'],
      badge: 'Best Rate',
    },
    {
      name: 'NexaGoal',
      tagline: 'Save smarter with AI-powered goals.',
      apy: '4.60% APY',
      features: ['Smart goal tracking', 'Automated round-ups', 'Projected growth chart', 'Milestone rewards'],
    },
  ],
  credit: [
    {
      name: 'NexaCard',
      tagline: 'Unlimited 2% cashback. No annual fee.',
      rate: '2% Cashback',
      features: ['Unlimited 2% on every purchase', 'No annual fee', '$200 welcome bonus', 'Zero foreign transaction fees'],
      badge: 'No Annual Fee',
    },
    {
      name: 'NexaCard Elite',
      tagline: 'Premium rewards for premium spenders.',
      rate: '3% Cashback',
      features: ['3% on dining and travel', 'Airport lounge access', '$400 welcome bonus', 'Concierge service'],
    },
  ],
  business: [
    {
      name: 'NexaBiz',
      tagline: 'Banking that grows with your business.',
      features: ['Dedicated business account', 'Team expense cards', 'Real-time spend analytics', 'Free ACH transfers'],
      badge: 'For Teams',
    },
    {
      name: 'NexaBiz Enterprise',
      tagline: 'Enterprise-grade banking infrastructure.',
      features: ['Custom API integrations', 'Multi-entity management', 'Priority SLA support', 'Advanced cash flow tools'],
    },
  ],
}

const STATS = [
  { value: '2.4M+',  label: 'Active Members'       },
  { value: '$12.8B', label: 'Assets Managed'        },
  { value: '4.85%',  label: 'High-Yield APY'        },
  { value: '4.9★',   label: 'App Store Rating'      },
]

const FEATURES = [
  { Icon: Zap,       title: 'Instant Transfers',   desc: 'Send money anywhere in the world in seconds with zero fees and real-time exchange rates.' },
  { Icon: BarChart3, title: 'Smart Savings',        desc: 'AI adapts to your spending patterns and automatically moves money when you can afford it.' },
  { Icon: Shield,    title: 'Bank-Grade Security',  desc: '256-bit encryption, biometric authentication, and real-time fraud monitoring. Always on.' },
  { Icon: Globe,     title: 'Global Access',        desc: 'Use your NexaBank account in 150+ countries with zero foreign transaction fees, ever.' },
]

const PLAN_FEATURES = [
  'Unlimited transactions',
  'Free wire transfers',
  'Priority support 24/7',
  'Advanced analytics dashboard',
  'Multi-currency accounts',
  'FDIC insured up to $250K',
]

const TESTIMONIALS = [
  {
    name: 'Sarah Chen', role: 'Founder, Luma Creative', stars: 5,
    quote: 'NexaBank completely changed how I manage my business finances. Instant transfers and the analytics dashboard alone saved us hours every week.',
  },
  {
    name: 'Marcus Webb', role: 'Freelance Designer', stars: 5,
    quote: 'The 4.85% APY actually got me to start saving consistently. The auto-save rules are genius. I barely notice the money leaving.',
  },
  {
    name: 'Priya Nair', role: 'E-commerce Entrepreneur', stars: 5,
    quote: 'Migrating from my old bank was seamless. The business card analytics are better than most enterprise tools I have used.',
  },
]

const TRUST_ITEMS = [
  'FDIC Insured up to $250,000',
  'No Monthly Fees',
  '256-bit Encryption',
  '24/7 Live Support',
]

// ── Bauhaus Product Card ──────────────────────────────────────────────────────

type ProductShape = typeof PRODUCTS['checking'][0]

function BauhausProductCard({ p, delay = '0s' }: { p: ProductShape; delay?: string }) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return
    const onMove = (e: MouseEvent) => {
      const r = card.getBoundingClientRect()
      const angle = Math.atan2(-(e.clientX - r.left - r.width / 2), e.clientY - r.top - r.height / 2)
      card.style.setProperty('--rotation', angle + 'rad')
    }
    card.addEventListener('mousemove', onMove)
    return () => card.removeEventListener('mousemove', onMove)
  }, [])

  const CARD_DARK = '#0B1120'

  return (
    <div
      ref={cardRef}
      style={{
        position: 'relative',
        borderRadius: 20,
        border: '2px solid transparent',
        backgroundImage: `
          linear-gradient(${CARD_DARK}, ${CARD_DARK}),
          linear-gradient(calc(var(--rotation, 4.2rad)), ${BLUE} 0%, ${CARD_DARK} 30%, transparent 80%)
        `,
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
        boxShadow: '1px 12px 25px rgba(0,0,0,0.55)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        // @ts-ignore
        '--rotation': '4.2rad',
      } as React.CSSProperties}
    >
      {/* Header */}
      <div style={{ padding: '18px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {p.badge
          ? <div style={{ display: 'inline-block', backgroundColor: 'rgba(29,106,255,0.1)', border: '1px solid rgba(29,106,255,0.25)', borderRadius: 100, padding: '2px 10px', fontSize: 9, color: '#5B96FF', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{p.badge}</div>
          : <div />
        }
        <svg viewBox="0 0 24 24" fill={MUTED} style={{ width: 16, cursor: 'pointer', flexShrink: 0 }}>
          <path fillRule="evenodd" d="M10.5 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm0 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm0 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0" clipRule="evenodd" />
        </svg>
      </div>

      {/* Body */}
      <div style={{ padding: '10px 22px 16px', flex: 1 }}>
        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, color: '#fff', letterSpacing: 1, marginBottom: 2 }}>{p.name}</h3>

        {(p.apy || p.rate) && (
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: BLUE, letterSpacing: 1, marginBottom: 4 }}>{p.apy ?? p.rate}</div>
        )}

        <p style={{ fontSize: 12, color: MUTED, marginBottom: 14, lineHeight: 1.55 }}>{p.tagline}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {p.features.map((f, j) => (
            <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={11} color={BLUE} />
              <span style={{ fontSize: 12, color: 'rgba(232,237,245,0.65)' }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 22px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 10 }}>
        <ShimmerButton background="rgba(29,106,255,1)" borderRadius="10px" shimmerDelay={delay} className="flex-1 py-2.5 text-[13px] justify-center">
          Open Account
        </ShimmerButton>
        <Button variant="outline" className="flex-1 rounded-[10px] py-2.5 text-[13px]">
          Learn more
        </Button>
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FintechDemo() {
  const [activeTab, setActiveTab] = useState('checking')

  return (
    <div style={{ backgroundColor: BG, minHeight: '100vh', fontFamily: FONT_BODY, color: TEXT }}>

      {/* ── Nav ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={13} color="#fff" />
            </div>
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 18, letterSpacing: 2, color: '#fff' }}>NexaBank</span>
          </div>

          <div style={{ display: 'flex', gap: 28 }}>
            {NAV_LINKS.map(link => (
              <a
                key={link} href="#"
                style={{ color: MUTED, fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = TEXT)}
                onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
              >{link}</a>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <a href="#" style={{ fontSize: 14, color: MUTED, textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = TEXT)}
              onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
            >Sign In</a>
            <ShimmerButton background="rgba(29,106,255,1)" borderRadius="10px" shimmerDelay="0.6s" className="px-5 py-2 text-[13px]">
              Open Account
            </ShimmerButton>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', height: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        <img
          src="/imgs/nexa-hero.png"
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        />
        {/* Directional overlays */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(9,15,30,0.96) 30%, rgba(9,15,30,0.55) 65%, rgba(9,15,30,0.1) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(9,15,30,0.9) 0%, transparent 55%)' }} />

        {/* Content card */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1200, margin: '0 auto', padding: '0 48px', width: '100%' }}>
          <div style={{ maxWidth: 580 }}>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(40px, 5.5vw, 72px)', lineHeight: 0.93, color: '#fff', marginBottom: 16, letterSpacing: 2 }}>
              Banking Built<br />
              <span style={{ color: BLUE }}>For Tomorrow.</span>
            </h1>

            <p style={{ fontSize: 15, color: 'rgba(232,237,245,0.6)', lineHeight: 1.65, maxWidth: 400, marginBottom: 28 }}>
              Manage, grow, and protect your money with banking technology designed for ambitious people and growing businesses.
            </p>

            <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <ShimmerButton background="rgba(29,106,255,1)" borderRadius="10px" shimmerDelay="0s" className="px-8 py-3.5 text-[15px] gap-2 font-semibold">
                Open Free Account <ArrowRight size={16} />
              </ShimmerButton>
              <Button variant="secondary" size="lg" className="rounded-[10px] text-[15px]">
                See how it works
              </Button>
            </div>

            <p style={{ marginTop: 18, fontSize: 12, color: DIM }}>
              No credit card required · FDIC insured · Free forever plan available
            </p>
          </div>
        </div>
      </section>

      {/* ── Trust bar (Capital One FDIC banner style) ── */}
      <div style={{ backgroundColor: 'rgba(29,106,255,0.07)', borderBottom: '1px solid rgba(29,106,255,0.14)', padding: '13px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 48 }}>
          {TRUST_ITEMS.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={13} color={BLUE} />
              <span style={{ fontSize: 12, color: MUTED, letterSpacing: '0.04em' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab navigation + Product cards ── */}
      <section style={{ backgroundColor: 'rgba(255,255,255,0.012)', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>

          {/* Eyebrow */}
          <div style={{ paddingTop: 36, paddingBottom: 0, textAlign: 'center' }}>
            <span style={{ fontSize: 10, color: BLUE, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Choose your account</span>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(26px, 3vw, 38px)', color: '#fff', marginTop: 6, marginBottom: 0, letterSpacing: 1, lineHeight: 1 }}>
              Find the right fit for you.
            </h2>
          </div>

          {/* Tab strip */}
          <div style={{ display: 'flex', justifyContent: 'center', borderBottom: `1px solid ${BORDER}`, marginTop: 24, gap: 0 }}>
            {TABS.map(({ id, label, Icon }) => {
              const active = activeTab === id
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT_BODY,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    padding: '14px 36px 12px',
                    color: active ? TEXT : MUTED,
                    borderBottom: active ? `2px solid ${BLUE}` : '2px solid transparent',
                    marginBottom: -1,
                    fontSize: 12, fontWeight: active ? 600 : 400,
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 9,
                    backgroundColor: active ? 'rgba(29,106,255,0.14)' : 'rgba(255,255,255,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.2s',
                  }}>
                    <Icon size={14} color={active ? BLUE : 'rgba(232,237,245,0.3)'} />
                  </div>
                  {label}
                </button>
              )
            })}
          </div>

          {/* Product cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, padding: '24px 0 32px' }}>
            {(PRODUCTS[activeTab] ?? []).map((p, i) => (
              <BauhausProductCard key={`${activeTab}-${i}`} p={p} delay={`${i * 0.5}s`} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: 'rgba(255,255,255,0.018)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ padding: '28px 16px', borderRight: i < 3 ? `1px solid ${BORDER}` : 'none', textAlign: 'center' }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 36, color: BLUE, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: DIM, letterSpacing: '0.03em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <span style={{ fontSize: 10, color: BLUE, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Everything you need</span>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(28px, 3.5vw, 44px)', color: '#fff', marginTop: 8, letterSpacing: 1, lineHeight: 0.95 }}>
            Modern Banking,<br />Simplified.
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              style={{
                position: 'relative',
                borderRadius: 16,
                padding: 28,
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
                overflow: 'hidden',
              }}
            >
              {/* Top highlight streak */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.18), transparent)' }} />
              {/* Subtle inner glow */}
              <div style={{ position: 'absolute', top: -40, left: -40, width: 140, height: 140, borderRadius: '50%', background: `radial-gradient(circle, rgba(29,106,255,0.1) 0%, transparent 70%)`, pointerEvents: 'none' }} />

              <div style={{ position: 'relative', width: 40, height: 40, borderRadius: 11, background: 'rgba(29,106,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(29,106,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <f.Icon size={17} color={BLUE} />
              </div>
              <h3 style={{ position: 'relative', fontSize: 15, fontWeight: 600, color: TEXT, marginBottom: 6 }}>{f.title}</h3>
              <p style={{ position: 'relative', fontSize: 13, color: 'rgba(232,237,245,0.5)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing CTA ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 60px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(29,106,255,0.14) 0%, rgba(29,106,255,0.04) 100%)',
          border: '1px solid rgba(29,106,255,0.2)',
          borderRadius: 20, padding: '44px 52px',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center',
        }}>
          <div>
            <span style={{ fontSize: 10, color: '#5B96FF', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Pro Plan · $9/month</span>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(32px, 3.5vw, 48px)', color: '#fff', lineHeight: 0.93, marginTop: 8, marginBottom: 12, letterSpacing: 1 }}>
              Everything.<br />No Limits.
            </h2>
            <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, marginBottom: 24, maxWidth: 320 }}>
              One plan. Every feature. Cancel anytime. No hidden fees, ever.
            </p>
            <ShimmerButton background="rgba(29,106,255,1)" borderRadius="12px" shimmerDelay="1.2s" className="px-9 py-3.5 text-[15px] gap-2.5 font-semibold">
              Start Free Trial <ArrowRight size={16} />
            </ShimmerButton>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PLAN_FEATURES.map((feat, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle size={13} color={BLUE} />
                <span style={{ fontSize: 13, color: 'rgba(232,237,245,0.72)' }}>{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ borderTop: `1px solid ${BORDER}`, backgroundColor: 'rgba(255,255,255,0.018)', padding: '56px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{ fontSize: 10, color: BLUE, letterSpacing: '0.2em', textTransform: 'uppercase' }}>What people are saying</span>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(26px, 3vw, 40px)', color: '#fff', marginTop: 6, letterSpacing: 1, lineHeight: 1 }}>
              Trusted by Millions.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
                <div style={{ display: 'flex', gap: 3, marginBottom: 12 }}>
                  {Array.from({ length: t.stars }).map((_, j) => <Star key={j} size={11} fill={BLUE} color={BLUE} />)}
                </div>
                <p style={{ fontSize: 13, color: 'rgba(232,237,245,0.7)', lineHeight: 1.6, fontStyle: 'italic', marginBottom: 16 }}>"{t.quote}"</p>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: TEXT, marginBottom: 2 }}>{t.name}</p>
                  <p style={{ fontSize: 11, color: DIM }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: '24px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={11} color="#fff" />
            </div>
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 16, letterSpacing: 2, color: 'rgba(232,237,245,0.3)' }}>NexaBank</span>
          </div>
          <p style={{ fontSize: 12, color: DIM }}>© 2026 NexaBank · Demo by Designs by TA · FDIC Insured · Member SIPC</p>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacy', 'Terms', 'Security', 'Support'].map(link => (
              <a key={link} href="#" style={{ fontSize: 12, color: DIM, textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = MUTED)}
                onMouseLeave={e => (e.currentTarget.style.color = DIM)}
              >{link}</a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  )
}
