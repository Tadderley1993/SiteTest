import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'
import CTASection from '../components/layout/CTASection'
import Footer from '../components/layout/Footer'
import SectionLabel from '../components/layout/SectionLabel'

// ── Data ─────────────────────────────────────────────────────────────
const SERVICES = [
  {
    num: '01', title: 'Brand Identity',
    desc: 'A cohesive visual system that makes your business instantly recognizable and unforgettable — from the first impression through every touchpoint.',
    deliverables: ['Logo design & variations', 'Color palette & typography', 'Brand guidelines', 'Business card & collateral'],
    outcome: 'Clients remember you. Competitors can\'t copy you.',
  },
  {
    num: '02', title: 'Web Design',
    desc: 'Conversion-optimized, pixel-perfect designs that balance aesthetic impact with measurable function. Every screen is intentional — nothing is decorative filler.',
    deliverables: ['Custom UI/UX design', 'Mobile first layouts', 'Interaction & micro animation', 'Design system'],
    outcome: 'More time on site. More clicks on the thing that matters.',
  },
  {
    num: '03', title: 'Web Development',
    desc: 'Fast, clean, accessible code built on modern frameworks — deployed and ready to scale. Performance and SEO baked in from line one.',
    deliverables: ['React / Next.js builds', 'CMS integration', 'Core Web Vitals tuning', 'Accessibility (WCAG 2.1)'],
    outcome: 'A site that loads fast, ranks well, and never breaks.',
  },
  {
    num: '04', title: 'SEO Optimization',
    desc: 'Boston-focused keyword strategy and technical SEO that drives qualified traffic — not just vanity numbers. Built on what Google actually rewards in 2025.',
    deliverables: ['Keyword research & mapping', 'On-page & technical SEO', 'Local SEO (Boston, MA)', 'Performance reporting'],
    outcome: 'Found by the right people at the right moment.',
  },
  {
    num: '05', title: 'E-Commerce',
    desc: 'Online stores engineered to sell — from compelling product pages to a checkout flow so smooth customers don\'t think twice about clicking Buy.',
    deliverables: ['Shopify & custom stores', 'Product page optimization', 'Payment gateway setup', 'Inventory & order management'],
    outcome: 'Higher cart value. Lower abandonment. Repeat buyers.',
  },
  {
    num: '06', title: 'Ongoing Maintenance',
    desc: 'Continuous support so your site stays fast, secure, and ahead of the competition — without you having to think about it.',
    deliverables: ['Monthly updates & backups', 'Performance monitoring', 'Content updates & edits', 'Priority support'],
    outcome: 'Peace of mind. Every month.',
  },
]

const PROCESS = [
  { num: '01', title: 'Consultation', desc: 'A no-pressure call to hear your vision, understand your business, and figure out if we\'re the right fit.' },
  { num: '02', title: 'Discovery', desc: 'We dig into your goals, audience, and competitive landscape — turning assumptions into a shared understanding.' },
  { num: '03', title: 'Strategy', desc: 'A clear plan: scope, timeline, deliverables, and success metrics — agreed before a pixel is moved.' },
  { num: '04', title: 'Build', desc: 'Design and development in tight feedback loops. You see real progress every step of the way.' },
  { num: '05', title: 'Launch', desc: 'QA, cross-device testing, deployment, and a proper handoff. You\'re not alone on go-live day.' },
]

// ── Components ───────────────────────────────────────────────────────
function ServiceRow({ num, title, desc, deliverables, outcome }: typeof SERVICES[0]) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-t border-[rgba(0,0,0,0.07)]">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full grid grid-cols-[48px_1fr_auto] md:grid-cols-[64px_1fr_auto] items-start gap-6 py-8 text-left group"
      >
        <span className="text-[13px] font-semibold tracking-[0.1em] text-accent/60 mt-1">{num}</span>
        <div>
          <h3 className="text-[22px] md:text-[28px] font-medium tracking-tighter text-text-primary group-hover:text-accent transition-colors duration-200 leading-tight">
            {title}
          </h3>
          <p className="text-[14px] text-text-muted mt-1.5 leading-relaxed max-w-xl">{desc}</p>
        </div>
        <span className={`text-accent text-[22px] mt-1 transition-transform duration-300 shrink-0 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="pl-[72px] md:pl-[88px] pb-8 grid md:grid-cols-2 gap-8">
              {/* Deliverables */}
              <div>
                <p className="text-[11px] tracking-[0.12em] uppercase text-text-muted font-semibold mb-4">What's included</p>
                <ul className="flex flex-col gap-2.5">
                  {deliverables.map(d => (
                    <li key={d} className="flex items-start gap-2.5 text-[14px] text-text-primary">
                      <span className="text-accent shrink-0 mt-0.5 text-[10px]">▸</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Outcome */}
              <div className="flex flex-col justify-between">
                <div>
                  <p className="text-[11px] tracking-[0.12em] uppercase text-text-muted font-semibold mb-4">The outcome</p>
                  <p className="text-[16px] font-medium tracking-tight text-text-primary leading-snug italic">"{outcome}"</p>
                </div>
                <a
                  href="#start-project"
                  className="inline-flex items-center gap-2 mt-6 text-[13px] font-semibold text-accent hover:text-accent-dim transition-colors"
                >
                  Get a quote for this service →
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[rgba(0,0,0,0.08)]">
      <button type="button" onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between py-5 text-left gap-4">
        <span className="text-[16px] font-medium text-text-primary">{q}</span>
        <span className={`shrink-0 text-accent text-[20px] transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <p className="pb-5 text-[15px] text-text-muted leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────
export default function Services() {
  return (
    <PageWrapper
      title="Web Design Services Boston MA — Designs By TA"
      description="Brand identity, web design, web development, SEO, e-commerce, and maintenance. Boston MA web design services tailored to your business."
      canonical="https://designsbyta.com/services"
    >
      {/* ── MOBILE layout ─────────────────────────────────────────── */}
      <div className="md:hidden bg-background">

        {/* Hero */}
        <section className="pt-8 pb-16 px-6">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#735c00] block mb-4">Our Expertise</span>
          <h1 className="font-serif italic text-[2.75rem] leading-[1.1] tracking-tight text-text-primary mb-5">
            Everything you need.<br />Nothing you don't.
          </h1>
          <p className="text-[#4c4637] text-base leading-relaxed max-w-[85%]">
            Full-service digital design in Boston, MA. Each engagement is scoped precisely to your goals — no templates, no packages, no guessing.
          </p>
        </section>

        {/* Service cards — asymmetric editorial layout */}
        <section className="px-6 pb-16 flex flex-col gap-10">
          {SERVICES.map((s, i) => {
            const offset = i % 2 === 1
            return (
              <div
                key={s.num}
                className={`p-8 flex flex-col gap-5 ${
                  offset
                    ? 'bg-white -mr-6 ml-3 shadow-[0_10px_30px_-10px_rgba(29,28,23,0.07)]'
                    : 'bg-[#f8f3eb]'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-[#735c00]">{s.title}</span>
                  <span className="font-serif italic text-3xl text-[rgba(127,118,101,0.25)]">{s.num}</span>
                </div>
                <p className="text-text-muted text-sm leading-loose">{s.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {s.deliverables.slice(0, 2).map(d => (
                    <span key={d} className="text-[10px] uppercase tracking-widest font-semibold text-text-muted border border-[rgba(0,0,0,0.1)] px-3 py-1">{d}</span>
                  ))}
                </div>
                <p className="font-serif italic text-sm text-[#735c00] border-t border-[rgba(0,0,0,0.06)] pt-4">
                  "{s.outcome}"
                </p>
              </div>
            )
          })}
        </section>

        {/* Stats */}
        <section className="bg-[#f8f3eb] py-14 px-6">
          <div className="flex gap-10 flex-wrap">
            {[
              { stat: '6', label: 'Service disciplines' },
              { stat: '10+', label: 'Industries served' },
              { stat: '100%', label: 'Custom — never templated' },
            ].map(({ stat, label }) => (
              <div key={label}>
                <p className="text-4xl font-black tracking-tighter text-text-primary leading-none">{stat}</p>
                <p className="text-xs text-text-muted mt-1 tracking-wide">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#1C1917] py-16 px-6 text-center">
          <h2 className="font-serif italic text-3xl text-[#F5F0E8] mb-6">Ready to elevate your presence?</h2>
          <a href="#start-project" className="inline-block bg-accent text-[#1C1917] px-10 py-4 font-bold text-xs tracking-widest uppercase hover:bg-accent-dim transition-colors">
            Book a Consult
          </a>
        </section>

      </div>

      {/* ── DESKTOP layout ─────────────────────────────────────────── */}
      <div className="hidden md:block">

      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'ProfessionalService',
          name: 'Designs By TA', url: 'https://designsbyta.com/services',
          address: { '@type': 'PostalAddress', addressLocality: 'Boston', addressRegion: 'MA', addressCountry: 'US' },
          hasOfferCatalog: {
            '@type': 'OfferCatalog', name: 'Web Design Services',
            itemListElement: SERVICES.map(s => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.title } })),
          },
        })}</script>
      </Helmet>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-14 px-6 lg:px-8 bg-background overflow-hidden" aria-label="Services hero">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(198,168,75,0.06)] via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <SectionLabel label="Services" className="mb-6" />
            <h1 className="text-h1 font-medium tracking-tighter text-text-primary mb-6 max-w-2xl">
              Everything you need.<br /><span className="text-accent">Nothing you don't.</span>
            </h1>
            <p className="text-[18px] text-text-muted max-w-xl leading-relaxed mb-10">
              Full-service digital design in Boston, MA. Each engagement is scoped precisely to your goals — no templates, no packages, no guessing.
            </p>
            {/* Inline stats */}
            <div className="flex flex-wrap gap-10">
              {[
                { stat: '6', label: 'Service disciplines' },
                { stat: '10+', label: 'Industries served' },
                { stat: '100%', label: 'Custom — never templated' },
              ].map(({ stat, label }) => (
                <div key={label}>
                  <p className="text-[32px] font-black tracking-tighter text-text-primary leading-none">{stat}</p>
                  <p className="text-[12px] text-text-muted mt-1 tracking-wide">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Services accordion list ─────────────────────────────── */}
      <section className="py-16 bg-background border-t border-[rgba(0,0,0,0.08)]" aria-label="Services list">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <SectionLabel number="01" label="What's On Offer" className="mb-10" />
          <div>
            {SERVICES.map(s => <ServiceRow key={s.num} {...s} />)}
            <div className="border-t border-[rgba(0,0,0,0.07)]" />
          </div>
        </div>
      </section>

      {/* ── Process ────────────────────────────────────────────── */}
      <section className="py-16 bg-[rgba(0,0,0,0.02)] border-y border-[rgba(0,0,0,0.06)]" aria-label="How it works">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <SectionLabel number="02" label="How It Works" className="mb-10" />
          <h2 className="text-[28px] md:text-[36px] font-medium tracking-tighter text-text-primary mb-12 max-w-lg">
            A clear process. No surprises.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            {PROCESS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <p className="text-[11px] tracking-[0.12em] uppercase text-accent/60 font-semibold mb-3">{step.num}</p>
                <h3 className="text-[20px] font-medium tracking-tight text-text-primary mb-3">{step.title}</h3>
                <p className="text-[14px] text-text-muted leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <section className="py-16 bg-background" aria-label="FAQ">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-[1fr_2fr] gap-16">
            <div>
              <SectionLabel number="03" label="FAQ" className="mb-4" />
              <h2 className="text-[28px] md:text-[34px] font-medium tracking-tighter text-text-primary leading-tight mb-4">
                Questions worth asking.
              </h2>
              <p className="text-[14px] text-text-muted leading-relaxed mb-6">
                Don't see yours? Reach out — every project starts with a conversation.
              </p>
              <a href="#start-project" className="inline-flex items-center text-[13px] font-semibold text-accent hover:text-accent-dim transition-colors">
                Contact me directly →
              </a>
            </div>
            <div>
              <FaqItem q="How much does a website cost?" a="Every project is scoped individually based on your goals, timeline, and complexity. There's no one-size-fits-all number — reach out and I'll put together a detailed proposal at no cost or obligation." />
              <FaqItem q="How long does a project take?" a="A typical project takes 3–8 weeks. Simple brochure sites: 2–3 weeks. Complex applications or e-commerce: 6–12 weeks. I give you a realistic timeline in your proposal — and I stick to it." />
              <FaqItem q="Do you work outside Boston?" a="Absolutely. While I'm Boston-based, I work with clients across the US and internationally. The entire process runs seamlessly, wherever you are." />
              <FaqItem q="What makes your SEO approach different?" a="Most designers bolt on SEO as an afterthought. I build it in from day one — semantic structure, keyword rich copy, fast load times, and schema markup. I specialize in local SEO for Boston-area businesses." />
              <FaqItem q="Will I be able to update the site myself?" a="Yes. Every project includes a CMS layer or hands-on training. You'll never be dependent on me to update a blog post or swap an image." />
            </div>
          </div>
        </div>
      </section>

      {/* ── Explore more ───────────────────────────────────────── */}
      <section className="py-12 bg-background border-t border-[rgba(0,0,0,0.08)]" aria-label="Explore more">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-wrap gap-4">
          <Link to="/portfolio" className="px-6 py-3 rounded-full border border-[rgba(0,0,0,0.12)] text-text-muted text-[14px] font-medium hover:border-accent hover:text-accent transition-colors">See the Portfolio →</Link>
          <Link to="/why-choose-me" className="px-6 py-3 rounded-full border border-[rgba(0,0,0,0.12)] text-text-muted text-[14px] font-medium hover:border-accent hover:text-accent transition-colors">Why Choose Me →</Link>
          <Link to="/case-studies" className="px-6 py-3 rounded-full border border-[rgba(0,0,0,0.12)] text-text-muted text-[14px] font-medium hover:border-accent hover:text-accent transition-colors">View Case Studies →</Link>
        </div>
      </section>

      <CTASection />
      <Footer />

      </div>{/* end desktop layout */}

    </PageWrapper>
  )
}
