import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'
import CTASection from '../components/layout/CTASection'
import Footer from '../components/layout/Footer'
import SectionLabel from '../components/layout/SectionLabel'

// ── Data ─────────────────────────────────────────────────────────────

const STATS = [
  {
    stat: '81%',
    label: 'of consumers research a business online before buying or visiting.',
    source: 'Think with Google',
    url: 'https://www.thinkwithgoogle.com/consumer-insights/consumer-trends/shopping-research-before-purchase-statistics/',
  },
  {
    stat: '50ms',
    label: 'is all it takes for a visitor to form a first impression of your website.',
    source: 'Carleton University, Behaviour & Information Technology',
    url: 'https://www.tandfonline.com/doi/abs/10.1080/01449290500330448',
  },
  {
    stat: '46%',
    label: 'of consumers judge a business\'s credibility based on website design alone.',
    source: 'Stanford Web Credibility Project',
    url: 'https://credibility.stanford.edu/',
  },
  {
    stat: '91.5%',
    label: 'of Google searchers never click past the first page of results.',
    source: 'Backlinko / Reputation911',
    url: 'https://backlinko.com/local-seo-stats',
  },
  {
    stat: '80%',
    label: 'of US consumers search for local businesses online every week.',
    source: 'SOCi Consumer Behavior Index via BrightLocal',
    url: 'https://www.brightlocal.com/resources/local-seo-statistics/',
  },
  {
    stat: '+23%',
    label: 'average revenue lift for businesses with consistent, professional branding.',
    source: 'Renderforest Branding Statistics',
    url: 'https://www.renderforest.com/blog/brand-statistics',
  },
]

const ARTICLES = [
  {
    num: '01',
    tag: 'Digital Footprint',
    title: 'What is a digital footprint — and why does yours matter?',
    body: [
      'Your digital footprint is everything a potential customer finds when they search for your business online: your website, your Google Business profile, your social presence, reviews, mentions, and the absence of any of those things.',
      'Think of it as your business\'s reputation on the internet — active or not, it exists. The question is whether you\'re shaping it or ignoring it.',
      '81% of consumers research a business online before they ever visit or spend money. That means for the overwhelming majority of your potential customers, your digital presence isn\'t a nice-to-have. It\'s the first — and sometimes only — impression you get to make.',
    ],
    cta: null,
    source: null,
  },
  {
    num: '02',
    tag: 'First Impressions',
    title: 'You have 50 milliseconds. Make them count.',
    body: [
      'A 2006 Carleton University study published in Behaviour & Information Technology found that users form a visual opinion of a website in as little as 50 milliseconds — that\'s 20 times faster than a blink.',
      'In that fraction of a second, before a single word is read, a visitor has already made a judgment. Does this business look trustworthy? Does it look like they know what they\'re doing? Or does it feel cheap, cluttered, and forgettable?',
      'Stanford\'s Web Credibility Project reinforced this further — 46.1% of consumers cite visual design as the primary factor in deciding whether to trust a site. Not the content. Not the reviews. The design.',
    ],
    cta: null,
    source: {
      label: 'Stanford Web Credibility Project',
      url: 'https://credibility.stanford.edu/',
    },
  },
  {
    num: '03',
    tag: 'SEO & Visibility',
    title: 'If you\'re not on page one of Google, you\'re effectively invisible.',
    body: [
      '91.5% of people never scroll past the first page of Google results. The second page receives less than 1% of all clicks. Ranking position isn\'t just about pride — it\'s about whether customers can find you at all.',
      'Local search makes this even more urgent. 80% of US consumers use search engines to find local businesses every single week. 72% specifically use Google. If your business doesn\'t appear for relevant searches in your area, that traffic — and those customers — are going to whoever does.',
      'SEO isn\'t magic, and it isn\'t instant. But it\'s one of the highest ROI investments a business can make in its digital presence — and it starts with a well built website.',
    ],
    cta: null,
    source: {
      label: 'BrightLocal Local SEO Statistics',
      url: 'https://www.brightlocal.com/resources/local-seo-statistics/',
    },
  },
  {
    num: '04',
    tag: 'Professional vs. DIY',
    title: 'The real cost of building your own website.',
    body: [
      'Website builders like Wix, Squarespace, and GoDaddy have made it easier than ever to put something online. And for a personal blog or an early stage experiment, that\'s fine. But for a business trying to compete and convert — the gap between DIY and professional is significant.',
      'Professionally designed websites convert at 3–5% on average. DIY sites typically land at 1–2%. That difference compounds fast. On 1,000 monthly visitors, that\'s the difference between 10 and 50 customers a month — from the same traffic.',
      'Beyond conversion rate, there\'s the credibility factor. A site that looks dated or template heavy tells visitors — often subconsciously — that the business behind it cut corners. In a competitive market, that\'s an unforced error you can\'t afford.',
    ],
    cta: null,
    source: {
      label: 'Wildman Web — DIY vs. Professional Design',
      url: 'https://wildmanweb.com/diy-website-vs-professional-development-the-true-cost-comparison/',
    },
  },
  {
    num: '05',
    tag: 'Performance & Speed',
    title: 'Slow websites don\'t just frustrate users — they lose them.',
    body: [
      'Google\'s own research found that the probability of a user bouncing increases by 32% when load time goes from 1 to 3 seconds — and by 106% if it reaches 6 seconds. More than half of mobile users abandon a site that takes longer than 3 seconds to load.',
      'For e-commerce, the numbers are starker: a site that loads in 1 second converts at 2.5× the rate of a site that loads in 5 seconds. Every added second costs you real revenue.',
      'Speed isn\'t just a technical concern — it\'s a business decision. A professionally built site is architected for performance from the start: optimized assets, clean code, proper caching, and a hosting stack that doesn\'t bottleneck at the wrong moment.',
    ],
    cta: null,
    source: {
      label: 'WP Rocket — Website Load Time & Speed Statistics',
      url: 'https://wp-rocket.me/blog/website-load-time-speed-statistics/',
    },
  },
  {
    num: '06',
    tag: 'Branding',
    title: 'Consistency isn\'t just aesthetic — it\'s strategic.',
    body: [
      'Brands presented consistently across all touchpoints are 3–4× more likely to achieve strong visibility. Consistent use of a signature color alone can boost brand recognition by up to 80%. And 81% of consumers say they need to trust a brand before they\'ll consider buying from it.',
      'Trust is built through repetition. Every time someone encounters your brand — your website, your business card, your social profile, your email signature — they\'re either reinforcing a coherent identity or getting a mixed signal that erodes confidence.',
      'Professional brand identity work isn\'t a luxury. It\'s the foundation that everything else compounds on top of. Get it right once, and it pays dividends every time someone encounters your business.',
    ],
    cta: null,
    source: {
      label: 'Renderforest — Branding Statistics 2024',
      url: 'https://www.renderforest.com/blog/brand-statistics',
    },
  },
]

// ── Components ───────────────────────────────────────────────────────

function StatCard({ stat, label, source, url }: typeof STATS[0]) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="p-6 rounded-2xl border border-[rgba(198,168,75,0.2)] bg-[rgba(198,168,75,0.04)]"
    >
      <p className="text-[42px] font-black tracking-tighter text-accent leading-none mb-3">{stat}</p>
      <p className="text-[14px] text-text-primary leading-relaxed mb-4">{label}</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] tracking-[0.08em] uppercase text-text-muted hover:text-accent transition-colors font-medium"
      >
        Source: {source} ↗
      </a>
    </motion.div>
  )
}

function Article({ num, tag, title, body, source }: typeof ARTICLES[0]) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6 }}
      className="grid md:grid-cols-[80px_1fr] gap-6 py-12 border-t border-[rgba(0,0,0,0.07)]"
    >
      <div className="hidden md:flex flex-col items-center justify-start gap-4 pt-1">
        <span className="text-[12px] font-semibold tracking-[0.1em] text-accent/60">{num}</span>
        <span
          className="text-[10px] font-semibold tracking-[0.12em] uppercase text-text-muted"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          {tag}
        </span>
      </div>
      {/* Mobile: show tag inline, no rotation */}
      <div className="flex md:hidden items-center gap-3">
        <span className="text-[12px] font-semibold tracking-[0.1em] text-accent/60">{num}</span>
        <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-text-muted">{tag}</span>
      </div>
      <div>
        <h3 className="text-[22px] md:text-[26px] font-medium tracking-tighter text-text-primary leading-snug mb-6">
          {title}
        </h3>
        <div className="flex flex-col gap-4">
          {body.map((p, i) => (
            <p key={i} className="text-[15px] text-text-muted leading-[1.75]">{p}</p>
          ))}
        </div>
        {source && (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-6 text-[12px] tracking-[0.07em] uppercase text-text-muted hover:text-accent transition-colors font-semibold"
          >
            {source.label} ↗
          </a>
        )}
      </div>
    </motion.article>
  )
}

// ── Page ─────────────────────────────────────────────────────────────
export default function CaseStudies() {
  return (
    <PageWrapper
      title="Why Your Digital Presence Matters — Designs By TA"
      description="Research-backed articles on digital footprints, web design credibility, SEO, branding, and why professional web design outperforms DIY."
      canonical="https://designsbyta.com/case-studies"
    >
      {/* ── MOBILE layout ─────────────────────────────────────────── */}
      <div className="md:hidden bg-background">

        {/* Hero */}
        <section className="pt-8 pb-14 px-6">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#735c00] block mb-4">Digital Footprint</span>
          <h1 className="font-serif italic text-[2.5rem] leading-[1.1] tracking-tight text-text-primary mb-5">
            Why your online presence is your most valuable asset.
          </h1>
          <p className="text-[#4c4637] text-base leading-relaxed">
            Research-backed reading on what a digital footprint is, why it matters, and what separates a website that wins business from one that loses it.
          </p>
        </section>

        {/* Stats grid */}
        <section className="bg-[#f8f3eb] py-12 px-6">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#735c00] block mb-8">By The Numbers</span>
          <div className="grid grid-cols-2 gap-4">
            {STATS.map(s => (
              <div key={s.stat} className="p-4 border border-[rgba(198,168,75,0.2)] bg-white">
                <p className="text-3xl font-black tracking-tighter text-accent leading-none mb-2">{s.stat}</p>
                <p className="text-[12px] text-text-primary leading-snug mb-2">{s.label}</p>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest text-text-muted hover:text-accent transition-colors font-medium">
                  {s.source} ↗
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Articles */}
        <section className="px-6 py-12">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#735c00] block mb-8">The Research</span>
          <div className="flex flex-col divide-y divide-[rgba(0,0,0,0.07)]">
            {ARTICLES.map(({ num, tag, title, body, source }) => (
              <div key={num} className="py-10">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[11px] font-semibold tracking-[0.1em] text-accent/60">{num}</span>
                  <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-text-muted">{tag}</span>
                </div>
                <h3 className="font-serif italic text-xl tracking-tight text-text-primary leading-snug mb-4">{title}</h3>
                <p className="text-text-muted text-sm leading-[1.75]">{body[0]}</p>
                {source && (
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-4 text-[11px] uppercase tracking-widest text-text-muted hover:text-accent font-semibold transition-colors">
                    {source.label} ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#1C1917] py-16 px-8">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#735c00] block mb-4">What This Means For You</span>
          <h2 className="font-serif italic text-2xl text-[#F5F0E8] mb-4 leading-snug">The data is clear. The question is what you do with it.</h2>
          <p className="text-[#78706A] text-sm leading-relaxed mb-8">Every one of these statistics represents a real opportunity — or a real risk, depending on where your business stands today.</p>
          <a href="#start-project" className="inline-block bg-accent text-[#1C1917] px-8 py-4 font-bold text-xs tracking-widest uppercase hover:bg-accent-dim transition-colors">
            Start the Conversation
          </a>
        </section>

      </div>

      {/* ── DESKTOP layout ─────────────────────────────────────────── */}
      <div className="hidden md:block">

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-14 px-6 lg:px-8 bg-background overflow-hidden" aria-label="Page hero">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(198,168,75,0.06)] via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <SectionLabel label="Digital Footprint" className="mb-6" />
            <h1 className="text-h1 font-medium tracking-tighter text-text-primary mb-6 max-w-3xl">
              Why your online presence<br /><span className="text-accent">is your business's most valuable asset.</span>
            </h1>
            <p className="text-[18px] text-text-muted max-w-xl leading-relaxed">
              Research-backed reading on what a digital footprint is, why it matters, and what separates a website that wins business from one that loses it.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Stats strip ────────────────────────────────────────── */}
      <section className="py-16 bg-background border-t border-[rgba(0,0,0,0.07)]" aria-label="Key statistics">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <SectionLabel number="01" label="By The Numbers" className="mb-10" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {STATS.map(s => <StatCard key={s.stat} {...s} />)}
          </div>
        </div>
      </section>

      {/* ── Articles ───────────────────────────────────────────── */}
      <section className="py-4 bg-background border-t border-[rgba(0,0,0,0.07)]" aria-label="Articles">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-end justify-between pt-12 pb-2">
            <SectionLabel number="02" label="The Research" />
            <p className="text-[12px] text-text-muted mb-1 hidden md:block">Sources cited throughout — click to verify</p>
          </div>
          {ARTICLES.map(a => <Article key={a.num} {...a} />)}
          <div className="border-t border-[rgba(0,0,0,0.07)]" />
        </div>
      </section>

      {/* ── Bottom CTA ─────────────────────────────────────────── */}
      <section className="py-16 bg-[rgba(0,0,0,0.02)] border-y border-[rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl">
            <SectionLabel number="03" label="What This Means For You" className="mb-5" />
            <h2 className="text-[28px] md:text-[36px] font-medium tracking-tighter text-text-primary mb-5 leading-tight">
              The data is clear. The question is what you do with it.
            </h2>
            <p className="text-[16px] text-text-muted leading-relaxed mb-8">
              Every one of these statistics represents a real opportunity — or a real risk, depending on where your business stands today. If your website isn't working as hard as you are, let's fix that.
            </p>
            <a
              href="#start-project"
              className="inline-flex items-center px-7 py-3.5 rounded-full bg-accent text-[#1C1917] text-[14px] font-semibold tracking-[0.03em] hover:bg-accent-dim transition-colors"
            >
              Start the conversation
            </a>
          </div>
        </div>
      </section>

      {/* ── Explore more ───────────────────────────────────────── */}
      <section className="py-12 bg-background border-t border-[rgba(0,0,0,0.08)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-wrap gap-4">
          <Link to="/services" className="px-6 py-3 rounded-full border border-[rgba(0,0,0,0.12)] text-text-muted text-[14px] font-medium hover:border-accent hover:text-accent transition-colors">View All Services →</Link>
          <Link to="/portfolio" className="px-6 py-3 rounded-full border border-[rgba(0,0,0,0.12)] text-text-muted text-[14px] font-medium hover:border-accent hover:text-accent transition-colors">See the Portfolio →</Link>
          <Link to="/why-choose-me" className="px-6 py-3 rounded-full border border-[rgba(0,0,0,0.12)] text-text-muted text-[14px] font-medium hover:border-accent hover:text-accent transition-colors">Why Choose Me →</Link>
        </div>
      </section>

      <CTASection />
      <Footer />

      </div>{/* end desktop layout */}

    </PageWrapper>
  )
}
