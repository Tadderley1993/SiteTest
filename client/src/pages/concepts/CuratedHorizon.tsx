import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

// ── Design Tokens ────────────────────────────────────────────────────────────
const P    = '#082717'   // primary deep green
const PC   = '#1f3d2b'   // primary-container
const OPC  = '#87a890'   // on-primary-container
const S    = '#705b32'   // secondary warm amber/brown
const SF   = '#fcdfab'   // secondary-fixed (warm cream)
const OS   = '#1a1c1c'   // on-surface (near black)
const OSV  = '#424843'   // on-surface-variant (muted)
const SURF = '#f9f9f9'   // surface
const SL   = '#f3f3f3'   // surface-container-low
const SH   = '#e8e8e8'   // surface-container-high
const OV   = '#c2c8c1'   // outline-variant
const STONE = '#f5f5f0'  // footer bg

// ── Image URLs ───────────────────────────────────────────────────────────────
const IMG_HERO       = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsiNnIk16BNIdxAYrbQXMAeKMq_WeXAtPe6DM082Mkksw79QMoYwH93EMAb09-3jXgjtRuLdeQiHd-Qs3MMG-xpIRioJwpKjqDTtmfDgQqN4S8U7tdivyvT1HD-Eunv0Zk9R3_XpmK1HQR1n4hxVRaMLH63jSWtEV5y11L58-BemdSt9FModqO-hd-hnY2R4tnuFBIFvhmrTkIcumvNmEpkrSL88RPWM6XacHKsWmSd0jxt40P1ZEqs77BrySfHFPpi8pBpOr6CwXR'
const IMG_HEDGE      = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPAqo3q38djiwehNgnpX1v6eAcBOO67zYkvDspXakubCP8a8KsUTwjB2_tIj41pSk_r4QR0Q0BAfIjeApmwlMfj0-pLlfIDwABhiPLr5m5Ke5UzneL-jAv634sWr8vOnh5g8RUZMK5Azjg-FglyFkVSdybxZskYCPNLg-GkbdIGyUpvREBHb0JEJwDIk0yGyLXYccignBDFBSgnWPrexeZ_13ZNzTkmtwxpCprS5lGHqqKLT6O075q_mkAmiZgAFfggDaMnHN62H6X'
const IMG_LAWN       = 'https://lh3.googleusercontent.com/aida-public/AB6AXuABjgkw6n5bvEJyyVO0-RE4dCfLusbsuhV2oVq8beBwTYSN0c4b8jyx2GFrsGD88a3spWtThzxsygdks183Y0CnxFBSuiHwRDTrYIeQV0iZkdio_3xgJh05FLNugLuE0rMbk-mRe8iDi3FybcNh5kmxdt7O1GTvqk3hDsYvQ7DJzlQPPIufcDS32V_TUrxgHn6PUMw0zJk05MLIUuAHje5UVrVEqvIv6NAAPxnw-8_wpoqNpNMGorDvg5Cjn_OvKMxBue_kUuzi48Jp'

const IMG_CTA_BG     = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAWMVQJoQtam78Dyon9rkz5osBsnYJbb9dApYb358oV6BFrdYacCqY3FtOq8eHAI_hP7v9qaowwsaYQ1jBsbbMK6ro62tQrD6xj3x6Wgx9qCfobgDSAEOfP6zuSVonzy_2HXcvTmTdjEP7YpJfyyUkBP3fNdaFDggjmQgWjmmBNBy6icYVSrQCtI08iBmdL8reP8zkiVZBf9zcXqBd9w9pXFtrqzexl4Vk0AhOfwU43Q6YbDeDRNsg1NOBh8deDhW9vQHBRGx7H9hkx'
const IMG_SVC_LAWN   = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDBw_yQIlbnNDSXDSJCFF4F_taMvw35oRuZiLXw8MEz5qC35Kz7ifZ-d8s-DC7f5V3y29S2vVdslofe747h0LbLiBi6b5RyAn6pUBFxWGm4TB1aFtop2wr1GEC0dhz9JDrdozkyAkWgJaFRGTYTfSpyhDQtaWIeYYsbiki7sBmB8DG7jF1vAfhxUgXGh7oPlvpiDvcm2qrNLwxDh4qWB9BlVVau3Cjn_OvKMxBue_kUuzi48Jp'
const IMG_SVC_LAND   = 'https://lh3.googleusercontent.com/aida-public/AB6AXuC4LdOIhc1MOUWh0KsK3tAc3okQXRiTejPg18MEwBgnICxT5sL6g4sHtE4Saw7SddUnrQ5bihIJpoVe-EO87S-L0-SW6G_aI2rKazydfjmYuw_nqInU9N2LDxuRGyagSOLI-BDBEYCGnGbHuL248r95rYKYPBrHt9_mTJGceH6Y5LUm7iGXc0HTjlOrdiF3cHzlLF6SBULWernqHudMuucfvxhrArz_dVNZ9BjYGM812Cec71SE-7B4okcm_aagJJ4YzpQ3LWCL_jk8'
const IMG_SVC_SPRING = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnie07GIrzTCGpy1kk8u3Z44hMS_yPzFERtf1BdwaIYGRRpSoQ2yEsx9Yssu279A9ybvbpjM-RAFf8YEt4B4jH_JdZS_HU9vWMLBbDR-dzSSrSwOVdZYbmK9SRmfa1aJqzW62wkdUsWlr-G6Y7KtyvLHH1CJpuifY7O9p1xk8Cz8DFNp3h6nI3ALVrsRdLREcUJorxUPhfvwfnrm5xC88e-yssTZUJCTSOkLOT6yZmZ3eW2EQ7YhIZ2vIXx0UvcIYyYpNWWbHhFo2U'
const IMG_SVC_IRRIG  = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPm0YDQCtT0SRtEosYsL32CCQJbZwRS6Z60D1WhBdv3m-_4DBGBt14ZNsedAoui6zb5aO1j-yit2JoDbqg3LTQF1ED0FgZSGXGxBMpJ4a7OYLSJw2NmzDCSLhWKuq-61uY_7ZlWuklz9prfFOoIXjiMZtN932arWH_37UqyQ42dKOzEPXskwRcEmRmbfJaZBoyrFcDxWS3g4WylH7Kj-IJRw-oF_sKv5DIPfULOJb9FSRFknoj5twOyXTlykK-ofG1K4HAliEtxXDt'
const IMG_GND1       = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBX_L3S2RWhsaB76vWpzEhfm0upX_TX6hNQNpMy90MejeWeZ8JqbDoQzK9FiMnLjfr6bxrOWmSlhCiWXrDfF4eP9se6FhM4SiN9kdzWeYO_TtG7NDPHO2H-a1O_Q1W2wV8WnkiuTqcQX8KA_KA_eyclYVQdPdXKsQlXFb9oSDkwkVj5PuCzI8tfVV3cQ04HQcMOsjhNqfxWmIfM3AajH8GdEacLQ9kPmAIwE8Gd7ekgqze-MeV0KbLC65N83yYxu8Ssx2R7lko-ZoTW'
const IMG_GND2       = 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_4inPUkVRQ1gxzsyaoh6m3dWluPYzjksAKmUY8eprOHHSVcb6j4ZSOEUuOIXptvAVKt9axoZHAb2-XNt-Bs1FbKBuL6EDNAo2T2QFCGum3gJO2v2I_m-f482Me9-lFH_civhNmRAD__JWjzrr5HBl5hrfvITa5JUkBjOfkyv8if_FRAPFTAd0k_GYfJReXH3XW23qwaZrRvuSzI8ylr-ob2WjnEYXPRUlZl97ggI8TaE2i-PBzR2vNmjbwEKX4NNHPbBqHFucxd1V'
const IMG_GND3       = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwDm7iZNnakomwF3FvyoUJuSjmUKyT8CuyZHgpSLvDxoLbDT4BGzkO2MET5Nuy-dKBdCQIHEx5vICe1hqO1ngillDs-REyJIKikFt43yw3G8Upph4WnN-Uk7yfSmg0zgOPW5DjIJS7i_88A9wO09gni2HBQdB8diO4whEwm7oSHAKF0v9C0ANroEEfMo0iLf7OrRyAkcAQmqwir3gmmhua9Y6xUZLyogBBZg1RVxpiT1Gqxo41ReeU0ZlfV2ChrK02MQC4nfNCJU_S'
const IMG_PORT1      = '/imgs/ch-windmere.jpg'
const IMG_PORT2A     = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCH5VAavgRUehqgqs2pyAPrfxNLz7Bnd-SDVgy23rXrWsH9Ujc3xwcG78tgH2f9kFtWdXYE0ItwTxgxl6n1ZhkJXrBEC1JPUF8tsS6sOU95yq16iAniKJLotqKVY3JqiY3_OUXIVuQ8axpjq22AsT21BqXc8EfXx_RUOMhkMnKgBpWqfSyf-HCHr6wcI_ckAwM4dMHdlBZbuB9YsbAlRRnAoSDHjPrV2MWcr5hJnHyNFysaOmqDtXvpD3QR9CTyPVuCcGKHqKd4cpgj'
const IMG_PORT2B     = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCaGsx9ryLXokv8rlW_hu28Ufir7YibIfkGMl_TN8iX4Ti-8H2zwNa_9n64vuwUFXdLUng9Vqn01vWrFFgAEQh9tUu0noEAs3aUaXHlOaGK9yhe8JL69UejkOhf3soKR9Bn7mJXBtNuwv3H_u1z-7MRoiyYU7cnaZsfYTW92fNwHVlC5mWXNYkFO3NgoudEF0-74RmRtdtXEd3Fmy4yFsiJKOX6TOFtTTn7kE6KdYCbnHA--lZ6adku-Vv1KVSTcUnUqKj9rg1k38KX'
const IMG_PORT4      = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvF3xfKFVvBUSs_uTzWgFQXNmlayILTKkmyMsHrtwlZad4jVH2WZ6FvlqMlrdqWhXsIftXZdRHEgW7snfKoP0KRq8oB6Zpwg36ZFbu6at8ld-vHxtM5JlorxWUv-VhBL3lFNf8HIJFV08Jx1tydfT9HLCoM_WwapNuiGpcZiJe1WcN3q6QJAljT'
const IMG_ABOUT_EST  = '/imgs/ch-heritage.jpg'
const IMG_ABOUT_TEAM = 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9_7Bht9dTwtXyX-YbOw77sjIbv_cnDxzQiWcp6fY7hKTSPSouxgXl5waSFJUIqgezMpNx1Ky6mxdo-Sr7mIyOZrPW5M6FOJk_yCl8hNhZPKqASxjZ0hL57SX_aT8bH-pbaXeXMcPbcLXvNeFwApk8K1mt-8jC2qr9mvbH2Xf5erD3aK7phv2NuL2jVT5r9QHDUJSUwW9ZSy9TOXCvOIyMZuA4OyjDMTqMrgOTA8PFg5GXdAND-6WVP8iNl_zHAqPQi8IGaGbB13kI'
const IMG_CONTACT    = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQu-wVsqFaZEEu-WP_owXkvLK1rfrmVF_pUkuhU-PsqW1nFjkZhwxQnfL0LlxgDW727q4Q_xoZHgbGiAM9C2Yg7ropMjQP_0yk_KjaxfGvH69W8d3VwgTrSm3uIG-O7QjzDiY2xwvUioAO_HZMEHAXjhxsqs86Id6_awexq9qZ277srG-w-NP_1Av0S4gjiGaTjbs58URW6d3qN-4AWZF4kiY6BRsnTNwgMqA40jqe57G9hDf5-oSaPeM3yFx1SfoqWyS3jQVQ52IB'
const IMG_TOPIARY    = 'https://lh3.googleusercontent.com/aida-public/AB6AXuB93nJPlArWEGokIGuFM_tEA5OXXzoqFUtPhyKhlfS5MW6VD_8S2wYa4YQHWUfXfuFYP8qPS8dPyoZKVPNLb0HD4yxWOSrznSpACxdOSt_NMUMi_16pS0rtexX2j4T1wZk5yHltlM3bswc_2LNo4wNPiHgOdDmJ1ytWGzAMyMjaaY88cTmuJrylCJp_P65QCaHXEHqdSvwfwrG16bpvH1jidnnj5gpO__Vw-NeQigBjmbGPkCvG-C39xlL3Itbj3XeuzHVGwZ7ND1VO'

// ── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,300;0,400;0,700;1,300;1,400&family=Manrope:wght@300;400;500;600;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,300,0,0&display=swap');
.ch-serif { font-family: 'Noto Serif', serif; }
.ch-body  { font-family: 'Manrope', sans-serif; }
.ch-icon  { font-family: 'Material Symbols Outlined'; font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24; vertical-align: middle; }
.ch-gs    { filter: grayscale(1); transition: filter 1s ease; }
.ch-gs:hover { filter: grayscale(0); }
`

// ── Types ────────────────────────────────────────────────────────────────────
type Page = 'home' | 'services' | 'portfolio' | 'about' | 'contact'

// ── Icon helper ──────────────────────────────────────────────────────────────
function Icon({ name }: { name: string }) {
  return <span className="ch-icon">{name}</span>
}

// ── Nav ──────────────────────────────────────────────────────────────────────
function Nav({ page, go }: { page: Page; go: (p: Page) => void }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks: { label: string; page: Page }[] = [
    { label: 'Services', page: 'services' },
    { label: 'About', page: 'about' },
    { label: 'Portfolio', page: 'portfolio' },
  ]

  const navBg = scrolled
    ? 'rgba(8,39,23,0.97)'
    : 'rgba(8,39,23,0.6)'

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: navBg,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: scrolled ? `1px solid rgba(194,200,193,0.15)` : '1px solid transparent',
        transition: 'background 0.3s ease, border-color 0.3s ease',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand */}
        <button
          type="button"
          onClick={() => go('home')}
          className="ch-serif"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ffffff', fontWeight: 300, fontSize: 18, letterSpacing: '0.12em', textTransform: 'uppercase', padding: 0 }}
        >
          The Curated Horizon
        </button>

        {/* Desktop links */}
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: 40 }}>
          {navLinks.map(l => (
            <button
              key={l.page}
              type="button"
              onClick={() => go(l.page)}
              className="ch-serif"
              style={{
                background: 'none',
                border: 'none',
                borderBottom: page === l.page ? `1px solid ${P}` : '1px solid transparent',
                cursor: 'pointer',
                color: page === l.page ? '#ffffff' : 'rgba(255,255,255,0.75)',
                fontWeight: 300,
                fontSize: 14,
                letterSpacing: '0.06em',
                paddingBottom: 2,
                transition: 'color 0.2s',
              }}
            >
              {l.label}
            </button>
          ))}
          <Link
            to="/concepts"
            style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, letterSpacing: '0.05em', textDecoration: 'none' }}
          >
            ← Back to Designs By Terrence Adderley
          </Link>
          <button
            type="button"
            onClick={() => go('contact')}
            style={{
              background: '#ffffff',
              color: P,
              border: 'none',
              borderRadius: 0,
              cursor: 'pointer',
              padding: '10px 24px',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Request Consultation
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="flex md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 4 }}
        >
          <Icon name={mobileOpen ? 'close' : 'menu'} />
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div style={{ background: 'rgba(8,39,23,0.98)', backdropFilter: 'blur(12px)', borderTop: `1px solid ${OV}30`, padding: '16px 32px 24px' }} className="md:hidden">
          {navLinks.map(l => (
            <button
              key={l.page}
              type="button"
              onClick={() => { go(l.page); setMobileOpen(false) }}
              className="ch-serif"
              style={{ display: 'block', width: '100%', background: 'none', border: 'none', borderBottom: `1px solid ${OV}20`, cursor: 'pointer', color: '#fff', fontWeight: 300, fontSize: 16, letterSpacing: '0.06em', padding: '14px 0', textAlign: 'left' }}
            >
              {l.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => { go('contact'); setMobileOpen(false) }}
            style={{ marginTop: 16, width: '100%', background: '#fff', color: P, border: 'none', cursor: 'pointer', padding: '12px 24px', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            Request Consultation
          </button>
          <div style={{ marginTop: 16 }}>
            <Link to="/concepts" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, letterSpacing: '0.05em', textDecoration: 'none' }}>
              ← Back to Designs By Terrence Adderley
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

// ── Footer ───────────────────────────────────────────────────────────────────
function Footer({ go }: { go: (p: Page) => void }) {
  const linkStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: OSV,
    fontSize: 13,
    padding: 0,
    lineHeight: 2,
    textAlign: 'left',
    display: 'block',
    letterSpacing: '0.02em',
  }

  return (
    <footer style={{ background: STONE, borderTop: `1px solid ${OV}`, color: OS }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 48px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 48, marginBottom: 48 }}>
          {/* Brand col */}
          <div>
            <p className="ch-serif" style={{ fontStyle: 'italic', fontWeight: 300, fontSize: 20, color: P, marginBottom: 12, letterSpacing: '0.06em' }}>
              The Curated Horizon
            </p>
            <p style={{ fontSize: 13, color: OSV, lineHeight: 1.6, maxWidth: 220 }}>
              Elite lawn care and estate maintenance for distinguished properties across the region.
            </p>
          </div>

          {/* Company */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: OSV, marginBottom: 16 }}>Company</p>
            <button type="button" style={linkStyle} onClick={() => go('about')}>About Us</button>
            <button type="button" style={linkStyle} onClick={() => go('portfolio')}>Portfolio</button>
            <button type="button" style={linkStyle} onClick={() => go('contact')}>Contact</button>
          </div>

          {/* Services */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: OSV, marginBottom: 16 }}>Services</p>
            <button type="button" style={linkStyle} onClick={() => go('services')}>Estate Lawn Care</button>
            <button type="button" style={linkStyle} onClick={() => go('services')}>Landscape Design</button>
            <button type="button" style={linkStyle} onClick={() => go('services')}>Irrigation & Turf</button>
            <button type="button" style={linkStyle} onClick={() => go('services')}>Groundskeeping</button>
          </div>

          {/* Legal */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: OSV, marginBottom: 16 }}>Legal</p>
            <span style={{ ...linkStyle, cursor: 'default' }}>Privacy Policy</span>
            <span style={{ ...linkStyle, cursor: 'default' }}>Terms of Service</span>
            <span style={{ ...linkStyle, cursor: 'default' }}>Confidentiality</span>
          </div>

          {/* Connect */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: OSV, marginBottom: 16 }}>Connect</p>
            <span style={{ ...linkStyle, cursor: 'default' }}>+1 (617) 000-0000</span>
            <span style={{ ...linkStyle, cursor: 'default' }}>estate@curatedhorizon.com</span>
            <button type="button" style={linkStyle} onClick={() => go('contact')}>Request Consultation</button>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${OV}`, paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize: 12, color: OSV }}>
            &copy; 2025 The Curated Horizon. All rights reserved.
          </p>
          <p style={{ fontSize: 11, color: OV }}>
            A fictional concept by <Link to="/concepts" style={{ color: S, textDecoration: 'none' }}>Designs By Terrence Adderley</Link>
          </p>
        </div>
      </div>
    </footer>
  )
}

// ── HomePage ─────────────────────────────────────────────────────────────────
function HomePage({ go }: { go: (p: Page) => void }) {
  const btnPrimary: React.CSSProperties = {
    background: '#ffffff',
    color: P,
    border: 'none',
    borderRadius: 0,
    cursor: 'pointer',
    padding: '14px 32px',
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  }
  const btnOutline: React.CSSProperties = {
    background: 'transparent',
    color: '#ffffff',
    border: '1px solid rgba(255,255,255,0.5)',
    borderRadius: 0,
    cursor: 'pointer',
    padding: '14px 32px',
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  }

  return (
    <>
      {/* 1. HERO */}
      <section style={{ position: 'relative', height: '100vh', minHeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <img
          src={IMG_HERO}
          alt="Estate lawn"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(8,39,23,0.72) 0%, rgba(8,39,23,0.55) 60%, rgba(8,39,23,0.8) 100%)' }} />
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 32px', maxWidth: 900 }}>
          {/* Pill label */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 18px', marginBottom: 32 }}>
            <span style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: SF, fontWeight: 500 }}>Private Estate Management</span>
          </div>
          <h1 className="ch-serif" style={{ fontWeight: 300, fontSize: 'clamp(40px, 7vw, 88px)', lineHeight: 1.1, color: '#ffffff', margin: '0 0 8px' }}>
            Exceptional Lawn Care
          </h1>
          <h1 className="ch-serif" style={{ fontWeight: 300, fontSize: 'clamp(40px, 7vw, 88px)', lineHeight: 1.1, color: SF, fontStyle: 'italic', margin: '0 0 28px' }}>
            for Distinguished Properties
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 48, fontWeight: 300 }}>
            Precision. Discretion. Elite Service.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" style={btnPrimary} onClick={() => go('contact')}>
              Request a Private Consultation
            </button>
            <button type="button" style={btnOutline} onClick={() => go('portfolio')}>
              View Portfolio
            </button>
          </div>
        </div>
        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.5)' }}>
          <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Scroll</span>
          <Icon name="keyboard_arrow_down" />
        </div>
      </section>

      {/* 2. VALUE PROPS */}
      <section style={{ background: '#ffffff', padding: '80px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 64, alignItems: 'end', marginBottom: 64 }}>
            <div>
              <h2 className="ch-serif" style={{ fontWeight: 300, fontSize: 'clamp(28px, 4vw, 52px)', lineHeight: 1.2, color: OS }}>
                A Philosophy of
              </h2>
              <h2 className="ch-serif" style={{ fontWeight: 300, fontSize: 'clamp(28px, 4vw, 52px)', lineHeight: 1.2, color: S, fontStyle: 'italic' }}>
                Invisibly Perfect Maintenance
              </h2>
            </div>
            <div>
              <p style={{ fontSize: 15, color: OSV, lineHeight: 1.8 }}>
                We believe the most extraordinary estates are defined by what is never out of place. Our teams work with precision and care, ensuring your grounds reflect the same standard of excellence as your home.
              </p>
            </div>
          </div>

          {/* 3 cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            {[
              { icon: 'filter_vintage', title: 'Meticulous Attention', desc: 'Every blade of grass, every hedgerow, every stone path — attended to with the care your estate deserves.' },
              { icon: 'architecture', title: 'Tailored Estate Plans', desc: 'No two properties are the same. We craft bespoke maintenance programs that honor your landscape\'s unique character.' },
              { icon: 'encrypted', title: 'Discreet & Reliable', desc: 'Our teams operate with the highest professional discretion, arriving on schedule and departing without disruption.' },
            ].map((card) => (
              <div
                key={card.title}
                style={{ background: SL, padding: '40px 32px', transition: 'background 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = SH }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = SL }}
              >
                <div style={{ marginBottom: 20, fontSize: 28, color: S }}>
                  <Icon name={card.icon} />
                </div>
                <h3 className="ch-serif" style={{ fontWeight: 400, fontSize: 20, color: OS, marginBottom: 12 }}>
                  {card.title}
                </h3>
                <p style={{ fontSize: 14, color: OSV, lineHeight: 1.7 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. SERVICES - dark green */}
      <section style={{ background: P, padding: '80px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>
          {/* Sticky heading */}
          <div style={{ position: 'sticky', top: 100 }}>
            <h2 className="ch-serif" style={{ fontWeight: 300, fontSize: 'clamp(28px, 4vw, 48px)', color: '#ffffff', lineHeight: 1.2, marginBottom: 24 }}>
              Services &amp;<br />Specimen Care
            </h2>
            <div style={{ width: 48, height: 2, background: SF, marginBottom: 24 }} />
            <p style={{ fontSize: 14, color: OPC, lineHeight: 1.7 }}>
              A complete spectrum of estate lawn and grounds management, delivered with uncompromising precision.
            </p>
            <button
              type="button"
              onClick={() => go('services')}
              style={{ marginTop: 32, background: 'transparent', border: `1px solid ${OPC}`, color: SF, padding: '12px 28px', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 0 }}
            >
              View All Services
            </button>
          </div>

          {/* Service list */}
          <div>
            {[
              { name: 'Estate Lawn Care', freq: 'Weekly', desc: 'Precision mowing, edging, and seasonal treatments for immaculate turf year-round.' },
              { name: 'Landscape Design', freq: 'Project Based', desc: 'Bespoke garden design and installation aligned to your property\'s architectural character.' },
              { name: 'Irrigation & Turf Management', freq: 'Strategic', desc: 'Smart irrigation systems and turf science that sustain lush, healthy grounds in all seasons.' },
              { name: 'Private Groundskeeping', freq: 'Comprehensive', desc: 'Dedicated full-service estate management: your grounds, cared for as if they were our own.' },
            ].map((svc, i) => (
              <div
                key={svc.name}
                style={{
                  borderTop: i === 0 ? `1px solid ${OPC}30` : `1px solid ${OPC}30`,
                  borderBottom: `1px solid ${OPC}30`,
                  padding: '32px 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 24,
                  marginTop: i > 0 ? -1 : 0,
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3 className="ch-serif" style={{ fontWeight: 300, fontSize: 22, color: '#ffffff', marginBottom: 8 }}>{svc.name}</h3>
                  <p style={{ fontSize: 13, color: OPC, lineHeight: 1.6 }}>{svc.desc}</p>
                </div>
                <span style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: SF, background: `${PC}`, padding: '4px 12px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {svc.freq}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. VISUAL SHOWCASE */}
      <section style={{ background: '#ffffff', padding: '0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', height: 700 }}>
          {/* Left big image */}
          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <img src={IMG_HEDGE} alt="Avery Heights Estate" className="ch-gs" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(8,39,23,0.85) 0%, transparent 100%)', padding: '32px 32px 28px' }}>
              <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: OPC, marginBottom: 4 }}>Featured Estate</p>
              <p className="ch-serif" style={{ fontWeight: 300, fontSize: 22, color: '#ffffff', fontStyle: 'italic' }}>Avery Heights Estate</p>
            </div>
          </div>
          {/* Right image */}
          <div style={{ overflow: 'hidden' }}>
            <img src={IMG_LAWN} alt="Lawn detail" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        </div>
      </section>

      {/* 5. PROCESS */}
      <section style={{ background: SL, padding: '80px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: OSV, marginBottom: 16, fontWeight: 600 }}>Our Process</p>
          <h2 className="ch-serif" style={{ fontWeight: 300, fontSize: 'clamp(28px, 4vw, 48px)', color: OS, marginBottom: 64, lineHeight: 1.2 }}>
            From First Contact<br /><span style={{ fontStyle: 'italic', color: S }}>to Lasting Excellence</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40 }}>
            {[
              { num: '01', title: 'Private Consultation', desc: 'We begin with a discreet, in-person assessment of your property, discussing your vision, standards, and specific requirements.' },
              { num: '02', title: 'Custom Property Plan', desc: 'Our horticultural team develops a fully bespoke grounds management program, tailored to every element of your estate.' },
              { num: '03', title: 'Ongoing Precision Care', desc: 'Your dedicated team arrives on a set schedule, maintaining excellence with the consistency and care your estate demands.' },
            ].map(step => (
              <div key={step.num} style={{ position: 'relative' }}>
                <div style={{ fontSize: 96, fontWeight: 800, color: OV, lineHeight: 1, marginBottom: -24, letterSpacing: '-0.04em', fontFamily: 'Manrope, sans-serif', userSelect: 'none' }}>
                  {step.num}
                </div>
                <h3 className="ch-serif" style={{ fontWeight: 400, fontSize: 20, color: OS, marginBottom: 12, position: 'relative', zIndex: 1 }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 14, color: OSV, lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. TRUST BAR */}
      <section style={{ background: '#ffffff', padding: '40px 48px', borderTop: `1px solid ${OV}`, borderBottom: `1px solid ${OV}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
          <p className="ch-serif" style={{ fontStyle: 'italic', fontWeight: 300, fontSize: 18, color: OS }}>
            "Serving the most exclusive enclaves in the region."
          </p>
          <div style={{ display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap' }}>
            {['The Heights', 'Harbor Isle', 'Oakwood Estates', 'Skyline Ridge'].map(name => (
              <span
                key={name}
                style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: OSV, opacity: 0.5 }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CLOSING CTA */}
      <section style={{ position: 'relative', background: P, padding: '100px 48px', textAlign: 'center', overflow: 'hidden' }}>
        <img
          src={IMG_CTA_BG}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15 }}
        />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 700, margin: '0 auto' }}>
          <h2 className="ch-serif" style={{ fontWeight: 300, fontSize: 'clamp(28px, 4vw, 52px)', color: '#ffffff', lineHeight: 1.2, marginBottom: 8 }}>
            Experience a Higher Standard
          </h2>
          <h2 className="ch-serif" style={{ fontWeight: 300, fontSize: 'clamp(28px, 4vw, 52px)', color: SF, fontStyle: 'italic', lineHeight: 1.2, marginBottom: 32 }}>
            of Lawn Care
          </h2>
          <p style={{ fontSize: 15, color: OPC, lineHeight: 1.7, marginBottom: 40, maxWidth: 480, margin: '0 auto 40px' }}>
            Join a distinguished clientele who trust The Curated Horizon to maintain the beauty and integrity of their estates.
          </p>
          <button
            type="button"
            onClick={() => go('contact')}
            style={{ background: SF, color: OS, border: 'none', borderRadius: 0, cursor: 'pointer', padding: '16px 40px', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            Schedule Your Consultation
          </button>
        </div>
      </section>
    </>
  )
}

// ── ServicesPage ─────────────────────────────────────────────────────────────
function ServicesPage({ go }: { go: (p: Page) => void }) {
  return (
    <>
      {/* Hero heading */}
      <section style={{ background: '#ffffff', padding: '64px 48px 48px', borderBottom: `1px solid ${OV}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: OSV, marginBottom: 16, fontWeight: 600 }}>What We Offer</p>
          <h1 className="ch-serif" style={{ fontWeight: 300, fontSize: 'clamp(40px, 6vw, 80px)', color: OS, lineHeight: 1.1 }}>
            Our Services
          </h1>
        </div>
      </section>

      {/* Service 1: Estate Lawn Care — 7/5, image left */}
      <section style={{ background: '#ffffff', padding: '80px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 64, alignItems: 'center' }}>
          <div style={{ overflow: 'hidden' }}>
            <img src={IMG_SVC_LAWN} alt="Estate Lawn Care" className="ch-gs" style={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover', display: 'block' }} />
          </div>
          <div>
            <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: S, fontWeight: 600, marginBottom: 16 }}>Service 01</p>
            <h2 className="ch-serif" style={{ fontWeight: 300, fontSize: 'clamp(28px, 3.5vw, 48px)', color: OS, lineHeight: 1.2, marginBottom: 24 }}>
              Estate Lawn<br /><span style={{ fontStyle: 'italic', color: S }}>Care & Maintenance</span>
            </h2>
            <p style={{ fontSize: 14, color: OSV, lineHeight: 1.8, marginBottom: 24 }}>
              Precision mowing, edging, aeration, and seasonal treatments — all delivered on a schedule built around your estate's unique requirements. Our crews use commercial-grade equipment calibrated for immaculate, consistent results.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {['Weekly mowing & edging', 'Seasonal aeration & overseeding', 'Fertilization programs', 'Weed & pest management'].map(item => (
                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: OSV, marginBottom: 10 }}>
                  <span style={{ color: P, fontSize: 16 }}><Icon name="check_small" /></span>
                  {item}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 32, display: 'inline-flex', alignItems: 'center', gap: 8, background: SL, padding: '8px 16px' }}>
              <span style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: S, fontWeight: 600 }}>Frequency: Weekly</span>
            </div>
          </div>
        </div>
      </section>

      {/* Service 2: Landscape Design — 5/7, image right, light bg */}
      <section style={{ background: SL, padding: '80px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 64, alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: S, fontWeight: 600, marginBottom: 16 }}>Service 02</p>
            <h2 className="ch-serif" style={{ fontWeight: 300, fontSize: 'clamp(28px, 3.5vw, 48px)', color: OS, lineHeight: 1.2, marginBottom: 24 }}>
              Landscape<br /><span style={{ fontStyle: 'italic', color: S }}>Design & Installation</span>
            </h2>
            <p style={{ fontSize: 14, color: OSV, lineHeight: 1.8, marginBottom: 24 }}>
              Working with your architect and interior designer, we create outdoor spaces that feel like a natural extension of your home's character — from formal parterre gardens to sweeping naturalized meadows.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {['Bespoke design consultation', 'Plant selection & procurement', 'Hardscape coordination', 'Installation & post-installation care'].map(item => (
                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: OSV, marginBottom: 10 }}>
                  <span style={{ color: P, fontSize: 16 }}><Icon name="check_small" /></span>
                  {item}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 32, display: 'inline-flex', alignItems: 'center', gap: 8, background: '#ffffff', padding: '8px 16px' }}>
              <span style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: S, fontWeight: 600 }}>Frequency: Project Based</span>
            </div>
          </div>
          <div style={{ overflow: 'hidden' }}>
            <img src={IMG_SVC_LAND} alt="Landscape Design" className="ch-gs" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
          </div>
        </div>
      </section>

      {/* Service 3: Seasonal — 3-col bento */}
      <section style={{ background: '#ffffff', padding: '80px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: S, fontWeight: 600, marginBottom: 16 }}>Service 03</p>
          <h2 className="ch-serif" style={{ fontWeight: 300, fontSize: 'clamp(28px, 3.5vw, 48px)', color: OS, lineHeight: 1.2, marginBottom: 40 }}>
            Seasonal Care<br /><span style={{ fontStyle: 'italic', color: S }}>Year-Round Excellence</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            {/* Winter card */}
            <div style={{ background: PC, padding: '48px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: 360 }}>
              <div style={{ fontSize: 40, marginBottom: 16, color: OPC }}><Icon name="ac_unit" /></div>
              <h3 className="ch-serif" style={{ fontWeight: 300, fontSize: 24, color: '#ffffff', marginBottom: 12 }}>Winter Readiness</h3>
              <p style={{ fontSize: 13, color: OPC, lineHeight: 1.7 }}>
                Winterization, snow management, and dormancy care to protect your landscape through the coldest months.
              </p>
            </div>
            {/* Spring image with overlay */}
            <div style={{ position: 'relative', overflow: 'hidden', minHeight: 360 }}>
              <img src={IMG_SVC_SPRING} alt="Spring Care" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute', inset: 0 }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,39,23,0.8) 0%, transparent 60%)' }} />
              <div style={{ position: 'absolute', bottom: 32, left: 32, right: 32 }}>
                <h3 className="ch-serif" style={{ fontWeight: 300, fontSize: 24, color: '#ffffff', marginBottom: 8, fontStyle: 'italic' }}>Spring Awakening</h3>
                <p style={{ fontSize: 13, color: OPC, lineHeight: 1.6 }}>Thatch removal, first fertilization, and intensive preparation for peak season performance.</p>
              </div>
            </div>
            {/* Summer/Fall card */}
            <div style={{ background: SL, padding: '48px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: 360 }}>
              <div style={{ fontSize: 40, marginBottom: 16, color: S }}><Icon name="wb_sunny" /></div>
              <h3 className="ch-serif" style={{ fontWeight: 300, fontSize: 24, color: OS, marginBottom: 12 }}>Summer &amp; Fall</h3>
              <p style={{ fontSize: 13, color: OSV, lineHeight: 1.7 }}>
                Peak-season maintenance, drought management, leaf programs, and fall aeration to prepare for winter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Service 4: Irrigation — full width image bg with text overlay */}
      <section style={{ position: 'relative', minHeight: 500, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <img
          src={IMG_SVC_IRRIG}
          alt="Irrigation & Turf Management"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5)' }}
        />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1280, margin: '0 auto', padding: '80px 48px', width: '100%' }}>
          <div style={{ maxWidth: 560, background: 'rgba(8,39,23,0.85)', backdropFilter: 'blur(8px)', padding: '48px 40px' }}>
            <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: OPC, fontWeight: 600, marginBottom: 16 }}>Service 04</p>
            <h2 className="ch-serif" style={{ fontWeight: 300, fontSize: 'clamp(24px, 3vw, 40px)', color: '#ffffff', lineHeight: 1.2, marginBottom: 20 }}>
              Irrigation &amp;<br /><span style={{ fontStyle: 'italic', color: SF }}>Turf Management</span>
            </h2>
            <p style={{ fontSize: 14, color: OPC, lineHeight: 1.8, marginBottom: 24 }}>
              Smart irrigation systems designed for your estate's exact soil profile, sun exposure, and drainage characteristics. We monitor, adjust, and optimize throughout the season.
            </p>
            <div style={{ borderLeft: `3px solid ${SF}`, paddingLeft: 16 }}>
              <p style={{ fontSize: 13, color: SF, fontStyle: 'italic', lineHeight: 1.6 }}>
                "A perfectly healthy turf requires less water, less input, and creates less disruption — elegance through efficiency."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Service 5: Groundskeeping — sticky left, image grid right */}
      <section style={{ background: '#ffffff', padding: '80px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>
          <div style={{ position: 'sticky', top: 100 }}>
            <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: S, fontWeight: 600, marginBottom: 16 }}>Service 05</p>
            <h2 className="ch-serif" style={{ fontWeight: 300, fontSize: 'clamp(28px, 3.5vw, 48px)', color: OS, lineHeight: 1.2, marginBottom: 24 }}>
              Private<br /><span style={{ fontStyle: 'italic', color: S }}>Groundskeeping</span>
            </h2>
            <p style={{ fontSize: 14, color: OSV, lineHeight: 1.8, marginBottom: 32 }}>
              Our most comprehensive offering: a dedicated team assigned exclusively to your estate. From daily rounds to seasonal deep-work, your grounds receive uninterrupted, expert attention.
            </p>
            <div style={{ borderLeft: `2px solid ${S}`, paddingLeft: 20, marginBottom: 32 }}>
              <p style={{ fontSize: 13, color: S, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Comprehensive Program</p>
              <p style={{ fontSize: 13, color: OSV, lineHeight: 1.6, marginTop: 6 }}>Full estate grounds management, dedicated crew, monthly reporting.</p>
            </div>
            <button
              type="button"
              onClick={() => go('contact')}
              style={{ background: P, color: '#ffffff', border: 'none', borderRadius: 0, cursor: 'pointer', padding: '14px 32px', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}
            >
              Inquire About This Service
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <img src={IMG_GND1} alt="Groundskeeping" className="ch-gs" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
              <img src={IMG_GND2} alt="Groundskeeping detail" className="ch-gs" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
            </div>
            <img src={IMG_GND3} alt="Estate grounds" style={{ width: '100%', aspectRatio: '16/7', objectFit: 'cover', display: 'block' }} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: SL, padding: '64px 48px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 className="ch-serif" style={{ fontWeight: 300, fontSize: 'clamp(24px, 3.5vw, 40px)', color: OS, marginBottom: 16 }}>
            Ready to elevate your estate?
          </h2>
          <p style={{ fontSize: 14, color: OSV, lineHeight: 1.7, marginBottom: 32 }}>
            Contact us to discuss which services are right for your property.
          </p>
          <button
            type="button"
            onClick={() => go('contact')}
            style={{ background: P, color: '#ffffff', border: 'none', borderRadius: 0, cursor: 'pointer', padding: '14px 40px', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            Request Consultation
          </button>
        </div>
      </section>
    </>
  )
}

// ── PortfolioPage ─────────────────────────────────────────────────────────────
function PortfolioPage({ go }: { go: (p: Page) => void }) {
  return (
    <>
      {/* Hero heading */}
      <section style={{ background: '#ffffff', padding: '64px 48px 48px', borderBottom: `1px solid ${OV}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: OSV, marginBottom: 16, fontWeight: 600 }}>Our Work</p>
            <h1 className="ch-serif" style={{ fontWeight: 300, fontSize: 'clamp(40px, 6vw, 80px)', color: OS, lineHeight: 1.1 }}>
              Our Portfolio
            </h1>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: OSV, opacity: 0.6 }}>
            <span style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Scroll</span>
            <Icon name="arrow_downward" />
          </div>
        </div>
      </section>

      {/* Gallery Item 1 — 8/4, large image left */}
      <section style={{ background: '#ffffff', padding: '64px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '8fr 4fr', gap: 48, alignItems: 'start' }}>
          <div style={{ overflow: 'hidden' }}>
            <img src={IMG_PORT1} alt="Windmere Estate" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
          </div>
          <div style={{ paddingTop: 16 }}>
            <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: S, fontWeight: 600, marginBottom: 12 }}>Project 01</p>
            <h2 className="ch-serif" style={{ fontWeight: 300, fontSize: 28, color: OS, lineHeight: 1.2, marginBottom: 16 }}>
              Windmere Estate
            </h2>
            <div style={{ width: 32, height: 1, background: OV, marginBottom: 20 }} />
            <p style={{ fontSize: 13, color: OSV, lineHeight: 1.8, marginBottom: 24 }}>
              A 12-acre private estate requiring complete grounds rehabilitation and the establishment of a sustainable weekly maintenance program. Includes formal garden installation and a smart irrigation overhaul.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Services', value: 'Lawn Care, Landscape Design, Irrigation' },
                { label: 'Size', value: '12 acres' },
                { label: 'Duration', value: 'Ongoing (3 years+)' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', gap: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: OSV, width: 80, flexShrink: 0 }}>{row.label}</span>
                  <span style={{ fontSize: 12, color: OS }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Item 2 duo — 5/7 asymmetric */}
      <section style={{ background: SL, padding: '0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr' }}>
          <div style={{ overflow: 'hidden', position: 'relative' }}>
            <img src={IMG_PORT2A} alt="Clearwater Gardens" className="ch-gs" style={{ width: '100%', height: '100%', minHeight: 500, objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24 }}>
              <div style={{ background: 'rgba(8,39,23,0.85)', backdropFilter: 'blur(4px)', padding: '16px 20px' }}>
                <p style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: OPC, marginBottom: 4 }}>Project 02</p>
                <p className="ch-serif" style={{ fontWeight: 300, fontSize: 18, color: '#ffffff', fontStyle: 'italic' }}>Clearwater Gardens</p>
              </div>
            </div>
          </div>
          <div style={{ overflow: 'hidden', position: 'relative' }}>
            <img src={IMG_PORT2B} alt="Harborview Manor" className="ch-gs" style={{ width: '100%', height: '100%', minHeight: 500, objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', bottom: 24, right: 24 }}>
              <div style={{ background: 'rgba(8,39,23,0.85)', backdropFilter: 'blur(4px)', padding: '16px 20px' }}>
                <p style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: OPC, marginBottom: 4 }}>Project 03</p>
                <p className="ch-serif" style={{ fontWeight: 300, fontSize: 18, color: '#ffffff', fontStyle: 'italic' }}>Harborview Manor</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Item 3 — full width 700px */}
      <section style={{ background: '#ffffff', padding: '2px 0' }}>
        <div style={{ position: 'relative', height: 700, overflow: 'hidden' }}>
          <img src={IMG_PORT4} alt="Grand Estate Entrance" className="ch-gs" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,39,23,0.7) 0%, transparent 50%)' }} />
          <div style={{ position: 'absolute', bottom: 48, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', width: '100%' }}>
            <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: OPC, marginBottom: 8 }}>Project 04</p>
            <h2 className="ch-serif" style={{ fontWeight: 300, fontSize: 'clamp(28px, 4vw, 56px)', color: '#ffffff', fontStyle: 'italic' }}>
              Grand Estate Entrance
            </h2>
            <p style={{ fontSize: 13, color: OPC, marginTop: 8, letterSpacing: '0.08em' }}>Complete driveway and entrance landscape design, Skyline Ridge</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: P, padding: '80px 48px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 className="ch-serif" style={{ fontWeight: 300, fontSize: 'clamp(28px, 4vw, 48px)', color: '#ffffff', lineHeight: 1.2, marginBottom: 8 }}>
            Begin Your
          </h2>
          <h2 className="ch-serif" style={{ fontWeight: 300, fontSize: 'clamp(28px, 4vw, 48px)', color: SF, fontStyle: 'italic', lineHeight: 1.2, marginBottom: 32 }}>
            Transformation
          </h2>
          <p style={{ fontSize: 14, color: OPC, lineHeight: 1.7, marginBottom: 40 }}>
            Every exceptional estate begins with a single conversation. Let us show you what's possible for your property.
          </p>
          <button
            type="button"
            onClick={() => go('contact')}
            style={{ background: SF, color: OS, border: 'none', borderRadius: 0, cursor: 'pointer', padding: '16px 40px', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            Request a Private Consultation
          </button>
        </div>
      </section>
    </>
  )
}

// ── AboutPage ─────────────────────────────────────────────────────────────────
function AboutPage({ go }: { go: (p: Page) => void }) {
  return (
    <>
      {/* Big headline */}
      <section style={{ background: '#ffffff', padding: '80px 48px 64px', borderBottom: `1px solid ${OV}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <h1 className="ch-serif" style={{ fontWeight: 300, fontSize: 'clamp(40px, 7vw, 96px)', color: OS, lineHeight: 1.0, maxWidth: 700 }}>
            The Standard<br /><span style={{ fontStyle: 'italic', color: S }}>of Excellence.</span>
          </h1>
        </div>
      </section>

      {/* Brand story — 7/5, image left */}
      <section style={{ background: '#ffffff', padding: '80px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 64, alignItems: 'center' }}>
          <div style={{ overflow: 'hidden' }}>
            <img src={IMG_ABOUT_EST} alt="Estate Heritage" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
          </div>
          <div>
            <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: S, fontWeight: 600, marginBottom: 16 }}>Our Heritage</p>
            <h2 className="ch-serif" style={{ fontWeight: 300, fontSize: 'clamp(24px, 3vw, 40px)', color: OS, lineHeight: 1.3, marginBottom: 24 }}>
              Founded on a belief that extraordinary landscapes deserve extraordinary care.
            </h2>
            <p style={{ fontSize: 14, color: OSV, lineHeight: 1.8, marginBottom: 16 }}>
              The Curated Horizon was established by a team of horticultural specialists who recognized a gap in the market: truly elite estate maintenance that operates with the discretion and precision of luxury household staff.
            </p>
            <p style={{ fontSize: 14, color: OSV, lineHeight: 1.8 }}>
              Today, we serve a carefully selected portfolio of private estates and corporate headquarters, bringing the same exacting standards to every property we steward.
            </p>
          </div>
        </div>
      </section>

      {/* Philosophy — 3 pillars */}
      <section style={{ background: SL, padding: '80px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: OSV, marginBottom: 16, fontWeight: 600 }}>Our Philosophy</p>
          <h2 className="ch-serif" style={{ fontWeight: 300, fontSize: 'clamp(28px, 4vw, 48px)', color: OS, marginBottom: 56, lineHeight: 1.2 }}>
            Three Pillars of<br /><span style={{ fontStyle: 'italic', color: S }}>Estate Excellence</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            {[
              { icon: 'precision_manufacturing', title: 'Precision', desc: 'Every task is executed to exact specifications, measured against the highest horticultural standards. We don\'t approximate — we achieve.' },
              { icon: 'autorenew', title: 'Consistency', desc: 'Exceptional grounds don\'t happen by chance. They are the result of scheduled, unwavering care that accounts for every season and microclimate.' },
              { icon: 'favorite', title: 'Care', desc: 'We treat every estate as if it were our own — with genuine respect for the landscape, its history, and the people who call it home.' },
            ].map(pillar => (
              <div key={pillar.title} style={{ background: '#ffffff', padding: '40px 32px' }}>
                <div
                  style={{ width: 48, height: 48, background: P, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, color: OPC, fontSize: 22 }}
                >
                  <Icon name={pillar.icon} />
                </div>
                <h3 className="ch-serif" style={{ fontWeight: 400, fontSize: 22, color: OS, marginBottom: 12 }}>
                  {pillar.title}
                </h3>
                <p style={{ fontSize: 14, color: OSV, lineHeight: 1.7 }}>{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team — 5/6 grid */}
      <section style={{ background: '#ffffff', padding: '80px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '5fr 6fr', gap: 64, alignItems: 'center' }}>
          <div style={{ overflow: 'hidden' }}>
            <img src={IMG_ABOUT_TEAM} alt="Our Team" style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }} />
          </div>
          <div>
            <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: S, fontWeight: 600, marginBottom: 16 }}>Our People</p>
            <h2 className="ch-serif" style={{ fontWeight: 300, fontSize: 'clamp(24px, 3vw, 40px)', color: OS, lineHeight: 1.3, marginBottom: 24 }}>
              The Specialists Behind<br /><span style={{ fontStyle: 'italic', color: S }}>the Horizon</span>
            </h2>
            <p style={{ fontSize: 14, color: OSV, lineHeight: 1.8, marginBottom: 40 }}>
              Each member of our team is a trained horticulturalist with a minimum of five years' experience on private estate grounds. We invest in ongoing education, premium tools, and the professional development that sets our team apart.
            </p>
            {/* Stats */}
            <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
              {[
                { stat: '98%', label: 'Client Retention' },
                { stat: '15+', label: 'Years Experience' },
              ].map(item => (
                <div key={item.label} style={{ borderLeft: `3px solid ${S}`, paddingLeft: 16 }}>
                  <p className="ch-serif" style={{ fontWeight: 300, fontSize: 40, color: P, lineHeight: 1 }}>{item.stat}</p>
                  <p style={{ fontSize: 12, color: OSV, letterSpacing: '0.06em', marginTop: 4, textTransform: 'uppercase', fontWeight: 600 }}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quote block */}
      <section style={{ background: P, padding: '80px 48px', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ fontSize: 40, color: OPC, marginBottom: 24 }}><Icon name="format_quote" /></div>
          <blockquote className="ch-serif" style={{ fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(22px, 3vw, 36px)', color: '#ffffff', lineHeight: 1.4, margin: '0 0 32px' }}>
            "A horizon that is curated is a peace that is preserved."
          </blockquote>
          <p style={{ fontSize: 12, color: OPC, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>
            The Curated Horizon Credo
          </p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: SL, padding: '64px 48px', textAlign: 'center' }}>
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <h2 className="ch-serif" style={{ fontWeight: 300, fontSize: 'clamp(24px, 3vw, 36px)', color: OS, marginBottom: 24 }}>
            Ready to work with us?
          </h2>
          <button
            type="button"
            onClick={() => go('contact')}
            style={{ background: P, color: '#ffffff', border: 'none', borderRadius: 0, cursor: 'pointer', padding: '14px 40px', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            Request a Consultation
          </button>
        </div>
      </section>
    </>
  )
}

// ── ContactPage ───────────────────────────────────────────────────────────────
function ContactPage({ go: _go }: { go: (p: Page) => void }) {
  const [form, setForm] = useState({
    name: '',
    location: '',
    message: '',
    services: [] as string[],
  })

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: `1px solid ${OV}`,
    borderRadius: 0,
    padding: '12px 0',
    fontSize: 14,
    color: OS,
    outline: 'none',
    fontFamily: 'Manrope, sans-serif',
    boxSizing: 'border-box',
  }

  const toggleService = (svc: string) => {
    setForm(f => ({
      ...f,
      services: f.services.includes(svc)
        ? f.services.filter(s => s !== svc)
        : [...f.services, svc],
    }))
  }

  const serviceOptions = ['Estate Lawn Care', 'Landscape Design', 'Irrigation & Turf', 'Private Groundskeeping']

  return (
    <>
      {/* Hero heading */}
      <section style={{ background: P, padding: '80px 48px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: OPC, marginBottom: 16, fontWeight: 600 }}>Get In Touch</p>
          <h1 className="ch-serif" style={{ fontWeight: 300, fontSize: 'clamp(36px, 5vw, 72px)', color: '#ffffff', lineHeight: 1.1, maxWidth: 700 }}>
            Request a Private<br /><span style={{ fontStyle: 'italic', color: SF }}>Consultation</span>
          </h1>
          <p style={{ fontSize: 15, color: OPC, marginTop: 20, lineHeight: 1.6, maxWidth: 480 }}>
            We review every inquiry personally. All communications are handled with complete discretion.
          </p>
        </div>
      </section>

      {/* Split layout: 4/7 info | form */}
      <section style={{ background: '#ffffff', padding: '80px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '4fr 7fr', gap: 80, alignItems: 'start' }}>
          {/* Info column */}
          <div>
            <div style={{ marginBottom: 40 }}>
              <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: OSV, marginBottom: 16, fontWeight: 600 }}>Service Areas</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {['The Heights', 'Harbor Isle District', 'Oakwood Estates', 'Skyline Ridge', 'Bayside Enclave', 'Northmere Reserve'].map(area => (
                  <li key={area} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: OSV, borderBottom: `1px solid ${OV}`, padding: '10px 0' }}>
                    <span style={{ color: P, fontSize: 16 }}><Icon name="location_on" /></span>
                    {area}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ marginBottom: 32 }}>
              <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: OSV, marginBottom: 12, fontWeight: 600 }}>Direct Contact</p>
              <p style={{ fontSize: 13, color: OSV, marginBottom: 6 }}>+1 (617) 000-0000</p>
              <p style={{ fontSize: 13, color: OSV }}>estate@curatedhorizon.com</p>
            </div>
            <div style={{ overflow: 'hidden' }}>
              <img src={IMG_CONTACT} alt="Estate" className="ch-gs" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
            </div>
          </div>

          {/* Form column */}
          <form onSubmit={e => e.preventDefault()}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
              <div>
                <label style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: OSV, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: OSV, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                  Property Location
                </label>
                <input
                  type="text"
                  placeholder="Neighborhood or address area"
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: 32 }}>
              <label style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: OSV, fontWeight: 600, display: 'block', marginBottom: 16 }}>
                Service Interest
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {serviceOptions.map(svc => {
                  const checked = form.services.includes(svc)
                  return (
                    <button
                      key={svc}
                      type="button"
                      onClick={() => toggleService(svc)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        background: checked ? P : 'transparent',
                        border: `1px solid ${checked ? P : OV}`,
                        borderRadius: 0,
                        padding: '10px 14px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s, border-color 0.15s',
                      }}
                    >
                      <span style={{ fontSize: 16, color: checked ? '#ffffff' : OV }}>
                        <Icon name={checked ? 'check_box' : 'check_box_outline_blank'} />
                      </span>
                      <span style={{ fontSize: 12, color: checked ? '#ffffff' : OSV, fontWeight: 500, letterSpacing: '0.02em' }}>{svc}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ marginBottom: 40 }}>
              <label style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: OSV, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                Message
              </label>
              <textarea
                placeholder="Tell us about your property and what you're looking for..."
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                rows={6}
                style={{ ...inputStyle, resize: 'vertical', borderBottom: 'none', border: `1px solid ${OV}`, padding: '12px 16px' }}
              />
            </div>

            <button
              type="submit"
              style={{ width: '100%', background: P, color: '#ffffff', border: 'none', borderRadius: 0, cursor: 'pointer', padding: '16px 32px', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}
            >
              Request Private Consultation
            </button>
            <p style={{ fontSize: 11, color: OSV, textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
              All inquiries are reviewed within 24 hours. Your information is kept strictly confidential.
            </p>
          </form>
        </div>
      </section>

      {/* Detail section: topiary image left with amber offset, text right */}
      <section style={{ background: SL, padding: '80px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          {/* Image with amber bg offset */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: 24, left: 24, right: -24, bottom: -24, background: SF, zIndex: 0 }} />
            <div style={{ position: 'relative', zIndex: 1, overflow: 'hidden' }}>
              <img src={IMG_TOPIARY} alt="Precision topiary" className="ch-gs" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
            </div>
          </div>
          {/* Text right */}
          <div>
            <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: OSV, marginBottom: 20, fontWeight: 600 }}>What To Expect</p>
            {[
              {
                title: 'Precision',
                desc: 'From your first inquiry to your first service visit, every step is handled with care. We send a dedicated account manager to conduct your initial estate assessment.'
              },
              {
                title: 'Discretion',
                desc: 'We understand the value of privacy. Our teams operate quietly and professionally, and all client information is held in strict confidence — always.'
              },
            ].map((item, i) => (
              <div key={item.title} style={{ marginBottom: i === 0 ? 36 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, background: P, display: 'flex', alignItems: 'center', justifyContent: 'center', color: OPC, fontSize: 16, flexShrink: 0 }}>
                    <Icon name={i === 0 ? 'precision_manufacturing' : 'lock'} />
                  </div>
                  <h3 className="ch-serif" style={{ fontWeight: 400, fontSize: 22, color: OS }}>{item.title}</h3>
                </div>
                <p style={{ fontSize: 14, color: OSV, lineHeight: 1.8, paddingLeft: 44 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function CuratedHorizon() {
  const [page, setPage] = useState<Page>('home')
  const go = (p: Page) => { setPage(p); window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }) }

  return (
    <>
      <style>{STYLES}</style>
      <div className="ch-body" style={{ minHeight: '100vh', background: SURF, color: OS }}>
        <Nav page={page} go={go} />
        <div style={{ paddingTop: 80 }}>
          {page === 'home'      && <HomePage go={go} />}
          {page === 'services'  && <ServicesPage go={go} />}
          {page === 'portfolio' && <PortfolioPage go={go} />}
          {page === 'about'     && <AboutPage go={go} />}
          {page === 'contact'   && <ContactPage go={go} />}
        </div>
        <Footer go={go} />
      </div>
    </>
  )
}
