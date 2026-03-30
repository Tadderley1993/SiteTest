import { Helmet } from 'react-helmet-async'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

// ── Color & style tokens ────────────────────────────────────────────────────
const TERTIARY = '#007aff'
const TERTIARY_DARK = '#005bc2'
const SURFACE = '#f9f9f9'
const SURFACE_LOW = '#f2f4f4'
const SURFACE_LOWEST = '#ffffff'
const SURFACE_CONTAINER = '#ebeeef'
const SURFACE_HIGH = '#e4e9ea'
const SURFACE_HIGHEST = '#dde4e5'
const ON_SURFACE = '#2d3435'
const ON_SURFACE_VARIANT = '#5a6061'
const OUTLINE_VARIANT = 'rgba(173,179,180,0.3)'

// ── Data ────────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: 'rocket_launch', title: 'Instant Transfers', desc: 'Send money across the globe or to the next room in seconds, with zero lag and total transparency.' },
  { icon: 'query_stats', title: 'Smart Budgeting', desc: 'Automated categorization and predictive insights that help you save without thinking about it.' },
  { icon: 'notifications_active', title: 'Real-time Notifications', desc: 'Know where every cent goes the moment it moves. Total control, right in your pocket.' },
  { icon: 'no_accounts', title: 'No Hidden Fees', desc: 'Transparent pricing with no maintenance fees, no minimum balance, and no surprises.' },
  { icon: 'shield_lock', title: 'Advanced Security', desc: 'Biometric logins, virtual disposable cards, and military-grade encryption for your peace of mind.' },
  { icon: 'support_agent', title: '24/7 Human Support', desc: 'Real people ready to help you anytime, anywhere. No complex phone menus, just help.' },
]

const TESTIMONIALS = [
  {
    quote: 'The cleanest banking app I\'ve ever used. Transfers are actually instant, and the budgeting tools are lightyears ahead of my old bank.',
    name: 'Marcus Thorne',
    role: 'Founder, Digital Flow',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQeicGofXLyGx68QPpgL-ussTni2332q6Uf7uwy5LQsRY2Gi-QvxgAiM-WrtwEl0D2b9NKkJVwnl1QXNda1T-5Einl1YA2TpKL2flJV0bdFyme6YQ6ZZqa0tKOoz_TPmXPHn_oH5tJ9OgIDFn-mqcHQFAZKbXpzEyxEk19loNzklvg278Tnwhj0A5W_bpQEhUzUYjsqZMEIs9EeQNbwDtSUSs9DJYvNqZWtqXkb6K1dCGRLrdP4ZYiidKgXI56uNnZJyAs590AF1Jq',
  },
  {
    quote: 'Finally, a bank that understands the needs of a modern freelancer. No fees, great exchange rates, and a beautiful UI.',
    name: 'Sarah Jenkins',
    role: 'Creative Director',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmq0OTGea1ZJJ1rTzuPy6yfF31N_4rDczWd3vDeC50FsW2DqhWAW9a7M6yuXhrwK0BfgbuNSLiwNGUg0YYyJLP5gL3_c5Vy6KM2pp63S0ujp_arQJvJXJu4K5dqJmlNbOe46kueyjDuJOuIm-WtC6sBGEQYddbU08k5i7Lotz5ILWnl_XQtc7WQFBLvGXERnsvAzrx0qGz70l4R17kJBKG8muskh_Au8DacG0r1FOR5UNy90he0zJzZTdWkeMRVHlzzUWV9AMHdCZo',
  },
  {
    quote: 'The virtual card feature is a lifesaver for online security. NexaBank is the only bank I recommend to my family now.',
    name: 'David Chen',
    role: 'Software Engineer',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXnqJWJIS-2d804uCEn3-ujIklw1K4XFYCDyoxBoWaRK3FdhifDCH9wagvxfid5XRu1dyf-0Fa1D9XzpKCgtjlzEZ2QC8zF8FI-6Ek0EzxfNy6li1zqGoge0V9bt0i-E9zlOZ0DadT2tc3qAGgJxS2fvhWlLTtw1SaAsDdJ2C828ucqF2VW5YXpd3J9zw-P_dba-AG3FKKA8UXiPFIQgK2wX6F5gkr6h4LTxB2uYE6WzPzHpqT2HIlNhcUKCgDWqXLd8UTEzd70Z8V',
  },
]

const STACK_AVATARS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA7JvLmO1IOeZRskxyjgguPztlDWDXeXfAQ-aUCp7qfij7nop4fc-19-CKPFaJOmOyAqhdokxkJJTuVJfdCztwVUQvj2W2hvITp9r0wUQIcBsAuyegbVl0lb_Qub9hJFLTY7_lJm8r9-rYkLZZ1IyX21mb6M0jkfz_OzrWBG5VfQDKR8iz8srd26GulgAWkW0GplgD8Yewu3pPMD6m_9NLZSDjjrYJuoWKNoOd8n1TiyFptvcTYvYssnIDvB-x6gppvceSJRj1LSxrU',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAWIXpvzTNhHtLNIQuyid_tFBJVuNiGFlsk4ZNH1z7djdO4JpGfqXDDi6l1iTZ_yXwu8Xf8Vb45iuSYNXzj3smN8ABeAH-bZdmL5yDZ-QyKm3lLMp_N0W6zfnc_60lkb_IILA6FVg9ZmS-SS6s0aSMcBiAbMcp6UxaIL5dyHB5Vi7IJxANzKz14dcKdn4JHP9R__Kw6BbeIq7nc_-PNmBZAMfPQxph9xyfxzw8KlYvgIjKvOACnJ-jFjNqpg-LzIHtM3eH5cYWHrmJU',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCJV0SxzwQxfD8SCyLztg1_CZKcbAD9PUubF7XeZm33AnmSCr4NpHXeircXSA23wMvL3CoDVIOprs6Dqs5hCHtAtIFD2g_nyfslM-kLjnkgw5_DuG-Aek5qdKy-u94zMBnGC0LBDL0K0SWmL_6KeCbPv0YJZ6dCmWvMkkTIp2gJ2ZjTPJP4LTizco',
]

// ── Inline styles ──────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,300,0,0&display=swap');
  .nb-page { font-family: 'Inter', sans-serif; }
  .nb-headline { font-family: 'Manrope', sans-serif; }
  .nb-glass { backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
  .nb-gradient { background: linear-gradient(135deg, ${TERTIARY_DARK} 0%, ${TERTIARY} 100%); }
  .nb-material { font-family: 'Material Symbols Outlined'; font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24; vertical-align: middle; }
  .nb-material-fill { font-family: 'Material Symbols Outlined'; font-variation-settings: 'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 24; vertical-align: middle; }
`

// ── Material Icon component ─────────────────────────────────────────────────
function Icon({ name, fill = false, className = '' }: { name: string; fill?: boolean; className?: string }) {
  return (
    <span className={`${fill ? 'nb-material-fill' : 'nb-material'} ${className}`} aria-hidden="true">
      {name}
    </span>
  )
}

// ── Nav ─────────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  return (
    <nav
      className="nb-glass fixed top-0 w-full z-50"
      style={{
        background: scrolled ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.6)',
        boxShadow: scrolled ? '0 2px 24px rgba(45,52,53,0.08)' : 'none',
        borderBottom: '1px solid rgba(173,179,180,0.15)',
        transition: 'background 0.2s, box-shadow 0.2s',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex justify-between items-center h-20">
        <div className="nb-headline text-xl font-bold tracking-tighter" style={{ color: ON_SURFACE }}>
          NexaBank
        </div>
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'Products', 'Pricing', 'About'].map((item, i) => (
            <a
              key={item}
              href="#"
              className="nb-headline text-sm tracking-tight transition-colors duration-200"
              style={{
                color: i === 0 ? TERTIARY : ON_SURFACE_VARIANT,
                fontWeight: i === 0 ? 600 : 400,
                borderBottom: i === 0 ? `2px solid ${TERTIARY}` : 'none',
                paddingBottom: i === 0 ? 2 : 0,
              }}
            >
              {item}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/concepts"
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium transition-colors duration-150"
            style={{ color: ON_SURFACE_VARIANT, fontFamily: 'Inter, sans-serif' }}
          >
            ← Back to Designs By Terrence Adderley
          </Link>
          <button
            className="nb-gradient text-white px-6 py-2.5 rounded-lg text-sm font-medium active:scale-95 transition-transform"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Open an Account
          </button>
        </div>
      </div>
    </nav>
  )
}

// ── Main page component ─────────────────────────────────────────────────────
export default function NexaBank() {
  return (
    <>
      <Helmet>
        <title>NexaBank Concept | Designs By TA</title>
        <meta name="description" content="NexaBank — a fintech banking app concept designed and developed by Designs By TA, showcasing modern UI/UX." />
        <meta name="robots" content="index, follow" />
      </Helmet>
      <style>{styles}</style>
      <div className="nb-page antialiased min-h-screen" style={{ background: SURFACE, color: ON_SURFACE }}>
        <Nav />
        <main style={{ paddingTop: 80 }}>

          {/* ── HERO ──────────────────────────────────────────────────── */}
          <section className="relative px-6 lg:px-8 pt-14 pb-20 overflow-hidden">
            {/* bg blob */}
            <div
              className="absolute -top-24 right-0 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none"
              style={{ background: `${TERTIARY}0e` }}
            />
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
              <div>
                <h1
                  className="nb-headline font-extrabold leading-[1.08] tracking-tighter mb-5"
                  style={{ fontSize: 'clamp(36px, 5.5vw, 58px)', color: ON_SURFACE }}
                >
                  Banking Built for the{' '}
                  <span style={{ color: TERTIARY }}>Modern World</span>
                </h1>
                <p
                  className="text-base max-w-lg mb-8 leading-relaxed"
                  style={{ color: ON_SURFACE_VARIANT }}
                >
                  Experience high-speed digital banking designed for your lifestyle. Seamlessly manage wealth, track spending, and grow your future in one place.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    className="nb-gradient text-white px-6 py-3 rounded-lg font-semibold text-sm hover:shadow-lg active:scale-95 transition-all"
                    style={{ fontFamily: 'Manrope, sans-serif' }}
                  >
                    Open an Account
                  </button>
                  <button
                    className="px-6 py-3 rounded-lg font-semibold text-sm transition-all active:scale-95"
                    style={{
                      background: SURFACE_HIGHEST,
                      color: ON_SURFACE,
                      fontFamily: 'Manrope, sans-serif',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = SURFACE_HIGH)}
                    onMouseLeave={e => (e.currentTarget.style.background = SURFACE_HIGHEST)}
                  >
                    Learn More
                  </button>
                </div>
              </div>

              {/* Hero phone mockup */}
              <div className="relative flex justify-center lg:justify-end">
                <div
                  className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl pointer-events-none"
                  style={{ background: `${TERTIARY}1a` }}
                />
                <PhoneMockup />
              </div>
            </div>
          </section>

          {/* ── TRUST BAR ─────────────────────────────────────────────── */}
          <section className="py-12" style={{ background: SURFACE_LOW }}>
            <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <p
                  className="text-sm font-bold tracking-widest mb-3"
                  style={{ color: ON_SURFACE_VARIANT }}
                >
                  TRUSTED BY OVER 100K USERS
                </p>
                <div className="flex items-center gap-6" style={{ opacity: 0.6, color: ON_SURFACE }}>
                  <div className="flex items-center nb-headline font-bold text-lg gap-2">
                    <Icon name="verified_user" className="text-xl" /> SECURE
                  </div>
                  <div className="flex items-center nb-headline font-bold text-lg gap-2">
                    <Icon name="account_balance" className="text-xl" /> FDIC INSURED
                  </div>
                  <div className="flex items-center nb-headline font-bold text-lg gap-2">
                    <Icon name="encrypted" className="text-xl" /> 256-BIT AES
                  </div>
                </div>
              </div>
              <div className="flex gap-12" style={{ filter: 'grayscale(1)', opacity: 0.4 }}>
                {['FINTECHWEEK', 'CAPITALONE', 'GLOBALPAY'].map(b => (
                  <span key={b} className="nb-headline text-2xl font-black tracking-tighter" style={{ color: ON_SURFACE }}>
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* ── FEATURES ──────────────────────────────────────────────── */}
          <section className="py-16 md:py-24 px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="mb-12">
                <h2
                  className="nb-headline text-3xl font-bold mb-3"
                  style={{ color: ON_SURFACE }}
                >
                  Precision Tools for Money
                </h2>
                <p className="max-w-xl text-sm leading-relaxed" style={{ color: ON_SURFACE_VARIANT }}>
                  We've stripped away the complexity of traditional banking to give you a toolset that works as fast as you do.
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {FEATURES.map(({ icon, title, desc }) => (
                  <FeatureCard key={title} icon={icon} title={title} desc={desc} />
                ))}
              </div>
            </div>
          </section>

          {/* ── PRODUCT SHOWCASE ──────────────────────────────────────── */}
          <section className="py-16 md:py-24 overflow-hidden" style={{ background: SURFACE_LOW }}>
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2
                  className="nb-headline font-bold mb-3 tracking-tight"
                  style={{ fontSize: 'clamp(24px, 4vw, 40px)', color: ON_SURFACE }}
                >
                  The Command Center for Wealth
                </h2>
                <p className="text-sm max-w-xl mx-auto leading-relaxed" style={{ color: ON_SURFACE_VARIANT }}>
                  Analyze your net worth, manage investments, and handle payroll from a single, powerful desktop interface.
                </p>
              </div>
              {/* Browser mockup */}
              <div
                className="relative max-w-5xl mx-auto rounded-2xl shadow-2xl overflow-hidden p-2"
                style={{
                  background: SURFACE_LOWEST,
                  border: `1px solid ${OUTLINE_VARIANT}`,
                }}
              >
                {/* Browser chrome */}
                <div
                  className="px-4 py-3 flex items-center gap-2 border-b"
                  style={{ background: SURFACE, borderColor: SURFACE_CONTAINER }}
                >
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: '#fe8983' }} />
                    <div className="w-3 h-3 rounded-full" style={{ background: SURFACE_HIGHEST }} />
                    <div className="w-3 h-3 rounded-full" style={{ background: SURFACE_HIGH }} />
                  </div>
                  <div
                    className="mx-auto rounded-md px-4 py-1 text-[10px] w-64 text-center"
                    style={{ background: SURFACE_LOW, color: ON_SURFACE_VARIANT }}
                  >
                    app.nexabank.com/dashboard
                  </div>
                </div>
                <DashboardMockup />
              </div>
            </div>
          </section>

          {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
          <section className="py-16 md:py-24 px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2
                  className="nb-headline text-3xl font-bold mb-3"
                  style={{ color: ON_SURFACE }}
                >
                  Start in Minutes
                </h2>
                <p className="text-sm" style={{ color: ON_SURFACE_VARIANT }}>
                  The future of banking is just a few clicks away.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { n: 1, title: 'Sign Up', desc: 'Download the app and create your account in under 2 minutes with basic info.', active: true },
                  { n: 2, title: 'Verify Identity', desc: 'Securely upload a photo of your ID. Our AI verifies you in real-time.', active: false },
                  { n: 3, title: 'Start Banking', desc: 'Instantly access your virtual card and start managing your world.', active: false },
                ].map(({ n, title, desc, active }) => (
                  <div key={n} className="text-center">
                    <div
                      className="nb-headline w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 text-xl font-bold"
                      style={
                        active
                          ? { background: TERTIARY, color: '#fff', boxShadow: `0 4px 20px ${TERTIARY}33` }
                          : { background: SURFACE_HIGHEST, color: TERTIARY, border: `1px solid ${TERTIARY}1a` }
                      }
                    >
                      {n}
                    </div>
                    <h3
                      className="nb-headline text-lg font-bold mb-2"
                      style={{ color: ON_SURFACE }}
                    >
                      {title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: ON_SURFACE_VARIANT }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── TESTIMONIALS ──────────────────────────────────────────── */}
          <section className="py-16 md:py-24 px-6 lg:px-8" style={{ background: SURFACE }}>
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                <div>
                  <h2
                    className="nb-headline text-3xl font-bold mb-2"
                    style={{ color: ON_SURFACE }}
                  >
                    Loved by Pioneers
                  </h2>
                  <p className="text-sm" style={{ color: ON_SURFACE_VARIANT }}>
                    See why thousands of digital nomads and entrepreneurs trust NexaBank.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {STACK_AVATARS.map((src, i) => (
                      <img
          loading="lazy"
                        key={i}
                        src={src}
                        alt=""
                        className="w-8 h-8 rounded-full border-2 border-white object-cover"
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium" style={{ color: ON_SURFACE }}>
                    4.9/5 from 10k+ reviews
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {TESTIMONIALS.map(({ quote, name, role, avatar }) => (
                  <div
                    key={name}
                    className="p-6 rounded-xl flex flex-col justify-between"
                    style={{
                      background: SURFACE_LOWEST,
                      border: `1px solid ${OUTLINE_VARIANT}`,
                    }}
                  >
                    <div>
                      <div className="flex gap-0.5 mb-4" style={{ color: TERTIARY }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Icon key={i} name="star" fill className="text-sm" />
                        ))}
                      </div>
                      <p
                        className="text-sm font-medium leading-relaxed mb-6"
                        style={{ color: ON_SURFACE }}
                      >
                        "{quote}"
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden" style={{ background: SURFACE_HIGH }}>
                        <img
          loading="lazy" src={avatar} alt={name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-sm" style={{ color: ON_SURFACE }}>{name}</p>
                        <p className="text-xs" style={{ color: ON_SURFACE_VARIANT }}>{role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── FINAL CTA ─────────────────────────────────────────────── */}
          <section className="py-16 md:py-24 px-6 lg:px-8 text-center" style={{ background: SURFACE_LOWEST }}>
            <div className="max-w-2xl mx-auto">
              <h2
                className="nb-headline font-bold mb-4 tracking-tight"
                style={{ fontSize: 'clamp(26px, 4vw, 42px)', color: ON_SURFACE }}
              >
                Ready to Upgrade?
              </h2>
              <p className="text-sm mb-8 leading-relaxed" style={{ color: ON_SURFACE_VARIANT }}>
                Join over 100,000 users who are already banking in the future. Opening an account takes less than 2 minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  className="nb-gradient text-white px-8 py-3 rounded-lg font-semibold text-sm hover:shadow-lg transition-all nb-headline"
                >
                  Get Started Now
                </button>
                <button
                  className="px-8 py-3 rounded-lg font-semibold text-sm transition-all nb-headline"
                  style={{ background: SURFACE_LOW, color: ON_SURFACE }}
                  onMouseEnter={e => (e.currentTarget.style.background = SURFACE_HIGH)}
                  onMouseLeave={e => (e.currentTarget.style.background = SURFACE_LOW)}
                >
                  Compare Plans
                </button>
              </div>
            </div>
          </section>
        </main>

        {/* ── FOOTER ────────────────────────────────────────────────── */}
        <footer style={{ background: '#f9fafa', borderTop: '1px solid rgba(173,179,180,0.2)' }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-14 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
            <div className="col-span-2 lg:col-span-1">
              <div className="nb-headline text-lg font-bold mb-6" style={{ color: ON_SURFACE }}>
                NexaBank
              </div>
              <p className="text-xs leading-relaxed mb-6" style={{ color: ON_SURFACE_VARIANT }}>
                The future of personal and business finance, built for speed and security.
              </p>
              <div className="flex gap-4">
                {['public', 'share', 'alternate_email'].map(icon => (
                  <Icon
                    key={icon}
                    name={icon}
                    className="text-xl cursor-pointer transition-colors"
                    // inline hover handled via CSS
                  />
                ))}
              </div>
            </div>
            {[
              { heading: 'Products', links: ['Personal Banking', 'Business Accounts', 'Investment'] },
              { heading: 'Resources', links: ['API Docs', 'Help Center', 'Security'] },
              { heading: 'Company', links: ['Careers', 'Investor Relations', 'Privacy Policy'] },
            ].map(({ heading, links }) => (
              <div key={heading}>
                <h4
                  className="font-bold text-xs uppercase tracking-widest mb-6"
                  style={{ color: ON_SURFACE }}
                >
                  {heading}
                </h4>
                <ul className="space-y-4">
                  {links.map(l => (
                    <li key={l}>
                      <a
                        href="#"
                        className="text-xs leading-relaxed transition-colors duration-200"
                        style={{ color: ON_SURFACE_VARIANT }}
                        onMouseEnter={e => (e.currentTarget.style.color = TERTIARY)}
                        onMouseLeave={e => (e.currentTarget.style.color = ON_SURFACE_VARIANT)}
                      >
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div
            className="max-w-7xl mx-auto px-6 lg:px-12 py-8 border-t"
            style={{ borderColor: 'rgba(173,179,180,0.15)' }}
          >
            <p className="text-xs" style={{ color: ON_SURFACE_VARIANT }}>
              © 2025 NexaBank. All rights reserved. Member FDIC. Equal Housing Lender.
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}

// ── Phone Mockup ─────────────────────────────────────────────────────────────
const TRANSACTIONS = [
  { icon: 'shopping_bag', label: 'Nike Store',         amount: '-$142.00', sub: 'Shopping',  color: '#f43f5e' },
  { icon: 'restaurant',   label: 'Nobu Restaurant',    amount: '-$86.50',  sub: 'Dining',    color: '#f97316' },
  { icon: 'arrow_downward', label: 'Salary Deposit',   amount: '+$4,200',  sub: 'Income',    color: '#22c55e' },
  { icon: 'bolt',         label: 'Electric Bill',      amount: '-$58.20',  sub: 'Utilities', color: '#a855f7' },
]
const BAR_DATA = [38, 52, 44, 70, 60, 82, 55]
const BAR_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function PhoneMockup() {
  return (
    <div
      className="relative shadow-2xl"
      style={{
        width: 280,
        borderRadius: 40,
        background: '#0d1520',
        border: '8px solid #1a2433',
        overflow: 'hidden',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Status bar */}
      <div className="flex justify-between items-center px-5 pt-3 pb-1" style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
        <span>9:41</span>
        <div style={{ width: 80, height: 12, background: '#1a2433', borderRadius: 8 }} />
        <div className="flex gap-1 items-center">
          <span style={{ fontSize: 10 }}>●●●</span>
        </div>
      </div>

      {/* App content */}
      <div className="px-5 pb-6">
        {/* Header */}
        <div className="flex justify-between items-center mt-2 mb-5">
          <div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>Good morning,</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'Manrope, sans-serif' }}>Alex Rivera</p>
          </div>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #005bc2, #007aff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 14, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>notifications</span>
          </div>
        </div>

        {/* Balance card */}
        <div style={{ background: 'linear-gradient(135deg, #005bc2 0%, #007aff 100%)', borderRadius: 20, padding: '18px 20px', marginBottom: 20 }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Total Balance</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#fff', fontFamily: 'Manrope, sans-serif', letterSpacing: '-0.03em', lineHeight: 1 }}>$24,831.50</p>
          <div className="flex justify-between items-end mt-4">
            <div>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>CARD NUMBER</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.1em' }}>•••• •••• •••• 4291</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>EXPIRES</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)' }}>08/28</p>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex justify-between mb-5">
          {[
            { icon: 'send', label: 'Send' },
            { icon: 'add', label: 'Add' },
            { icon: 'payments', label: 'Pay' },
            { icon: 'credit_card', label: 'Card' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#60a5fa', fontSize: 18, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>{icon}</span>
              </div>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Spending chart */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '14px 16px', marginBottom: 16 }}>
          <div className="flex justify-between items-center mb-3">
            <p style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Weekly Spending</p>
            <p style={{ fontSize: 11, color: '#60a5fa' }}>$1,840</p>
          </div>
          <div className="flex items-end justify-between gap-1" style={{ height: 48 }}>
            {BAR_DATA.map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-1" style={{ flex: 1 }}>
                <div
                  style={{
                    width: '100%',
                    height: `${(h / 82) * 44}px`,
                    borderRadius: 4,
                    background: i === 5 ? 'linear-gradient(180deg, #007aff, #005bc2)' : 'rgba(255,255,255,0.1)',
                    transition: 'height 0.3s',
                  }}
                />
                <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>{BAR_LABELS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Transactions */}
        <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 10 }}>Recent</p>
        <div className="flex flex-col gap-2.5">
          {TRANSACTIONS.map(({ icon, label, amount, sub, color }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div style={{ width: 32, height: 32, borderRadius: 10, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color, fontSize: 14, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>{icon}</span>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>{label}</p>
                  <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>{sub}</p>
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: amount.startsWith('+') ? '#22c55e' : '#fff' }}>{amount}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Home indicator */}
      <div className="flex justify-center pb-3 pt-1">
        <div style={{ width: 100, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
      </div>
    </div>
  )
}

// ── Dashboard Mockup ──────────────────────────────────────────────────────────
const MONTH_DATA = [
  { month: 'Jan', income: 4200, spend: 2800 },
  { month: 'Feb', income: 4200, spend: 3100 },
  { month: 'Mar', income: 5100, spend: 2600 },
  { month: 'Apr', income: 4800, spend: 3400 },
  { month: 'May', income: 4200, spend: 2900 },
  { month: 'Jun', income: 6200, spend: 3200 },
]
const DASH_TXN = [
  { name: 'Apple Inc.',         category: 'Technology', date: 'Jun 24', amount: '+$1,280.00', status: 'Completed', positive: true },
  { name: 'AWS Services',       category: 'Cloud',      date: 'Jun 23', amount: '-$340.00',  status: 'Completed', positive: false },
  { name: 'Stripe Payout',      category: 'Income',     date: 'Jun 22', amount: '+$5,640.00', status: 'Completed', positive: true },
  { name: 'Adobe Creative',     category: 'Software',   date: 'Jun 21', amount: '-$54.99',   status: 'Pending',   positive: false },
  { name: 'Client Wire — Acme', category: 'Income',     date: 'Jun 20', amount: '+$8,000.00', status: 'Completed', positive: true },
]

function DashboardMockup() {
  const maxVal = 6200
  return (
    <div
      style={{
        background: SURFACE,
        fontFamily: 'Inter, sans-serif',
        color: ON_SURFACE,
        display: 'flex',
        minHeight: 420,
      }}
    >
      {/* Sidebar */}
      <div style={{ width: 180, background: SURFACE_LOW, borderRight: `1px solid ${OUTLINE_VARIANT}`, padding: '20px 0', flexShrink: 0 }}>
        <div style={{ padding: '0 16px 16px', borderBottom: `1px solid ${OUTLINE_VARIANT}` }}>
          <p style={{ fontSize: 13, fontWeight: 800, fontFamily: 'Manrope, sans-serif', color: ON_SURFACE, letterSpacing: '-0.02em' }}>NexaBank</p>
          <p style={{ fontSize: 9, color: ON_SURFACE_VARIANT, marginTop: 2 }}>Pro Dashboard</p>
        </div>
        <div style={{ padding: '12px 8px' }}>
          {[
            { icon: 'dashboard', label: 'Overview', active: true },
            { icon: 'account_balance_wallet', label: 'Accounts', active: false },
            { icon: 'swap_horiz', label: 'Transfers', active: false },
            { icon: 'bar_chart', label: 'Analytics', active: false },
            { icon: 'receipt_long', label: 'Statements', active: false },
            { icon: 'settings', label: 'Settings', active: false },
          ].map(({ icon, label, active }) => (
            <div
              key={label}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 8, marginBottom: 2,
                background: active ? `${TERTIARY}15` : 'transparent',
                color: active ? TERTIARY : ON_SURFACE_VARIANT,
                fontSize: 11, fontWeight: active ? 600 : 400,
                cursor: 'default',
              }}
            >
              <span style={{ fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20", fontSize: 16 }}>{icon}</span>
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '20px 24px', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Manrope, sans-serif', color: ON_SURFACE }}>Financial Overview</p>
            <p style={{ fontSize: 10, color: ON_SURFACE_VARIANT }}>June 2025 · Q2 Report</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ background: 'linear-gradient(135deg, #005bc2, #007aff)', color: '#fff', fontSize: 10, fontWeight: 600, padding: '6px 14px', borderRadius: 6, cursor: 'default' }}>
              Export
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Net Balance', value: '$24,831', delta: '+8.2%', up: true, icon: 'account_balance' },
            { label: 'Monthly Income', value: '$6,200',  delta: '+29%',  up: true, icon: 'trending_up' },
            { label: 'Total Spent',   value: '$3,200',   delta: '-5.8%', up: false, icon: 'payments' },
          ].map(({ label, value, delta, up, icon }) => (
            <div key={label} style={{ background: SURFACE_LOWEST, border: `1px solid ${OUTLINE_VARIANT}`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <p style={{ fontSize: 10, color: ON_SURFACE_VARIANT }}>{label}</p>
                <span style={{ fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20", fontSize: 14, color: TERTIARY }}>{icon}</span>
              </div>
              <p style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Manrope, sans-serif', color: ON_SURFACE, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: 10, marginTop: 4, color: up ? '#22c55e' : '#f43f5e', fontWeight: 600 }}>{delta} vs last month</p>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div style={{ background: SURFACE_LOWEST, border: `1px solid ${OUTLINE_VARIANT}`, borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: ON_SURFACE, fontFamily: 'Manrope, sans-serif' }}>Income vs Spending</p>
            <div style={{ display: 'flex', gap: 16, fontSize: 10, color: ON_SURFACE_VARIANT }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: TERTIARY, display: 'inline-block' }} /> Income
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: SURFACE_HIGHEST, display: 'inline-block' }} /> Spending
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 80 }}>
            {MONTH_DATA.map(({ month, income, spend }) => (
              <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 68 }}>
                  <div style={{ width: 12, height: `${(income / maxVal) * 68}px`, borderRadius: '3px 3px 0 0', background: `linear-gradient(180deg, ${TERTIARY}, ${TERTIARY_DARK})` }} />
                  <div style={{ width: 12, height: `${(spend / maxVal) * 68}px`, borderRadius: '3px 3px 0 0', background: SURFACE_HIGHEST }} />
                </div>
                <span style={{ fontSize: 9, color: ON_SURFACE_VARIANT }}>{month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Transactions table */}
        <div style={{ background: SURFACE_LOWEST, border: `1px solid ${OUTLINE_VARIANT}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${OUTLINE_VARIANT}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: ON_SURFACE, fontFamily: 'Manrope, sans-serif' }}>Recent Transactions</p>
            <span style={{ fontSize: 10, color: TERTIARY, fontWeight: 600, cursor: 'default' }}>View all</span>
          </div>
          {DASH_TXN.map(({ name, category, date, amount, status, positive }) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', padding: '9px 16px', borderBottom: `1px solid ${OUTLINE_VARIANT}`, gap: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: positive ? '#22c55e22' : `${TERTIARY}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20", fontSize: 13, color: positive ? '#22c55e' : TERTIARY }}>
                  {positive ? 'arrow_downward' : 'arrow_upward'}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: ON_SURFACE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</p>
                <p style={{ fontSize: 9, color: ON_SURFACE_VARIANT }}>{category} · {date}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: positive ? '#22c55e' : ON_SURFACE }}>{amount}</p>
                <p style={{ fontSize: 9, color: status === 'Pending' ? '#f97316' : '#22c55e' }}>{status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className="p-6 rounded-xl transition-all cursor-default"
      style={{
        background: SURFACE_LOWEST,
        border: `1px solid ${hovered ? `${TERTIARY}33` : OUTLINE_VARIANT}`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-5 transition-all"
        style={{
          background: hovered ? TERTIARY : SURFACE_LOW,
          color: hovered ? '#fff' : TERTIARY,
        }}
      >
        <Icon name={icon} className="text-xl" />
      </div>
      <h3
        className="nb-headline text-base font-bold mb-2"
        style={{ color: ON_SURFACE }}
      >
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: ON_SURFACE_VARIANT }}>
        {desc}
      </p>
    </div>
  )
}
