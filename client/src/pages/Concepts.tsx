import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'
import Footer from '../components/layout/Footer'

const CONCEPTS = [
  {
    id: 'nexabank',
    path: '/concepts/nexabank',
    label: 'Fintech / Digital Banking',
    name: 'NexaBank',
    tagline: 'Modern digital banking built for speed, security, and scale.',
    tags: ['Web App', 'Fintech', 'Brand Identity'],
    accent: '#007aff',
    bg: 'linear-gradient(135deg, #005bc2 0%, #007aff 100%)',
    description: 'A fully designed and developed concept for a digital-first neobank. Includes hero, feature grid, product showcase, testimonials, and a complete design system built around a clean blue palette.',
  },
  {
    id: 'curated-horizon',
    path: '/concepts/curated-horizon',
    label: 'Luxury Estate Services',
    name: 'The Curated Horizon',
    tagline: 'Elite lawn care and estate maintenance for distinguished properties.',
    tags: ['Service Business', 'Luxury', 'Brand Identity'],
    accent: '#082717',
    bg: 'linear-gradient(135deg, #082717 0%, #1f3d2b 100%)',
    description: 'A full multi-page concept for a high-end lawn care and estate management service targeting high-net-worth individuals. Features editorial layouts, immersive photography, and refined typography using Noto Serif and Manrope.',
  },
  {
    id: 'coming-soon-2',
    path: null,
    label: 'Consumer Electronics',
    name: 'Coming Soon',
    tagline: 'Premium product launch site for a headphone brand.',
    tags: ['Product', 'E-Commerce', 'Branding'],
    accent: '#18181b',
    bg: 'linear-gradient(135deg, #09090b 0%, #27272a 100%)',
    description: 'The third concept will showcase a high-performance consumer electronics product launch: bold typography, cinematic visuals, and conversion-optimized UX.',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] },
  }),
}

export default function Concepts() {
  return (
    <PageWrapper
      title="Design Concepts — Designs By Terrence Adderley"
      description="Explore original web design concepts by Terrence Adderley — fully designed and developed proof-of-concept sites demonstrating design and engineering skills across industries."
      canonical="https://designsbyta.com/concepts"
    >

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <section className="bg-white pt-20 pb-16 md:pt-28 md:pb-24 px-6 lg:px-8 border-b border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#777] mb-6">
              Design Concepts
            </p>
            <h1 className="text-[clamp(36px,6vw,72px)] font-extrabold leading-[1.0] tracking-[-0.04em] text-black mb-6 max-w-3xl uppercase">
              Proof of Craft
            </h1>
            <p className="text-[17px] text-[#474747] leading-relaxed max-w-xl">
              These are original design and development concepts, not client work. Each one is a fully realized proof of skill, built from scratch to demonstrate what's possible when design meets engineering.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── DISCLAIMER BANNER ───────────────────────────────────────── */}
      <div className="bg-[#f3f3f4] border-b border-[#e5e5e5] px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-[12px] text-[#777] leading-relaxed">
            <span className="font-semibold text-black">Note:</span> All brands, names, and companies shown below are fictional design concepts created solely to demonstrate design and development capabilities. They are not real products, services, or clients.
          </p>
        </div>
      </div>

      {/* ── CONCEPTS GRID ───────────────────────────────────────────── */}
      <section className="bg-white py-20 md:py-28 px-6 lg:px-8 border-b border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto flex flex-col gap-12">
          {CONCEPTS.map(({ id, path, label, name, tagline, tags, accent, bg, description }, i) => (
            <motion.div
              key={id}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid grid-cols-1 lg:grid-cols-2 border border-[#e5e5e5] overflow-hidden"
            >
              {/* Visual panel */}
              <div
                className="relative min-h-[260px] flex items-center justify-center p-12"
                style={{ background: bg }}
              >
                <div className="text-center">
                  <p className="text-white/50 text-[11px] font-semibold tracking-[0.2em] uppercase mb-3">
                    {label}
                  </p>
                  <p
                    className="font-extrabold tracking-tighter leading-none text-white"
                    style={{ fontSize: 'clamp(40px, 5vw, 72px)' }}
                  >
                    {name}
                  </p>
                </div>
                {path && (
                  <span className="absolute top-4 right-4 text-[10px] font-bold tracking-[0.15em] uppercase bg-white/20 text-white px-3 py-1 rounded-full">
                    Live Demo
                  </span>
                )}
              </div>

              {/* Info panel */}
              <div className="p-8 md:p-12 flex flex-col justify-between gap-8 bg-white">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#777] mb-4">
                    {label}
                  </p>
                  <h2 className="text-[clamp(22px,3vw,32px)] font-bold leading-[1.15] tracking-[-0.02em] text-black mb-4">
                    {name === 'Coming Soon' ? tagline : name}
                  </h2>
                  {name !== 'Coming Soon' && (
                    <p className="text-[15px] text-[#474747] leading-relaxed mb-4">{tagline}</p>
                  )}
                  <p className="text-[14px] text-[#474747] leading-relaxed">{description}</p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <span
                        key={tag}
                        className="text-[11px] font-semibold tracking-[0.05em] uppercase px-3 py-1 border border-[#e5e5e5] text-[#474747]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {path ? (
                    <Link
                      to={path}
                      className="text-[12px] font-semibold tracking-[0.1em] uppercase px-6 py-3 text-white transition-colors"
                      style={{ background: accent }}
                    >
                      View Concept →
                    </Link>
                  ) : (
                    <span className="text-[12px] font-semibold tracking-[0.1em] uppercase px-6 py-3 border border-[#e5e5e5] text-[#aaa] cursor-not-allowed">
                      In Progress
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="bg-[#f3f3f4] py-20 md:py-28 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-[clamp(28px,4vw,52px)] font-extrabold leading-[1.0] tracking-[-0.04em] text-black mb-6 uppercase">
            Want something like this?
          </h2>
          <p className="text-[16px] text-[#474747] mb-10 max-w-md mx-auto leading-relaxed">
            These concepts show what's possible. Let's build yours, engineered from scratch, designed for results.
          </p>
          <Link
            to="/contact"
            className="inline-block bg-black text-white text-[12px] font-semibold tracking-[0.1em] uppercase px-10 py-4 hover:bg-[#222] transition-colors"
          >
            Start Your Project
          </Link>
        </div>
      </section>

      <Footer />
    </PageWrapper>
  )
}
