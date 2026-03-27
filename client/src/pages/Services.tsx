import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'
import Footer from '../components/layout/Footer'

const SERVICES = [
  {
    n: '01',
    icon: 'brush',
    title: 'Brand Identity',
    desc: 'A cohesive visual system built to communicate who you are before a single word is read. Logo design, color systems, typography, and brand guidelines delivered as a complete toolkit.',
    includes: ['Logo & wordmark design', 'Color system', 'Typography selection', 'Brand style guide', 'Business card & collateral'],
  },
  {
    n: '02',
    icon: 'web',
    title: 'Web Design',
    desc: 'Every page designed with intent: layouts that guide attention, UI that converts, and aesthetics that build trust with your audience from the first scroll.',
    includes: ['Custom UI design', 'Responsive layouts', 'User experience (UX)', 'Figma design files', 'Prototype & user testing'],
  },
  {
    n: '03',
    icon: 'code',
    title: 'Web Development',
    desc: 'Production-grade code that performs. Built with React, Next.js, or Webflow, always fast, accessible, and SEO-ready out of the box.',
    includes: ['React / Next.js builds', 'Webflow development', 'CMS integration', 'Performance optimization', 'Cross-browser testing'],
  },
  {
    n: '04',
    icon: 'shopping_bag',
    title: 'E-Commerce',
    desc: 'Online stores engineered for conversion. From product page design to checkout optimization, every decision is made with your revenue in mind.',
    includes: ['Shopify development', 'Product page design', 'Checkout optimization', 'Inventory management', 'Payment integration'],
  },
  {
    n: '05',
    icon: 'search',
    title: 'SEO Optimization',
    desc: 'Rankings that bring qualified traffic. Technical SEO, on-page optimization, and content strategy working together to drive organic growth.',
    includes: ['Technical SEO audit', 'On-page optimization', 'Keyword strategy', 'Site speed improvements', 'Schema markup'],
  },
  {
    n: '06',
    icon: 'build',
    title: 'Ongoing Maintenance',
    desc: 'Your website is a living asset. Monthly maintenance plans keep it fast, secure, and evolving with your business.',
    includes: ['Security updates', 'Performance monitoring', 'Content updates', 'Analytics reporting', 'Feature additions'],
  },
]

const PROMISES = [
  'Flat pricing. No surprises.',
  'Direct communication, always.',
  'Delivered on time or I\'ll tell you why.',
  'SEO and performance built in from the start.',
]

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] },
  }),
}

export default function Services() {
  return (
    <PageWrapper
      title="Web Design Services — Terrence Adderley, Boston MA"
      description="Brand identity, web design, development, e-commerce, SEO, and ongoing maintenance. Full-service freelance web studio based in Boston, MA."
      canonical="https://designsbyta.com/services"
    >

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="bg-white pt-20 pb-16 md:pt-28 md:pb-24 px-6 lg:px-8 border-b border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#777] mb-6">Services</p>
            <h1 className="text-[clamp(36px,6vw,80px)] font-extrabold leading-[1.0] tracking-[-0.04em] text-black mb-6 max-w-3xl uppercase">
              Everything You Need. Nothing You Don't.
            </h1>
            <p className="text-[17px] text-[#474747] leading-relaxed max-w-xl">
              A focused set of services designed to move your business forward, from brand foundation to technical execution to long-term growth.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── SERVICES GRID ────────────────────────────────────────── */}
      <section className="bg-[#f3f3f4] py-20 md:py-28 px-6 lg:px-8 border-b border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#e5e5e5]">
            {SERVICES.map(({ n, icon, title, desc, includes }, i) => (
              <motion.div
                key={n}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="bg-white p-8 md:p-10 group hover:bg-black transition-colors duration-300"
              >
                <div className="flex items-start justify-between mb-6">
                  <span className="material-symbols-outlined text-[26px] text-black group-hover:text-white transition-colors">
                    {icon}
                  </span>
                  <span className="text-[11px] font-bold tracking-[0.1em] text-[#c6c6c6] group-hover:text-white/30 transition-colors">{n}</span>
                </div>
                <h2 className="text-[20px] font-bold text-black group-hover:text-white transition-colors mb-3">{title}</h2>
                <p className="text-[14px] text-[#474747] group-hover:text-white/60 transition-colors leading-relaxed mb-6">{desc}</p>
                <ul className="flex flex-col gap-2">
                  {includes.map(item => (
                    <li key={item} className="flex items-center gap-3 text-[13px] text-[#474747] group-hover:text-white/50 transition-colors">
                      <span className="w-1 h-1 bg-[#c6c6c6] group-hover:bg-white/40 transition-colors shrink-0 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROMISE SECTION ──────────────────────────────────────── */}
      <section className="bg-black py-20 md:py-28 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/40 mb-5">My Promise</p>
            <h2 className="text-[clamp(28px,4vw,48px)] font-bold leading-[1.1] tracking-[-0.03em] text-white mb-6">
              You work with me. Not a junior. Not a team you've never met.
            </h2>
            <p className="text-[15px] text-white/60 leading-relaxed">
              Every project is handled personally: strategy, design, code, and launch. That means faster decisions, higher quality, and a working relationship built on trust.
            </p>
          </div>
          <div className="flex flex-col">
            {PROMISES.map((item, i) => (
              <div key={i} className="flex items-center gap-4 py-4 border-b border-white/10 last:border-b-0">
                <span className="material-symbols-outlined text-[18px] text-white/50">check_circle</span>
                <span className="text-[15px] text-white/80 font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="bg-[#f3f3f4] py-20 md:py-28 px-6 lg:px-8 border-b border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-[clamp(28px,4vw,56px)] font-extrabold leading-[1.0] tracking-[-0.04em] text-black mb-6 uppercase">
            Let's talk about your project.
          </h2>
          <p className="text-[16px] text-[#474747] mb-10 max-w-md mx-auto leading-relaxed">
            A free 30-minute consultation to understand your goals and map the right path forward.
          </p>
          <Link
            to="/contact"
            className="inline-block bg-black text-white text-[12px] font-semibold tracking-[0.1em] uppercase px-10 py-4 hover:bg-[#222] transition-colors"
          >
            Book a Free Consultation
          </Link>
        </div>
      </section>

      <Footer />
    </PageWrapper>
  )
}
