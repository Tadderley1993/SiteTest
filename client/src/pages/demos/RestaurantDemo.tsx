import { Helmet } from 'react-helmet-async'
import { useState, useEffect } from 'react'
import { Star, ArrowRight, Clock, MapPin, Phone, Plus } from 'lucide-react'

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

// ── Data ──────────────────────────────────────────────────────────────────────

const NAV_LINKS = ['Menu', 'Our Story', 'Locations', 'Catering']

const CATEGORIES = ['All', 'Steaks', 'Burgers', 'Sides', 'Desserts']

const DISHES = [
  { category: 'Steaks', name: 'Dry-Aged Ribeye', weight: '300g', desc: 'Hand-selected, dry-aged 30 days, chimichurri & roasted garlic butter', price: 68, badge: 'Best Seller', hue: '#8B3A2A' },
  { category: 'Steaks', name: 'A5 Wagyu Striploin', weight: '200g', desc: 'Japanese A5 wagyu, truffle compound butter, fleur de sel', price: 115, badge: 'Premium', hue: '#6B2A1A' },
  { category: 'Burgers', name: 'Prime Smash Burger', weight: 'Double', desc: 'Double smash patty, aged cheddar, house pickles, secret sauce', price: 28, badge: 'Fan Fav', hue: '#9B4A1A' },
  { category: 'Steaks', name: 'Tomahawk Chop', weight: '1kg', desc: '21-day aged, wood-fired, bone-in, herb crust & red wine jus', price: 145, badge: 'Share', hue: '#7B2A1A' },
  { category: 'Sides', name: 'Truffle Parmesan Fries', weight: '250g', desc: 'Hand-cut fries, black truffle oil, aged parmesan, chives', price: 18, badge: null, hue: '#A0732A' },
  { category: 'Burgers', name: '12hr Brisket Burger', weight: 'Single', desc: 'Slow-smoked brisket, pickled jalapeño, coleslaw, brioche bun', price: 32, badge: 'New', hue: '#A85A2A' },
  { category: 'Desserts', name: 'Salted Caramel Tart', weight: '—', desc: 'Brûléed custard, caramel glaze, fleur de sel, shortcrust pastry', price: 16, badge: null, hue: '#C09050' },
  { category: 'Sides', name: 'Bone Marrow Butter', weight: '—', desc: 'Roasted bone marrow, herb butter, toasted sourdough', price: 22, badge: 'Chef Pick', hue: '#7A3A1A' },
]

const STATS = [
  { value: '15+', label: 'Years Serving' },
  { value: '12K+', label: 'Happy Guests' },
  { value: '4.9', label: 'Google Rating' },
  { value: '3', label: 'Locations' },
]

const REVIEWS = [
  { name: 'James T.', role: 'Regular Guest', text: 'The dry-aged ribeye was cooked to absolute perfection. Crust, juiciness, everything. A dining experience I keep coming back to.', rating: 5 },
  { name: 'Sarah M.', role: 'Food Blogger', text: 'Best smash burger in the city, no contest. The atmosphere is vibrant and the staff genuinely care about your experience.', rating: 5 },
  { name: 'David K.', role: 'First Visit', text: 'The A5 wagyu was genuinely life-changing. Worth every single penny. Already booked my next visit.', rating: 5 },
]

// ── Color tokens ──────────────────────────────────────────────────────────────

const BG      = '#FAF6F0'       // warm cream
const SURFACE = '#F2EBE1'       // slightly darker cream for cards
const DARK    = '#1A120A'       // near-black (warm)
const MID     = '#7A6655'       // warm mid-tone
const LIGHT   = 'rgba(26,18,10,0.4)'
const RED     = '#C9351A'       // main accent — warm red (beef)
const RED_BG  = '#FEF0EB'       // light red tint for badges
const WHITE   = '#FFFFFF'

const input: React.CSSProperties = {
  width: '100%',
  background: WHITE,
  border: '1.5px solid rgba(26,18,10,0.12)',
  borderRadius: 10,
  padding: '14px 16px',
  color: DARK,
  fontSize: 14,
  fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box',
  outline: 'none',
}

// ── Dish card food-photo placeholders ─────────────────────────────────────────
// Uses layered radial gradients to give the impression of food photography

function FoodArt({ hue, idx }: { hue: string; idx: number }) {
  const patterns = [
    `radial-gradient(ellipse 70% 60% at 45% 55%, ${hue} 0%, ${hue}99 50%, ${hue}33 100%)`,
    `radial-gradient(circle at 60% 40%, ${hue}EE 0%, ${hue}88 40%, ${hue}22 100%)`,
    `radial-gradient(ellipse 80% 70% at 50% 60%, ${hue}DD 0%, ${hue}66 60%, transparent 100%)`,
    `radial-gradient(circle at 40% 50%, ${hue}FF 0%, ${hue}99 35%, ${hue}33 80%, transparent 100%)`,
  ]
  return (
    <div style={{
      width: '100%',
      aspectRatio: '4/3',
      borderRadius: 12,
      background: `${patterns[idx % patterns.length]}, linear-gradient(145deg, #D4A574 0%, #A0622A 100%)`,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Steam / gloss effect */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', background: 'linear-gradient(to top, rgba(26,18,10,0.3), transparent)' }} />
    </div>
  )
}

// ── Stamp Wallpaper ───────────────────────────────────────────────────────────

const SC = 'rgb(201,53,26)'

function StampWallpaper() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
      aria-hidden="true"
    >
      <defs>
        <pattern id="stamp-wp" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
          {/* ── Stamp centered at 100,100 ── */}

          {/* Serrated outer edge */}
          <circle cx="100" cy="100" r="76" fill="none" stroke={SC} strokeWidth="1.5" strokeDasharray="4 3" />
          {/* Outer ring */}
          <circle cx="100" cy="100" r="70" fill="none" stroke={SC} strokeWidth="0.9" />
          {/* Inner ring */}
          <circle cx="100" cy="100" r="62" fill="none" stroke={SC} strokeWidth="0.9" />

          {/* Cardinal dots between rings */}
          <circle cx="100" cy="32"  r="2.5" fill={SC} />
          <circle cx="100" cy="168" r="2.5" fill={SC} />
          <circle cx="32"  cy="100" r="2.5" fill={SC} />
          <circle cx="168" cy="100" r="2.5" fill={SC} />

          {/* Text arc paths (r=66, between the two rings) */}
          <path id="stamp-top" d="M 34 100 A 66 66 0 0 1 166 100" fill="none" />
          <path id="stamp-bot" d="M 34 100 A 66 66 0 0 0 166 100" fill="none" />

          <text fontSize="8.5" fill={SC} fontFamily="Georgia, 'Times New Roman', serif" fontWeight="700" letterSpacing="4.5">
            <textPath href="#stamp-top" startOffset="50%" textAnchor="middle">PRIME &amp; CO.</textPath>
          </text>
          <text fontSize="7" fill={SC} fontFamily="Georgia, 'Times New Roman', serif" letterSpacing="3">
            <textPath href="#stamp-bot" startOffset="50%" textAnchor="middle">EST. 2024  ·  FINE DINING  ·</textPath>
          </text>

          {/* ── Bull / Longhorn head centered at 100,93 ── */}

          {/* Horns */}
          <path d="M 89 84 Q 70 70 73 55" fill="none" stroke={SC} strokeWidth="2.4" strokeLinecap="round"/>
          <path d="M 111 84 Q 130 70 127 55" fill="none" stroke={SC} strokeWidth="2.4" strokeLinecap="round"/>

          {/* Head */}
          <ellipse cx="100" cy="93" rx="18" ry="16" fill="none" stroke={SC} strokeWidth="1.8" />

          {/* Ears */}
          <ellipse cx="82" cy="86" rx="5" ry="3.2" fill="none" stroke={SC} strokeWidth="1.2" transform="rotate(-28,82,86)" />
          <ellipse cx="118" cy="86" rx="5" ry="3.2" fill="none" stroke={SC} strokeWidth="1.2" transform="rotate(28,118,86)" />

          {/* Eyes */}
          <circle cx="92"  cy="90" r="2.4" fill={SC} />
          <circle cx="108" cy="90" r="2.4" fill={SC} />

          {/* Nose */}
          <ellipse cx="100" cy="102" rx="9" ry="5.5" fill="none" stroke={SC} strokeWidth="1.5" />
          {/* Nostrils */}
          <circle cx="95.5" cy="102" r="1.8" fill={SC} />
          <circle cx="104.5" cy="102" r="1.8" fill={SC} />

          {/* ── 5 stars ── */}
          <text textAnchor="middle" fontSize="9"  fill={SC} fontFamily="Arial" x="76"  y="122">★</text>
          <text textAnchor="middle" fontSize="9"  fill={SC} fontFamily="Arial" x="88"  y="127">★</text>
          <text textAnchor="middle" fontSize="10" fill={SC} fontFamily="Arial" x="100" y="130">★</text>
          <text textAnchor="middle" fontSize="9"  fill={SC} fontFamily="Arial" x="112" y="127">★</text>
          <text textAnchor="middle" fontSize="9"  fill={SC} fontFamily="Arial" x="124" y="122">★</text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#stamp-wp)" opacity="0.1" />
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RestaurantDemo() {
  const mobile = useIsMobile()
  const [activeCategory, setActiveCategory] = useState('All')
  const [guests, setGuests] = useState('2')
  const [hoverNav, setHoverNav] = useState<string | null>(null)

  const filtered = activeCategory === 'All' ? DISHES : DISHES.filter(d => d.category === activeCategory)

  return (
    <div style={{ backgroundColor: BG, minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", color: DARK }}>
      <Helmet>
        <title>Chez Laurent | Demo by Designs By TA</title>
        <meta name="description" content="A fine dining restaurant demo showcasing elegant web design by Designs By TA." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* ── Announcement bar ── */}
      <div style={{ backgroundColor: RED, padding: '10px 24px', textAlign: 'center' }}>
        <span style={{ fontSize: 12, color: WHITE, letterSpacing: '0.12em', fontWeight: 600 }}>
          FRIDAY SPECIAL — FREE BONE MARROW WITH EVERY STEAK ORDER &nbsp;·&nbsp; BOOK NOW
        </span>
      </div>

      {/* ── Nav ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50, backgroundColor: BG,
        borderBottom: '1px solid rgba(26,18,10,0.08)',
        padding: mobile ? '0 16px' : '0 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: RED, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: WHITE, fontWeight: 900, fontSize: 14, letterSpacing: 1 }}>PR</span>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: DARK, letterSpacing: '0.04em', lineHeight: 1 }}>PRIME & CO.</div>
            <div style={{ fontSize: 10, color: MID, letterSpacing: '0.18em', textTransform: 'uppercase', lineHeight: 1.2 }}>Craft Steakhouse</div>
          </div>
        </div>

        {/* Links */}
        <div style={{ display: mobile ? 'none' : 'flex', gap: 32 }}>
          {NAV_LINKS.map(link => (
            <a
              key={link} href="#"
              style={{ fontSize: 13, fontWeight: 500, color: hoverNav === link ? DARK : MID, textDecoration: 'none', letterSpacing: '0.02em', transition: 'color 0.2s', paddingBottom: 4, borderBottom: hoverNav === link ? `2px solid ${RED}` : '2px solid transparent' }}
              onMouseEnter={() => setHoverNav(link)}
              onMouseLeave={() => setHoverNav(null)}
            >{link}</a>
          ))}
        </div>

        {/* CTA */}
        <button style={{ backgroundColor: RED, color: WHITE, border: 'none', borderRadius: 50, padding: '12px 28px', fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em' }}>
          Book a Table
        </button>
      </nav>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', overflow: 'hidden', maxWidth: 1280, margin: '0 auto', padding: mobile ? '32px 16px 40px' : '48px 48px 56px', display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: mobile ? 32 : 48, alignItems: 'center' }}>
        <StampWallpaper />
        {/* Left: text */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: 'clamp(40px, 4.5vw, 64px)', fontWeight: 900, color: DARK, lineHeight: 1.0, marginBottom: 18, letterSpacing: '-0.02em' }}>
            Beef Done<br />
            <span style={{ color: RED }}>The Right</span><br />
            Way.
          </h1>

          <p style={{ fontSize: 15, color: MID, lineHeight: 1.65, maxWidth: 400, marginBottom: 28 }}>
            Premium dry-aged cuts, smash burgers, and slow-smoked BBQ. Sourced from local farms, cooked over live fire. No shortcuts.
          </p>

          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <button style={{ backgroundColor: RED, color: WHITE, border: 'none', borderRadius: 50, padding: '12px 28px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
              View Our Menu <ArrowRight size={14} />
            </button>
            <button style={{ backgroundColor: 'transparent', color: DARK, border: `2px solid rgba(26,18,10,0.15)`, borderRadius: 50, padding: '10px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Our Story
            </button>
          </div>

          {/* Star rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(26,18,10,0.08)' }}>
            <div style={{ display: 'flex', gap: 3 }}>
              {[...Array(5)].map((_, i) => <Star key={i} size={16} fill={RED} color={RED} />)}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: DARK }}>4.9</span>
            <span style={{ fontSize: 14, color: MID }}>from 2,400+ reviews on Google</span>
          </div>
        </div>

        {/* Right: hero visual */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Main food image */}
          <div style={{
            borderRadius: 20,
            overflow: 'hidden',
            aspectRatio: '4/5',
            position: 'relative',
          }}>
            <img
              src="/imgs/restaurant-hero-main.png"
              alt="Prime & Co. signature dish"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {/* Gradient fade bottom */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '25%', background: 'linear-gradient(to top, rgba(26,8,2,0.5), transparent)' }} />
          </div>

          {/* Floating badge — live fire */}
          <div style={{
            position: 'absolute', top: 24, left: -24,
            backgroundColor: WHITE, borderRadius: 14, padding: '14px 18px', boxShadow: '0 8px 32px rgba(26,18,10,0.12)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 22 }}>🔥</span>
            <div>
              <div style={{ fontSize: 11, color: MID, fontWeight: 500 }}>Cooked over</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: DARK }}>Live Fire</div>
            </div>
          </div>

          {/* Floating badge — sourcing */}
          <div style={{
            position: 'absolute', bottom: 32, right: -20,
            backgroundColor: WHITE, borderRadius: 14, padding: '14px 18px', boxShadow: '0 8px 32px rgba(26,18,10,0.12)',
            display: 'flex', alignItems: 'center', gap: 10, minWidth: 160,
          }}>
            <span style={{ fontSize: 22 }}>🐄</span>
            <div>
              <div style={{ fontSize: 11, color: MID, fontWeight: 500 }}>100% Local</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: DARK }}>Farm Sourced</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <div style={{ backgroundColor: DARK, padding: '24px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 0 }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', borderRight: (!mobile && i < 3) ? '1px solid rgba(255,255,255,0.08)' : 'none', padding: '6px 16px' }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: WHITE, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 6, letterSpacing: '0.04em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Menu section ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: mobile ? '40px 16px' : '60px 48px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: RED, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>What We Do Best</div>
            <h2 style={{ fontSize: 40, fontWeight: 900, color: DARK, letterSpacing: '-0.02em', lineHeight: 1, margin: 0 }}>Our Menu</h2>
          </div>
          <a href="#" style={{ fontSize: 14, fontWeight: 600, color: RED, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            Full menu <ArrowRight size={16} />
          </a>
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                border: 'none', borderRadius: 50, padding: '10px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                backgroundColor: activeCategory === cat ? RED : WHITE,
                color: activeCategory === cat ? WHITE : MID,
                boxShadow: '0 2px 8px rgba(26,18,10,0.08)',
                transition: 'all 0.2s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Dish grid */}
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: mobile ? 12 : 20 }}>
          {filtered.map((dish, i) => (
            <div
              key={dish.name}
              style={{ backgroundColor: WHITE, borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 16px rgba(26,18,10,0.07)', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(26,18,10,0.14)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 16px rgba(26,18,10,0.07)' }}
            >
              {/* Image area */}
              <div style={{ position: 'relative' }}>
                <FoodArt hue={dish.hue} idx={i} />
                {dish.badge && (
                  <div style={{ position: 'absolute', top: 12, left: 12, backgroundColor: WHITE, borderRadius: 50, padding: '4px 12px', fontSize: 10, fontWeight: 700, color: RED, letterSpacing: '0.06em' }}>
                    {dish.badge}
                  </div>
                )}
                {/* Add button */}
                <button style={{ position: 'absolute', bottom: 12, right: 12, width: 34, height: 34, borderRadius: '50%', backgroundColor: RED, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(201,53,26,0.4)' }}>
                  <Plus size={16} color={WHITE} />
                </button>
              </div>

              {/* Info */}
              <div style={{ padding: '16px 18px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: DARK, marginBottom: 3 }}>{dish.name}</div>
                    <div style={{ fontSize: 11, color: MID, fontWeight: 500, marginBottom: 8 }}>{dish.weight} · {dish.category}</div>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: LIGHT, lineHeight: 1.55, marginBottom: 14 }}>{dish.desc}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: DARK }}>${dish.price}</span>
                  <span style={{ fontSize: 11, color: MID }}>+ tax</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── About / Story split ── */}
      <section style={{ backgroundColor: DARK, padding: mobile ? '40px 16px' : '60px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: mobile ? 32 : 56, alignItems: 'center' }}>
          {/* Left: Visual */}
          <div style={{ position: 'relative' }}>
            <div style={{ borderRadius: 20, overflow: 'hidden', aspectRatio: '1/1', position: 'relative' }}>
              <img
                src="/imgs/restaurant-hero.png"
                alt="Live fire cooking at Prime & Co."
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block', filter: 'brightness(0.85)' }}
              />
              {/* Ember glow overlay */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(to top, rgba(201,80,26,0.35), transparent)' }} />
            </div>

            {/* Tag */}
            <div style={{
              position: 'absolute', bottom: -20, right: -20,
              backgroundColor: RED, borderRadius: 16, padding: '20px 24px',
              boxShadow: '0 8px 32px rgba(201,53,26,0.4)',
            }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: WHITE, lineHeight: 1 }}>30</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>Day Dry Age</div>
            </div>
          </div>

          {/* Right: Text */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: RED, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Our Story</div>
            <h2 style={{ fontSize: 40, fontWeight: 900, color: WHITE, letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: 18 }}>
              Obsessed With<br />Getting It Right.
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, marginBottom: 18 }}>
              Prime & Co. started as a weekend pop-up with a single charcoal grill and a relentless focus on beef quality. Fifteen years later, we operate three locations — but the obsession hasn't changed.
            </p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, marginBottom: 28 }}>
              Every cut is hand-selected, every aging room monitored daily, every fire built by hand. We don't do shortcuts.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
              {[
                { icon: '🥩', title: 'Hand-Selected Cuts', desc: 'Grade A1 beef sourced from 6 local farms' },
                { icon: '🔥', title: 'Live Fire Cooking', desc: 'Hardwood charcoal, zero gas shortcuts' },
                { icon: '🌿', title: 'Seasonal Sides', desc: 'Local market produce, changing weekly' },
                { icon: '🏆', title: 'Award Winning', desc: 'Best Steakhouse 4 years running' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 24 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: WHITE, marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <button style={{ backgroundColor: RED, color: WHITE, border: 'none', borderRadius: 50, padding: '12px 28px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
              Read Our Story <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Reviews ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: mobile ? '40px 16px' : '60px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: RED, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>What People Say</div>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: DARK, letterSpacing: '-0.02em', lineHeight: 1 }}>
            Guests Love It.
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
          {REVIEWS.map((r, i) => (
            <div key={i} style={{ backgroundColor: WHITE, borderRadius: 16, padding: '24px', boxShadow: '0 2px 16px rgba(26,18,10,0.07)' }}>
              {/* Stars */}
              <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
                {[...Array(r.rating)].map((_, j) => <Star key={j} size={13} fill={RED} color={RED} />)}
              </div>
              <p style={{ fontSize: 13, color: DARK, lineHeight: 1.65, marginBottom: 16, fontStyle: 'italic' }}>
                "{r.text}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: RED_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: RED }}>{r.name[0]}</span>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: DARK }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: MID }}>{r.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Reservation ── */}
      <section style={{ maxWidth: 1280, margin: mobile ? '0 16px 40px' : '0 88px', borderRadius: 20, backgroundColor: DARK, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr' }}>
          {/* Left: Info */}
          <div style={{ padding: mobile ? '32px 20px' : '52px 48px', position: 'relative', overflow: 'hidden' }}>
            {/* Background image */}
            <img
              src="/imgs/restaurant-reservation.png"
              alt="Reserve your seat"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
            />
            {/* Dark overlay so text stays readable */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(20,8,2,0.82) 0%, rgba(26,18,10,0.72) 100%)' }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: RED, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16, position: 'relative' }}>Reserve Your Seat</div>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: WHITE, letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: 16, position: 'relative' }}>
              Book a Table<br />Tonight.
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 28, position: 'relative', maxWidth: 320 }}>
              We recommend booking 48hrs ahead, especially on weekends. Walk-ins welcome subject to availability.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, position: 'relative' }}>
              {[
                { Icon: Clock, text: 'Mon – Fri: 5pm – 11pm  ·  Sat – Sun: 12pm – 11pm' },
                { Icon: MapPin, text: '412 Magnolia Ave, Buckhead, Atlanta, GA' },
                { Icon: Phone, text: '+1 (404) 555-0192' },
              ].map(({ Icon, text }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(201,53,26,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} color={RED} />
                  </div>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, paddingTop: 8 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Form */}
          <div style={{ padding: mobile ? '28px 20px' : '52px 48px', backgroundColor: SURFACE }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: DARK, marginBottom: 24 }}>Make a Reservation</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: MID, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Date</label>
                <input type="date" style={input} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: MID, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Time</label>
                <select style={{ ...input, cursor: 'pointer' }}>
                  {['6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM'].map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: MID, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Guests</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                  <button
                    key={n}
                    onClick={() => setGuests(String(n))}
                    style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: `2px solid ${guests === String(n) ? RED : 'rgba(26,18,10,0.12)'}`, backgroundColor: guests === String(n) ? RED_BG : WHITE, color: guests === String(n) ? RED : MID, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: MID, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Full Name</label>
              <input type="text" placeholder="Your full name" style={input} />
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: MID, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Phone or Email</label>
              <input type="text" placeholder="How should we reach you?" style={input} />
            </div>

            <button style={{ width: '100%', backgroundColor: RED, color: WHITE, border: 'none', borderRadius: 50, padding: '14px', fontSize: 13, fontWeight: 800, cursor: 'pointer', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              Confirm My Table <ArrowRight size={15} />
            </button>

            <p style={{ textAlign: 'center', fontSize: 12, color: MID, marginTop: 16 }}>
              Free cancellation up to 24 hours before your booking.
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: mobile ? '16px' : '20px 48px', borderTop: '1px solid rgba(26,18,10,0.08)', marginTop: 40 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: mobile ? 'column' : 'row', gap: mobile ? 6 : 0, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: 15, color: DARK, letterSpacing: '0.06em' }}>PRIME & CO.</div>
          <p style={{ fontSize: 12, color: 'rgba(26,18,10,0.3)' }}>© 2026 Prime & Co. · Demo by Designs by TA</p>
          <div style={{ display: mobile ? 'none' : 'flex', gap: 20 }}>
            {['Menu', 'Locations', 'Privacy', 'Terms'].map(l => (
              <a key={l} href="#" style={{ fontSize: 12, color: 'rgba(26,18,10,0.35)', textDecoration: 'none' }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
