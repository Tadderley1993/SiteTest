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
    </PageWrapper>
  )
}
