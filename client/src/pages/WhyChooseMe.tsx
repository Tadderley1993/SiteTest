import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'

import CTASection from '../components/layout/CTASection'
import Footer from '../components/layout/Footer'
import SectionLabel from '../components/layout/SectionLabel'
import FadeUp from '../components/layout/FadeUp'
import AnimatedHeading from '../components/layout/AnimatedHeading'
import { staggerContainer, staggerItem } from '../components/layout/animations'

function CompareCard({ title, them, me }: { title: string; them: string[]; me: string[] }) {
  return (
    <motion.div variants={staggerItem} className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[rgba(0,0,0,0.02)] overflow-hidden">
      <div className="px-6 py-4 border-b border-[rgba(0,0,0,0.08)]">
        <h3 className="text-[16px] font-semibold text-text-primary">{title}</h3>
      </div>
      <div className="grid grid-cols-2 divide-x divide-[rgba(0,0,0,0.08)]">
        <div className="px-5 py-5">
          <p className="text-[11px] tracking-[0.1em] uppercase text-text-muted mb-3">They offer</p>
          <ul className="flex flex-col gap-2">
            {them.map(t => (
              <li key={t} className="flex items-start gap-2 text-[13px] text-text-muted">
                <span className="text-red-500 mt-0.5 shrink-0">✕</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="px-5 py-5">
          <p className="text-[11px] tracking-[0.1em] uppercase text-accent mb-3">Designs By TA</p>
          <ul className="flex flex-col gap-2">
            {me.map(m => (
              <li key={m} className="flex items-start gap-2 text-[13px] text-text-primary">
                <span className="text-accent mt-0.5 shrink-0">✓</span>
                {m}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  )
}

function Testimonial({ quote, name, role }: { quote: string; name: string; role: string }) {
  return (
    <motion.div variants={staggerItem} className="p-6 rounded-xl border border-[rgba(0,0,0,0.08)] bg-[rgba(0,0,0,0.02)]">
      <p className="text-[15px] text-text-primary leading-relaxed mb-5 italic">"{quote}"</p>
      <div>
        <p className="text-[14px] font-semibold text-accent">{name}</p>
        <p className="text-[13px] text-text-muted">{role}</p>
      </div>
    </motion.div>
  )
}

function ProcessStep({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <motion.div variants={staggerItem} className="flex gap-5">
      <div className="shrink-0 w-10 h-10 rounded-full border border-[rgba(198,168,75,0.4)] bg-[rgba(198,168,75,0.08)] flex items-center justify-center">
        <span className="text-[13px] font-bold text-accent">{number}</span>
      </div>
      <div>
        <h3 className="text-[17px] font-semibold text-text-primary mb-1.5">{title}</h3>
        <p className="text-[14px] text-text-muted leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  )
}

export default function WhyChooseMe() {
  return (
    <PageWrapper
      title="Why Choose Designs By TA — Best Freelance Web Designer Boston"
      description="Discover why Boston businesses choose Designs By TA over big agencies, template builders, and other freelancers. Real partnership, real results."
      canonical="https://designsbyta.com/why-choose-me"
    >


      {/* ── Hero ── */}
      <section className="relative pt-28 pb-16 px-6 lg:px-8 bg-background overflow-hidden" aria-label="Page hero">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(198,168,75,0.06)] via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <FadeUp>
            <SectionLabel label="Why Choose Me" className="mb-6" />
          </FadeUp>
          <AnimatedHeading
            text="Not just a designer. A growth partner."
            as="h1"
            className="text-h1 font-medium tracking-tighter text-text-primary mb-6 max-w-2xl"
            highlightWords={['growth', 'partner.']}
          />
          <FadeUp delay={0.3}>
            <p className="text-[18px] text-text-muted max-w-xl leading-relaxed mb-10">
              The best freelance web designer in Boston isn't the one with the longest client list — it's the one who treats your business like their own.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#start-project" className="px-6 py-3 rounded-full bg-accent text-[#1C1917] text-[14px] font-semibold tracking-[0.03em] hover:bg-accent-dim transition-colors">
                Start Your Project
              </a>
              <Link to="/services" className="px-6 py-3 rounded-full border border-[rgba(0,0,0,0.15)] text-text-primary text-[14px] font-medium hover:border-accent hover:text-accent transition-colors">
                View Services →
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Process ── */}
      <section className="py-14 bg-background border-t border-[rgba(0,0,0,0.08)]" aria-label="Our process">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <FadeUp>
            <SectionLabel number="01" label="How It Works" className="mb-6" />
            <AnimatedHeading
              text="A process designed for clarity, not chaos."
              className="text-h2 font-medium tracking-tighter text-text-primary mb-14 max-w-xl"
            />
          </FadeUp>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-3xl"
          >
            <ProcessStep number="01" title="Discovery" desc="We dig into your goals, audience, and competitors. No assumptions — just sharp, targeted questions." />
            <ProcessStep number="02" title="Strategy & Design" desc="A tailored visual direction and sitemap built on research, not templates." />
            <ProcessStep number="03" title="Development" desc="Clean, fast, accessible code — optimized for performance and SEO from day one." />
            <ProcessStep number="04" title="Launch" desc="Thorough QA across devices. Smooth handoff with training and documentation." />
            <ProcessStep number="05" title="Growth" desc="Post-launch analytics, A/B testing, and iterative improvements to keep you ahead." />
          </motion.div>
        </div>
      </section>

      {/* ── Comparison ── */}
      <section className="py-14 bg-[rgba(0,0,0,0.02)] border-y border-[rgba(0,0,0,0.06)]" aria-label="Comparison">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <FadeUp>
            <SectionLabel number="02" label="The Honest Comparison" className="mb-6" />
            <AnimatedHeading
              text="Why Designs By TA over the alternatives?"
              className="text-h2 font-medium tracking-tighter text-text-primary mb-14 max-w-xl"
            />
          </FadeUp>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <CompareCard
              title="vs. Big Agencies"
              them={['You talk to account managers, not builders', 'Bloated timelines (3–6 months)', 'Billed hourly for every revision', 'You are one of 50 clients']}
              me={['Direct access to your designer/developer', 'Launch in weeks, not months', 'Flat rate projects with clear scope', 'You get my full attention']}
            />
            <CompareCard
              title="vs. Template Builders"
              them={['Cookie cutter designs that look like everyone else', 'Limited customization', 'Poor SEO out of the box', 'You hit a ceiling fast']}
              me={['Custom designed to your brand', 'No limits — built exactly to spec', 'SEO first from the ground up', 'Scales with your growth']}
            />
            <CompareCard
              title="vs. Other Freelancers"
              them={['Portfolio without proven results', 'Disappear after launch', 'Jack of all trades, master of none', 'Inconsistent communication']}
              me={['Case studies with real metrics', 'Ongoing support packages available', 'Specialized in web design + SEO', 'Weekly updates, always reachable']}
            />
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-14 bg-background" aria-label="Testimonials">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <FadeUp>
            <SectionLabel number="03" label="Client Words" className="mb-6" />
            <AnimatedHeading
              text="Don't take our word for it."
              className="text-h2 font-medium tracking-tighter text-text-primary mb-14 max-w-lg"
            />
          </FadeUp>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <Testimonial quote="We went from invisible online to fully booked within 8 weeks. The site doesn't just look great — it actually converts." name="Sarah M." role="Owner, Harvest Table · Boston, MA" />
            <Testimonial quote="Working with Designs By TA felt like having an in-house team. The attention to detail and the results speak for themselves." name="James T." role="Partner, Summit Wealth Advisory" />
            <Testimonial quote="Our e-commerce revenue grew 2.7× in the first quarter after launch. The ROI has been extraordinary." name="Priya K." role="Founder, FORMA Skincare" />
          </motion.div>
        </div>
      </section>

      <CTASection />
      <Footer />
    </PageWrapper>
  )
}
