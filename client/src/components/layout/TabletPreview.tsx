/**
 * TabletPreview — luxury vacation rental mini-site.
 * Palette: deep ocean bg · turquoise accent · amber secondary · lush green highlights
 */

// ── Color tokens ─────────────────────────────────────────────────────
const C = {
  bg:        '#071C1F',          // deep ocean near-black
  bgSurface: 'rgba(0,196,167,0.04)',
  bgCard:    'rgba(0,196,167,0.06)',
  border:    'rgba(0,196,167,0.12)',
  borderSub: 'rgba(255,255,255,0.05)',
  teal:      '#00C4A7',          // turquoise — calming, adventurous
  tealDim:   'rgba(0,196,167,0.18)',
  amber:     '#F5A623',          // warm amber — energy & warmth
  amberDim:  'rgba(245,166,35,0.15)',
  green:     '#3DD68C',          // lush green — natural escape
  text:      '#EEF8F7',          // cool-tinted white
  muted:     'rgba(238,248,247,0.45)',
  mutedSub:  'rgba(238,248,247,0.25)',
}

export default function TabletPreview() {
  return (
    <div style={{ width: '100%', fontFamily: 'Satoshi, sans-serif', background: C.bg, color: C.text }}>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', width: '100%', height: '22vw', overflow: 'hidden' }}>
        <img
          src="/imgs/beach-hero.jpg"
          alt="Luxury over-water villa"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center center', display: 'block' }}
        />
        {/* Tropical overlay — teal tint at top, deep ocean fade at bottom */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(7,28,31,0.25) 0%, rgba(7,28,31,0.45) 55%, rgba(7,28,31,0.88) 100%)',
        }} />

        {/* Nav */}
        <nav style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.6% 4%',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4vw' }}>
            <div style={{ width: '0.45vw', height: '0.45vw', borderRadius: '50%', background: C.teal }} />
            <span style={{ fontSize: '0.68vw', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fff' }}>
              Villa Lumière
            </span>
          </div>
          <div style={{ display: 'flex', gap: '1.8vw', fontSize: '0.55vw', color: 'rgba(255,255,255,0.65)', letterSpacing: '0.05em' }}>
            {['Rentals', 'Destinations', 'Experiences', 'Contact'].map(l => <span key={l}>{l}</span>)}
          </div>
          <button style={{
            background: 'rgba(0,196,167,0.2)',
            backdropFilter: 'blur(8px)',
            border: `1px solid rgba(0,196,167,0.45)`,
            color: C.teal,
            padding: '0.32vw 1vw', borderRadius: '100px',
            fontSize: '0.55vw', fontWeight: 600, letterSpacing: '0.06em', cursor: 'pointer',
          }}>Book Now</button>
        </nav>

        {/* Hero copy */}
        <div style={{ position: 'absolute', bottom: '8%', left: '4%' }}>
          <div style={{
            fontSize: '0.55vw', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: C.teal, marginBottom: '1.5%',
          }}>Welcome to</div>
          <h1 style={{
            fontSize: '4vw', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1,
            color: '#fff', marginBottom: '2%',
            textShadow: '0 2px 24px rgba(0,0,0,0.5)',
          }}>VILLA LUMIÈRE</h1>
          <p style={{ fontSize: '0.72vw', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', letterSpacing: '0.04em' }}>
            Your dream, our pleasure.
          </p>
        </div>

        {/* Play button */}
        <div style={{
          position: 'absolute', bottom: '35%', right: '4%',
          width: '2.8vw', height: '2.8vw', borderRadius: '50%',
          border: `1.5px solid ${C.teal}`,
          background: 'rgba(0,196,167,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <div style={{
            width: 0, height: 0,
            borderLeft: `0.55vw solid ${C.teal}`,
            borderTop: '0.35vw solid transparent',
            borderBottom: '0.35vw solid transparent',
            marginLeft: '0.15vw',
          }} />
        </div>
      </section>

      {/* ── STAT STRIP — amber warm band ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', background: C.amber }}>
        {[
          { stat: '120+', label: 'Luxury Villas' },
          { stat: '18', label: 'Destinations' },
          { stat: '4.97★', label: 'Avg. Guest Rating' },
        ].map((s, i) => (
          <div key={s.stat} style={{
            padding: '2% 5%', textAlign: 'center',
            borderRight: i < 2 ? '1px solid rgba(0,0,0,0.1)' : 'none',
          }}>
            <div style={{ fontSize: '0.95vw', fontWeight: 800, color: '#071C1F', letterSpacing: '-0.02em' }}>{s.stat}</div>
            <div style={{ fontSize: '0.52vw', color: 'rgba(7,28,31,0.6)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── FEATURED PROPERTIES ── */}
      <section style={{ padding: '4% 4%', background: C.bg }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '3%' }}>
          <div>
            <div style={{ fontSize: '0.52vw', letterSpacing: '0.14em', color: C.teal, textTransform: 'uppercase', marginBottom: '1.5%' }}>
              Featured
            </div>
            <h2 style={{ fontSize: '1.5vw', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Curated escapes.
            </h2>
          </div>
          <span style={{ fontSize: '0.58vw', color: C.teal, letterSpacing: '0.04em', cursor: 'pointer' }}>View all →</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '2.5%' }}>
          {[
            { name: 'Casa del Sol', loc: 'Santorini, GR', price: '$1,240/night', img: '/imgs/villa-palms.jpg' },
            { name: 'Villa Blanche', loc: 'Amalfi Coast, IT', price: '$980/night',  img: '/imgs/villa-room.jpg' },
            { name: 'Palms Estate', loc: 'Maldives',         price: '$1,680/night', img: '/imgs/villa-pool.jpg' },
          ].map(p => (
            <div key={p.name} style={{
              borderRadius: '0.8vw', overflow: 'hidden',
              border: `1px solid ${C.border}`,
              background: C.bgCard,
            }}>
              <div style={{ height: '6.5vw', overflow: 'hidden' }}>
                <img src={p.img} alt={p.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ padding: '4% 5%' }}>
                <div style={{ fontSize: '0.68vw', fontWeight: 700, marginBottom: '1%' }}>{p.name}</div>
                <div style={{ fontSize: '0.55vw', color: C.muted, marginBottom: '3%' }}>{p.loc}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.6vw', color: C.amber, fontWeight: 600 }}>{p.price}</span>
                  <span style={{ fontSize: '0.5vw', color: C.green }}>★ 5.0</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── EXPERIENCE SECTION ── */}
      <section style={{
        padding: '4% 4%',
        background: `linear-gradient(135deg, rgba(0,196,167,0.06) 0%, transparent 60%)`,
        borderTop: `1px solid ${C.border}`,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6%', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '0.52vw', letterSpacing: '0.14em', color: C.teal, textTransform: 'uppercase', marginBottom: '2%' }}>
            The Lumière Promise
          </div>
          <h2 style={{ fontSize: '1.4vw', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '3%' }}>
            Effortless luxury,<br />every detail handled.
          </h2>
          <p style={{ fontSize: '0.65vw', color: C.muted, lineHeight: 1.75, marginBottom: '4%' }}>
            From private chef services to airport transfers — we curate every moment of your stay so you can simply enjoy it.
          </p>
          <button style={{
            background: 'transparent',
            border: `1px solid rgba(0,196,167,0.5)`,
            color: C.teal,
            padding: '0.55vw 1.4vw', borderRadius: '100px',
            fontSize: '0.58vw', fontWeight: 600, letterSpacing: '0.06em', cursor: 'pointer',
          }}>Our Services</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3%' }}>
          {[
            { icon: '🍽', label: 'Private Chef',   sub: 'On-call culinary team',    dot: C.amber },
            { icon: '🚁', label: 'Air Transfers',   sub: 'Helicopter & private jet', dot: C.teal  },
            { icon: '🛎', label: 'Concierge 24/7',  sub: 'Dedicated to your stay',  dot: C.green },
          ].map(a => (
            <div key={a.label} style={{
              display: 'flex', alignItems: 'center', gap: '3%',
              padding: '3% 4%',
              background: C.bgSurface,
              border: `1px solid ${C.border}`,
              borderRadius: '0.6vw',
            }}>
              <div style={{
                width: '0.3vw', height: '0.3vw', borderRadius: '50%',
                background: a.dot, flexShrink: 0,
              }} />
              <span style={{ fontSize: '1.1vw' }}>{a.icon}</span>
              <div>
                <div style={{ fontSize: '0.65vw', fontWeight: 700, marginBottom: '0.5%' }}>{a.label}</div>
                <div style={{ fontSize: '0.52vw', color: C.muted }}>{a.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIAL ── */}
      <section style={{
        padding: '4% 4%',
        borderTop: `1px solid ${C.borderSub}`,
        background: C.bg,
      }}>
        <div style={{ fontSize: '0.52vw', letterSpacing: '0.14em', color: C.teal, textTransform: 'uppercase', marginBottom: '2.5%' }}>
          Guest Stories
        </div>
        <blockquote style={{
          fontSize: '0.9vw', fontStyle: 'italic', fontWeight: 400,
          lineHeight: 1.7, color: 'rgba(238,248,247,0.78)',
          maxWidth: '78%', marginBottom: '3%',
        }}>
          "Villa Lumière didn't just give us a vacation — they gave us the best week of our lives. Every detail was beyond anything we imagined."
        </blockquote>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2%' }}>
          <div style={{
            width: '1.8vw', height: '1.8vw', borderRadius: '50%',
            background: `linear-gradient(135deg, ${C.teal}, #007A6E)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.78vw', fontWeight: 700, color: '#071C1F',
          }}>S</div>
          <div>
            <div style={{ fontSize: '0.6vw', fontWeight: 600 }}>Sophie & Marc Beaumont</div>
            <div style={{ fontSize: '0.52vw', color: C.mutedSub }}>Casa del Sol, Santorini</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.2vw' }}>
            {[...Array(5)].map((_, i) => <span key={i} style={{ fontSize: '0.65vw', color: C.amber }}>★</span>)}
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section style={{
        padding: '4% 4%',
        background: `linear-gradient(135deg, rgba(0,196,167,0.08), rgba(245,166,35,0.04))`,
        borderTop: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4%',
      }}>
        <div>
          <h2 style={{ fontSize: '1.3vw', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1.5%' }}>
            Begin your escape.
          </h2>
          <p style={{ fontSize: '0.62vw', color: C.muted, lineHeight: 1.6 }}>
            Availability is limited. Reserve your villa today.
          </p>
        </div>
        <button style={{
          background: C.amber, color: '#071C1F',
          border: 'none', padding: '0.7vw 1.8vw',
          borderRadius: '100px', fontSize: '0.65vw',
          fontWeight: 700, letterSpacing: '0.05em',
          cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
        }}>Reserve a Villa</button>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: '2.5% 4%',
        borderTop: `1px solid ${C.borderSub}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.3)',
      }}>
        <span style={{ fontSize: '0.58vw', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.teal }}>
          Villa Lumière
        </span>
        <span style={{ fontSize: '0.5vw', color: C.mutedSub, fontStyle: 'italic' }}>
          Your dream, our pleasure.
        </span>
        <span style={{ fontSize: '0.48vw', color: C.mutedSub }}>© 2026 Villa Lumière</span>
      </footer>

    </div>
  )
}
