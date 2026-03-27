import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'
import Footer from '../components/layout/Footer'

const PROBLEMS = [
  { n: '01', title: 'Invisible online', desc: 'Competitors are showing up in search results while your business stays buried on page three.' },
  { n: '02', title: 'Low conversion rate', desc: 'Visitors come to your site and leave without taking action. Your site isn\'t turning traffic into revenue.' },
  { n: '03', title: 'Outdated design', desc: 'A site that looks old signals a business that doesn\'t care. First impressions cost you clients every day.' },
  { n: '04', title: 'Slow page speeds', desc: 'Every extra second of load time costs you 7% in conversions. Your site may be silently driving customers away.' },
]

const SERVICES_LIST = [
  {
    icon: 'brush',
    title: 'Brand Identity',
    desc: 'A cohesive visual system that communicates who you are before a single word is read: logo, color, typography, and more.',
  },
  {
    icon: 'code',
    title: 'Web Development',
    desc: 'Fast, accessible, SEO-ready websites built with modern tech. No templates. Engineered from scratch for your goals.',
  },
  {
    icon: 'trending_up',
    title: 'Growth Strategy',
    desc: 'Analytics, SEO, and conversion optimization to turn your website into a lead generation machine.',
  },
]

const PROCESS_STEPS = [
  { n: '01', title: 'Discovery', desc: 'We dig into your goals, competitors, and audience to define a strategy that wins.' },
  { n: '02', title: 'Design', desc: 'Every screen designed with purpose, pixel-perfect before a line of code is written.' },
  { n: '03', title: 'Build', desc: 'Clean, performant code. Fast load times, mobile-first, built to scale.' },
  { n: '04', title: 'Launch', desc: 'Deployment, SEO setup, analytics. Go live ready to compete from day one.' },
]

const TESTIMONIALS = [
  {
    quote: 'Speed is everything. A one-second delay in page load time can reduce conversions by 7%. Performance isn\'t optional — it\'s a revenue strategy.',
    name: 'Neil Patel',
    role: 'Co-Founder, NP Digital',
  },
  {
    quote: 'Design is not just what it looks like and feels like. Design is how it works.',
    name: 'Steve Jobs',
    role: 'Co-Founder, Apple',
  },
  {
    quote: 'Your website is your best salesperson. It works 24/7, never calls in sick, and reaches every potential customer at once.',
    name: 'Marcus Sheridan',
    role: 'Author, They Ask You Answer',
  },
  {
    quote: 'In the world of internet customer service, it\'s important to remember your competitor is only one mouse click away.',
    name: 'Doug Warner',
    role: 'Former CEO, J.P. Morgan',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] },
  }),
}

export default function Home() {
  return (
    <PageWrapper
      title="Terrence Adderley — Web Designer & Developer, Boston MA"
      description="Boston-based freelance web designer building high-performance websites, brand identities, and digital experiences that drive real business results."
      canonical="https://designsbyta.com/"
    >

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="bg-white pt-20 pb-16 md:pt-28 md:pb-24 px-6 lg:px-8 border-b border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#777] mb-6">
              Boston, MA
            </p>
            <h1 className="text-[clamp(38px,7vw,88px)] font-extrabold leading-[1.0] tracking-[-0.04em] text-black mb-6 max-w-4xl uppercase">
              Websites That Work As Hard As You Do
            </h1>
            <p className="text-[17px] text-[#474747] leading-relaxed max-w-xl mb-10">
              Award-winning design. Engineering precision. Business results. I build websites that don't just look good. They convert visitors into clients.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap gap-3"
          >
            <Link
              to="/contact"
              className="bg-black text-white text-[12px] font-semibold tracking-[0.1em] uppercase px-7 py-4 hover:bg-[#222] transition-colors"
            >
              Start Your Project
            </Link>
            <Link
              to="/services"
              className="border border-black text-black text-[12px] font-semibold tracking-[0.1em] uppercase px-7 py-4 hover:bg-black hover:text-white transition-all"
            >
              View Services
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── HERO IMAGE ───────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden border-b border-[#e5e5e5]" style={{ height: 'clamp(200px, 45vw, 640px)' }}>
        <img
          src="/imgs/hero-desk.png"
          alt="Terrence Adderley — Web Design Studio Boston MA"
          className="w-full h-full object-cover grayscale scale-105"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-white font-black uppercase tracking-[0.15em] text-center" style={{ fontSize: 'clamp(18px, 3.5vw, 56px)' }}>
            Engineered to Innovate
          </p>
        </div>
      </div>

      {/* ── PROBLEM SECTION ──────────────────────────────────────── */}
      <section className="bg-[#f3f3f4] py-20 md:py-28 px-6 lg:px-8 border-b border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#777] mb-5">The Problem</p>
              <h2 className="text-[clamp(28px,4vw,48px)] font-bold leading-[1.1] tracking-[-0.03em] text-black">
                Your website is costing you business right now.
              </h2>
            </div>
            <div className="flex flex-col gap-8">
              {PROBLEMS.map(({ n, title, desc }, i) => (
                <motion.div
                  key={n}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  className="flex gap-6 items-start"
                >
                  <span className="text-[11px] font-bold tracking-[0.1em] text-[#c6c6c6] pt-0.5 shrink-0 w-6">{n}</span>
                  <div>
                    <h3 className="text-[15px] font-semibold text-black mb-1">{title}</h3>
                    <p className="text-[14px] text-[#474747] leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SOLUTIONS ────────────────────────────────────────────── */}
      <section className="bg-white py-20 md:py-28 px-6 lg:px-8 border-b border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#777] mb-5">What I Do</p>
          <h2 className="text-[clamp(28px,4vw,48px)] font-bold leading-[1.1] tracking-[-0.03em] text-black mb-14 max-w-lg">
            End-to-end solutions for ambitious businesses.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 border border-[#e5e5e5]">
            {SERVICES_LIST.map(({ icon, title, desc }, i) => (
              <motion.div
                key={title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="group p-8 md:border-r border-b md:border-b-0 border-[#e5e5e5] last:border-r-0 last:border-b-0 hover:bg-black transition-colors duration-300 cursor-default"
              >
                <span className="material-symbols-outlined text-[26px] text-black group-hover:text-white transition-colors mb-6 block">
                  {icon}
                </span>
                <h3 className="text-[17px] font-bold text-black group-hover:text-white transition-colors mb-3">{title}</h3>
                <p className="text-[14px] text-[#474747] group-hover:text-white/70 transition-colors leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-8">
            <Link
              to="/services"
              className="text-[13px] font-semibold tracking-[0.04em] text-black border-b border-black pb-0.5 hover:opacity-50 transition-opacity"
            >
              View All Services →
            </Link>
          </div>
        </div>
      </section>

      {/* ── PROCESS ──────────────────────────────────────────────── */}
      <section className="bg-black py-20 md:py-28 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/40 mb-5">How It Works</p>
          <h2 className="text-[clamp(28px,4vw,48px)] font-bold leading-[1.1] tracking-[-0.03em] text-white mb-14 max-w-lg">
            A proven process from brief to launch.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-white/10">
            {PROCESS_STEPS.map(({ n, title, desc }, i) => (
              <motion.div
                key={n}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="p-8 border-r border-b lg:border-b-0 border-white/10 last:border-r-0"
              >
                <span className="text-[11px] font-bold tracking-[0.1em] text-white/25 block mb-6">{n}</span>
                <h3 className="text-[16px] font-bold text-white mb-3">{title}</h3>
                <p className="text-[13px] text-white/50 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────── */}
      <section className="bg-white py-20 md:py-28 px-6 lg:px-8 border-b border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#777] mb-5">Why It Matters</p>
          <h2 className="text-[clamp(28px,4vw,48px)] font-bold leading-[1.1] tracking-[-0.03em] text-black mb-14 max-w-lg">
            What the world's sharpest minds say about optimization.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#e5e5e5]">
            {TESTIMONIALS.map(({ quote, name, role }, i) => (
              <motion.div
                key={name}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="bg-[#f3f3f4] p-8 md:p-10 flex flex-col justify-between gap-8"
              >
                <p className="text-[18px] md:text-[20px] font-medium text-black leading-[1.5]">"{quote}"</p>
                <div>
                  <p className="text-[14px] font-bold text-black">{name}</p>
                  <p className="text-[13px] text-[#777]">{role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────── */}
      <section className="bg-[#f3f3f4] py-20 md:py-28 px-6 lg:px-8 border-b border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-[clamp(32px,5vw,64px)] font-extrabold leading-[1.0] tracking-[-0.04em] text-black mb-6 uppercase">
            Ready to build something great?
          </h2>
          <p className="text-[16px] text-[#474747] mb-10 max-w-md mx-auto leading-relaxed">
            Tell me about your project. I'll respond within 24 hours with a clear plan and honest pricing.
          </p>
          <Link
            to="/contact"
            className="inline-block bg-black text-white text-[12px] font-semibold tracking-[0.1em] uppercase px-10 py-4 hover:bg-[#222] transition-colors"
          >
            Start the Conversation
          </Link>
        </div>
      </section>

      <Footer />
    </PageWrapper>
  )
}
