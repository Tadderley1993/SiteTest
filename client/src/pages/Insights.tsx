import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'
import Footer from '../components/layout/Footer'

const POSTS = [
  {
    url: 'https://blog.hubspot.com/blog/tabid/6307/bid/33924/how-to-develop-a-website-redesign-strategy-that-guarantees-results-free-template.aspx',
    source: 'HubSpot',
    date: 'HubSpot',
    category: 'Strategy',
    title: 'Why Your Website Is Costing You Business (And How to Fix It)',
    excerpt: 'Most business owners underestimate how much a slow, outdated, or poorly designed website is costing them in lost leads every single month. Here\'s how to identify the problem and what to do about it.',
    readTime: '6 min read',
  },
  {
    url: 'https://webflow.com/blog/the-web-design-process-in-7-simple-steps',
    source: 'Webflow',
    date: 'Webflow',
    category: 'Process',
    title: 'What to Expect From a Web Design Project: A Client\'s Guide',
    excerpt: 'Most people have never worked with a web designer before. Here\'s a plain-English breakdown of what the process looks like from kickoff to launch — and what good collaboration feels like.',
    readTime: '5 min read',
  },
  {
    url: 'https://blog.hubspot.com/marketing/small-business-seo',
    source: 'HubSpot',
    date: 'HubSpot',
    category: 'SEO',
    title: 'SEO Basics Every Business Owner Should Know in 2025',
    excerpt: 'You don\'t need to become an SEO expert. But understanding these fundamentals will help you make better decisions about your website, content, and marketing budget.',
    readTime: '7 min read',
  },
  {
    url: 'https://blog.hubspot.com/website/website-design-cost',
    source: 'HubSpot',
    date: 'HubSpot',
    category: 'Strategy',
    title: 'The Real Cost of a Cheap Website',
    excerpt: 'A $500 website might seem like a deal — until you factor in lost conversions, security vulnerabilities, and the rebrand you\'ll need in 18 months. Here\'s how to think about your web investment.',
    readTime: '5 min read',
  },
  {
    url: 'https://blog.hubspot.com/marketing/page-load-time-conversion-rates',
    source: 'HubSpot',
    date: 'HubSpot',
    category: 'Performance',
    title: 'How Page Speed Directly Affects Your Revenue',
    excerpt: 'Every second of load time costs you 7% in conversions. If you\'re running ads, paying for SEO, or trying to grow organically — a slow site is sabotaging all of it.',
    readTime: '4 min read',
  },
  {
    url: 'https://99designs.com/blog/tips/branding-brand-identity-logo/',
    source: '99designs',
    date: '99designs',
    category: 'Branding',
    title: 'Brand Identity vs. Logo Design: What\'s the Difference?',
    excerpt: 'A logo is a mark. A brand identity is a system. Understanding the difference helps you invest your budget where it will have the most impact on how people perceive your business.',
    readTime: '5 min read',
  },
]

const CATEGORIES = ['All', 'Strategy', 'Process', 'SEO', 'Performance', 'Branding']

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] },
  }),
}

export default function Insights() {
  return (
    <PageWrapper
      title="Insights — Web Design, SEO & Strategy — Terrence Adderley"
      description="Articles on web design, SEO, branding, and digital strategy. Practical insights for business owners who want to understand how to win online."
      canonical="https://designsbyta.com/insights"
    >

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="bg-white pt-20 pb-16 md:pt-28 md:pb-24 px-6 lg:px-8 border-b border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#777] mb-6">Insights</p>
            <h1 className="text-[clamp(36px,6vw,80px)] font-extrabold leading-[1.0] tracking-[-0.04em] text-black mb-6 max-w-3xl uppercase">
              Straight Talk on Design, SEO & Strategy.
            </h1>
            <p className="text-[17px] text-[#474747] leading-relaxed max-w-xl">
              Practical articles for business owners who want to understand how to compete and win online — no jargon, no fluff.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── CATEGORY FILTER ──────────────────────────────────────── */}
      <div className="bg-white border-b border-[#e5e5e5] px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              className={`px-4 py-1.5 text-[12px] font-semibold tracking-[0.05em] uppercase transition-all ${
                cat === 'All'
                  ? 'bg-black text-white'
                  : 'border border-[#e5e5e5] text-[#474747] hover:border-black hover:text-black'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── FEATURED POST ────────────────────────────────────────── */}
      <section className="bg-[#f3f3f4] py-16 md:py-20 px-6 lg:px-8 border-b border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto">
          <motion.a
            href={POSTS[0].url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white p-8 md:p-12 group hover:bg-black transition-colors duration-300 block"
          >
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#777] group-hover:text-white/50 transition-colors">{POSTS[0].category}</span>
                  <span className="w-1 h-1 bg-[#c6c6c6] rounded-full" />
                  <span className="text-[10px] text-[#777] group-hover:text-white/40 transition-colors">{POSTS[0].source}</span>
                  <span className="w-1 h-1 bg-[#c6c6c6] rounded-full" />
                  <span className="text-[10px] text-[#777] group-hover:text-white/40 transition-colors">{POSTS[0].readTime}</span>
                </div>
                <h2 className="text-[clamp(22px,3vw,36px)] font-bold leading-[1.2] tracking-[-0.02em] text-black group-hover:text-white transition-colors mb-4">
                  {POSTS[0].title}
                </h2>
                <p className="text-[15px] text-[#474747] group-hover:text-white/60 transition-colors leading-relaxed">
                  {POSTS[0].excerpt}
                </p>
              </div>
              <div className="mt-8">
                <span className="text-[13px] font-semibold text-black group-hover:text-white transition-colors border-b border-black group-hover:border-white pb-0.5">
                  Read on {POSTS[0].source} →
                </span>
              </div>
            </div>
            <div className="bg-[#e5e5e5] group-hover:bg-white/10 transition-colors h-48 lg:h-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-[64px] text-[#c6c6c6] group-hover:text-white/20 transition-colors">article</span>
            </div>
          </motion.a>
        </div>
      </section>

      {/* ── POSTS GRID ───────────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-20 px-6 lg:px-8 border-b border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#e5e5e5]">
            {POSTS.slice(1).map(({ url, source, category, title, excerpt, readTime }, i) => (
              <motion.a
                key={title}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="bg-white p-7 group hover:bg-black transition-colors duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#777] group-hover:text-white/50 transition-colors">{category}</span>
                    <span className="w-1 h-1 bg-[#c6c6c6] rounded-full shrink-0" />
                    <span className="text-[10px] text-[#777] group-hover:text-white/40 transition-colors">{source}</span>
                  </div>
                  <h2 className="text-[17px] font-bold leading-[1.3] text-black group-hover:text-white transition-colors mb-3">{title}</h2>
                  <p className="text-[13px] text-[#474747] group-hover:text-white/60 transition-colors leading-relaxed">{excerpt}</p>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-[11px] text-[#777] group-hover:text-white/40 transition-colors">{readTime}</span>
                  <span className="text-[12px] font-semibold text-black group-hover:text-white transition-colors">Read →</span>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="bg-[#f3f3f4] py-16 md:py-20 px-6 lg:px-8 border-b border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <h2 className="text-[clamp(22px,3vw,36px)] font-bold leading-[1.1] tracking-[-0.03em] text-black mb-2">
              Ready to put this into action?
            </h2>
            <p className="text-[15px] text-[#474747]">Let's build a site that actually performs.</p>
          </div>
          <Link
            to="/contact"
            className="shrink-0 bg-black text-white text-[12px] font-semibold tracking-[0.1em] uppercase px-8 py-4 hover:bg-[#222] transition-colors"
          >
            Book a Free Consultation
          </Link>
        </div>
      </section>

      <Footer />
    </PageWrapper>
  )
}
