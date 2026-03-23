import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'

import CTASection from '../components/layout/CTASection'
import Footer from '../components/layout/Footer'
import SectionLabel from '../components/layout/SectionLabel'

type FilterType = 'All' | 'Branding' | 'Web App' | 'E-Commerce'

const PROJECTS = [
  {
    name: 'NexaBank',
    category: 'Web App' as FilterType,
    tags: ['Fintech', 'Web App', 'React'],
    desc: 'A modern digital banking platform with real-time transaction feeds, account management, and a clean onboarding flow.',
    color: '#1D6AFF',
    demoUrl: '/demo/fintech',
    highlights: ['Real-time data UI', 'Secure auth flow', 'Mobile-first'],
  },
  {
    name: 'Chez Laurent',
    category: 'Branding' as FilterType,
    tags: ['Restaurant', 'Branding', 'Web Design'],
    desc: 'Fine dining brand identity and website — elegant typography, reservation system, and a menu that makes you hungry.',
    color: '#C9A84C',
    demoUrl: '/demo/restaurant',
    highlights: ['Custom brand identity', 'Reservation integration', 'Menu CMS'],
  },
  {
    name: 'Apex Audio',
    category: 'E-Commerce' as FilterType,
    tags: ['E-Commerce', 'Consumer Electronics', 'Shopify'],
    desc: 'Premium audio equipment store — product showcase, immersive product pages, and a checkout optimized for conversion.',
    color: '#0099AA',
    demoUrl: '/demo/product',
    highlights: ['Product 3D viewer', 'Optimized checkout', 'Inventory sync'],
  },
]

const FILTERS: FilterType[] = ['All', 'Branding', 'Web App', 'E-Commerce']

function ProjectCard({ project }: { project: typeof PROJECTS[0] }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[rgba(0,0,0,0.02)] overflow-hidden"
    >
      <div className="h-1.5 w-full" style={{ backgroundColor: project.color }} />
      <div className="p-7">
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tags.map(t => (
            <span key={t} className="px-2.5 py-1 rounded-full text-[11px] font-medium border"
              style={{ color: project.color, borderColor: `${project.color}40`, backgroundColor: `${project.color}10` }}>
              {t}
            </span>
          ))}
        </div>
        <h3 className="text-[22px] font-bold text-text-primary mb-3">{project.name}</h3>
        <p className="text-[14px] text-text-muted leading-relaxed mb-5">{project.desc}</p>
        <ul className="flex flex-col gap-1.5 mb-6">
          {project.highlights.map(h => (
            <li key={h} className="flex items-center gap-2 text-[13px] text-text-muted">
              <span style={{ color: project.color }} className="text-[10px]">▸</span>
              {h}
            </li>
          ))}
        </ul>
        <Link to={project.demoUrl} className="inline-flex items-center gap-1 text-[14px] font-semibold transition-colors" style={{ color: project.color }}>
          View Demo →
        </Link>
      </div>
    </motion.div>
  )
}

export default function Portfolio() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('All')
  const filtered = PROJECTS.filter(p => activeFilter === 'All' || p.category === activeFilter)

  return (
    <PageWrapper
      title="Web Design Portfolio — Designs By TA Boston"
      description="View Designs By TA's web design portfolio. NexaBank, Chez Laurent, Apex Audio — real projects with real results from our Boston MA design studio."
      canonical="https://designsbyta.com/portfolio"
    >
      {/* ── MOBILE layout ─────────────────────────────────────────── */}
      <div className="md:hidden bg-background">

        {/* Hero */}
        <section className="pt-8 pb-14 px-6">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#735c00] block mb-4">Portfolio</span>
          <h1 className="font-serif italic text-[2.75rem] leading-[1.1] tracking-tight text-text-primary mb-5">
            Work that speaks<br /><span className="text-accent">for itself.</span>
          </h1>
          <p className="text-[#4c4637] text-base leading-relaxed">
            A curated selection spanning fintech, hospitality, and electronics — each built to perform, not just impress.
          </p>
        </section>

        {/* Filter */}
        <div className="px-6 pb-8 flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-1.5 text-[12px] font-medium transition-all ${
                activeFilter === f
                  ? 'bg-accent text-[#1C1917]'
                  : 'border border-[rgba(0,0,0,0.12)] text-text-muted hover:border-accent hover:text-accent'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Editorial project grid */}
        <section className="px-6 pb-16 flex flex-col gap-16">
          {filtered.map((project, i) => (
            <article key={project.name} className={`group ${i % 2 === 1 ? 'pl-6' : ''}`}>
              <div className="aspect-[4/5] overflow-hidden bg-[#ece8e0] mb-5">
                <img
                  src={
                    project.name === 'NexaBank' ? '/imgs/nexa-hero.png'
                    : project.name === 'Chez Laurent' ? '/imgs/restaurant-hero-main.png'
                    : '/imgs/apex-hero.png'
                  }
                  alt={project.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-[10px] uppercase tracking-widest text-text-muted">{project.tags[0]} &amp; {project.tags[1]}</span>
                <span className="font-serif italic text-[#C6A84B] text-sm">0{i + 1}</span>
              </div>
              <h3 className="font-serif italic text-2xl tracking-tight text-text-primary mb-2">{project.name}</h3>
              <p className="text-text-muted text-sm leading-relaxed mb-4">{project.desc}</p>
              <Link
                to={project.demoUrl}
                className="inline-flex items-center gap-1.5 text-[#735c00] font-serif italic text-base border-b border-[rgba(198,168,75,0.4)] pb-0.5 hover:opacity-70 transition-opacity"
              >
                View Demo
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
              </Link>
            </article>
          ))}
        </section>

        {/* CTA */}
        <section className="bg-[#1C1917] py-16 px-6 text-center">
          <h2 className="font-serif italic text-3xl text-[#F5F0E8] mb-6">Start a Commission</h2>
          <a href="#start-project" className="inline-block bg-accent text-[#1C1917] px-10 py-4 font-bold text-xs tracking-widest uppercase hover:bg-accent-dim transition-colors">
            Book a Consultation
          </a>
        </section>

      </div>

      {/* ── DESKTOP layout ─────────────────────────────────────────── */}
      <div className="hidden md:block">


      <section className="relative pt-28 pb-14 px-6 lg:px-8 bg-background overflow-hidden" aria-label="Portfolio hero">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(198,168,75,0.06)] via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <SectionLabel label="Portfolio" className="mb-6" />
            <h1 className="text-h1 font-medium tracking-tighter text-text-primary mb-6 max-w-2xl">
              Work that speaks<br /><span className="text-accent">for itself.</span>
            </h1>
            <p className="text-[18px] text-text-muted max-w-xl leading-relaxed">
              A curated selection of projects spanning fintech, hospitality, and consumer electronics — each built to perform, not just impress.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-background border-t border-[rgba(0,0,0,0.08)]" aria-label="Projects">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-wrap gap-2 mb-12" role="group" aria-label="Filter projects">
            {FILTERS.map(f => (
              <button key={f} type="button" onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all ${activeFilter === f ? 'bg-accent text-[#1C1917]' : 'border border-[rgba(0,0,0,0.12)] text-text-muted hover:border-accent hover:text-accent'}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(p => <ProjectCard key={p.name} project={p} />)}
          </div>
        </div>
      </section>

      <section className="py-16 bg-background border-t border-[rgba(0,0,0,0.08)]" aria-label="Explore more">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-wrap gap-4">
          <Link to="/case-studies" className="px-6 py-3 rounded-full border border-[rgba(0,0,0,0.12)] text-text-muted text-[14px] font-medium hover:border-accent hover:text-accent transition-colors">See Case Studies with Results →</Link>
          <Link to="/services" className="px-6 py-3 rounded-full border border-[rgba(0,0,0,0.12)] text-text-muted text-[14px] font-medium hover:border-accent hover:text-accent transition-colors">View All Services →</Link>
        </div>
      </section>

      <CTASection />
      <Footer />

      </div>{/* end desktop layout */}

    </PageWrapper>
  )
}
