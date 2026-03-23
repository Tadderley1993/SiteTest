import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'

import CTASection from '../components/layout/CTASection'
import Footer from '../components/layout/Footer'
import SectionLabel from '../components/layout/SectionLabel'
import FadeUp from '../components/layout/FadeUp'
import AnimatedHeading from '../components/layout/AnimatedHeading'
import ParallaxImage from '../components/layout/ParallaxImage'
import { staggerContainer, staggerItem } from '../components/layout/animations'

const SKILLS = [
  'Figma', 'React', 'TypeScript', 'Next.js', 'Tailwind CSS',
  'Framer Motion', 'Node.js', 'Prisma', 'PostgreSQL', 'SEO',
  'GA4 Analytics', 'Webflow', 'Adobe CC', 'Shopify',
]

const PHILOSOPHY = [
  { title: 'Precision', desc: "Every pixel, every word, every line of code is intentional. Good design is in the details — and I obsess over them so you don't have to." },
  { title: 'Partnership', desc: "Your business goals are my brief. I don't hand off mockups and disappear — I stay in the trenches until the work is done and performing." },
  { title: 'Performance', desc: "Beautiful work that doesn't convert isn't good work. Every project is engineered for speed, SEO, and measurable business outcomes." },
]

export default function About() {
  return (
    <PageWrapper
      title="About Designs By TA — Terrence Adderley, Boston Web Designer"
      description="Meet Terrence Adderley, the designer and developer behind Designs By TA. Built by obsession, driven by results — Boston-based freelance web design agency."
      canonical="https://designsbyta.com/about"
    >
      {/* ── MOBILE layout ─────────────────────────────────────────── */}
      <div className="md:hidden bg-background">

        {/* Hero */}
        <section className="pt-8 pb-16 px-6">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#735c00] block mb-5">About the Studio</span>
          <h1 className="font-serif italic text-[2.75rem] leading-[1.1] tracking-tight text-text-primary mb-6">
            Built by <span className="text-accent">obsession.</span><br />Driven by results.
          </h1>
          <div className="w-full aspect-[4/5] bg-[#ece8e0] overflow-hidden mb-6">
            <img src="/imgs/about-hero.png" alt="Terrence Adderley — Designs By TA, Boston MA" className="w-full h-full object-cover" />
          </div>
        </section>

        {/* Story */}
        <section className="px-6 pb-16">
          <h3 className="text-xs uppercase tracking-widest font-semibold text-text-muted mb-4">The Story</h3>
          <p className="text-xl font-serif leading-relaxed italic text-text-primary mb-6 pr-6">
            "We believe that every pixel is a deliberate choice, every interaction a curated conversation."
          </p>
          <div className="flex flex-col gap-4 text-text-muted text-[15px] leading-[1.75]">
            <p>Terrence Adderley is the designer, developer, and strategist behind Designs By TA — a Boston-based freelance web design agency built around one idea: your website should work as hard as you do.</p>
            <p>I didn't fall into web design — I was pulled toward it. The intersection of code and creativity, logic and intuition, is where I've always wanted to work.</p>
            <p>Designs By TA is the product of that synthesis — a studio that combines design craft, engineering rigor, and growth strategy under one roof. Based in Boston, MA, serving clients everywhere.</p>
          </div>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-[rgba(198,168,75,0.1)] border border-[rgba(198,168,75,0.25)]">
            <span className="text-[13px] font-semibold text-accent">Boston, MA</span>
            <span className="text-[12px] text-text-muted">· Available worldwide</span>
          </div>
        </section>

        {/* Skills */}
        <section className="bg-[#f8f3eb] py-16 px-6">
          <h3 className="text-xs uppercase tracking-widest font-semibold text-text-muted mb-3">Tools &amp; Skills</h3>
          <div className="w-10 h-px bg-accent mb-8" />
          <div className="flex flex-wrap gap-2.5">
            {SKILLS.map(skill => (
              <span key={skill} className="px-4 py-1.5 border border-[rgba(0,0,0,0.1)] bg-white text-[11px] uppercase tracking-widest text-text-muted">{skill}</span>
            ))}
          </div>
        </section>

        {/* Philosophy */}
        <section className="px-6 py-16">
          <h3 className="text-xs uppercase tracking-widest font-semibold text-text-muted mb-10 text-center">Our Philosophy</h3>
          <div className="flex flex-col gap-12">
            {PHILOSOPHY.map(({ title, desc }, i) => (
              <div key={title}>
                <div className="flex items-baseline gap-4 mb-3">
                  <span className="font-serif italic text-3xl text-[rgba(127,118,101,0.25)]">0{i + 1}</span>
                  <h4 className="font-serif italic text-xl text-text-primary">{title}</h4>
                </div>
                <p className="text-text-muted text-sm leading-relaxed pl-10 border-l border-[rgba(198,168,75,0.2)]">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#735c00] py-14 px-6 text-center">
          <h2 className="font-serif italic text-3xl text-white mb-6">Start the Conversation</h2>
          <a href="#start-project" className="inline-block bg-[#C6A84B] text-[#1C1917] px-10 py-4 font-bold text-xs tracking-widest uppercase hover:opacity-90 transition-opacity">
            Book a Consult
          </a>
          <p className="mt-8 font-serif italic text-[rgba(255,255,255,0.6)] text-sm underline underline-offset-4">hello@designsbyta.com</p>
        </section>

      </div>

      {/* ── DESKTOP layout ─────────────────────────────────────────── */}
      <div className="hidden md:block">


      {/* ── Hero ── */}
      <section className="relative pt-28 pb-14 px-6 lg:px-8 bg-background overflow-hidden" aria-label="About hero">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(198,168,75,0.06)] via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto relative max-w-2xl">
          <FadeUp>
            <SectionLabel label="About" className="mb-6" />
          </FadeUp>
          <AnimatedHeading
            text="Built by obsession. Driven by results."
            as="h1"
            className="text-h1 font-medium tracking-tighter text-text-primary mb-6"
            highlightWords={['results.']}
          />
          <FadeUp delay={0.3}>
            <p className="text-[18px] text-text-muted leading-relaxed">
              Terrence Adderley is the designer, developer, and strategist behind Designs By TA — a Boston-based freelance web design agency built around one idea: your website should work as hard as you do.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ── Story ── */}
      <section className="py-14 bg-background border-t border-[rgba(0,0,0,0.08)]" aria-label="My story">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <FadeUp>
                <SectionLabel number="01" label="The Story" className="mb-8" />
              </FadeUp>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="flex flex-col gap-5 text-[16px] text-text-muted leading-[1.75]"
              >
                {[
                  "I didn't fall into web design — I was pulled toward it. The intersection of code and creativity, logic and intuition, is where I've always wanted to work.",
                  "What started as a passion for building things that look right became an obsession with building things that work. Every project taught me something: clean code isn't enough if the design doesn't convert. Great design isn't enough if the site loads in 4 seconds. SEO isn't enough if the copy doesn't land.",
                  "Designs By TA is the product of that synthesis — a studio that combines design craft, engineering rigor, and growth strategy under one roof. Based in Boston, MA, serving clients everywhere.",
                  "I keep the team small intentionally. You work with me — not a junior contractor managed by someone who's never seen your project.",
                ].map((para, i) => (
                  <motion.p key={i} variants={staggerItem}>
                    {i === 1
                      ? <>{para.split('work')[0]}<em className="text-text-primary not-italic">work</em>{para.split('work').slice(1).join('work')}</>
                      : para}
                  </motion.p>
                ))}
              </motion.div>
            </div>

            <div className="relative">
              <ParallaxImage
                src="/imgs/about-hero.png"
                alt="Terrence Adderley — Designs By TA studio workspace in Boston MA"
                containerClass="rounded-2xl border border-[#C8C09F]/40 h-[420px]"
                speed={0.15}
              />
              <FadeUp delay={0.2} className="absolute -bottom-4 -right-4 px-5 py-3 rounded-xl bg-[rgba(198,168,75,0.1)] border border-[rgba(198,168,75,0.25)]">
                <p className="text-[13px] font-semibold text-accent">Boston, MA</p>
                <p className="text-[12px] text-text-muted">Available worldwide</p>
              </FadeUp>
            </div>
          </div>
        </div>
      </section>

      {/* ── Skills ── */}
      <section className="py-12 bg-[rgba(0,0,0,0.02)] border-y border-[rgba(0,0,0,0.06)]" aria-label="Skills">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <FadeUp>
            <SectionLabel number="02" label="Tools & Skills" className="mb-8" />
            <AnimatedHeading
              text="The stack behind every project."
              className="text-h2 font-medium tracking-tighter text-text-primary mb-10 max-w-lg"
            />
          </FadeUp>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="flex flex-wrap gap-3"
          >
            {SKILLS.map(skill => (
              <motion.span
                key={skill}
                variants={staggerItem}
                className="px-4 py-2 rounded-full text-[13px] font-medium border border-[rgba(0,0,0,0.1)] bg-[rgba(0,0,0,0.02)] text-text-primary hover:border-[rgba(198,168,75,0.4)] hover:text-accent transition-colors cursor-default"
              >
                {skill}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Philosophy ── */}
      <section className="py-14 bg-background" aria-label="Philosophy">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <FadeUp>
            <SectionLabel number="03" label="Philosophy" className="mb-6" />
            <AnimatedHeading
              text="Three principles. Every project."
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
            {PHILOSOPHY.map(({ title, desc }) => (
              <motion.div key={title} variants={staggerItem} className="p-8 rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[rgba(0,0,0,0.02)]">
                <h3 className="text-[22px] font-medium tracking-tighter text-accent mb-4">{title}</h3>
                <p className="text-[15px] text-text-muted leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
          <FadeUp delay={0.2} className="mt-12 flex flex-wrap gap-4">
            <Link to="/portfolio" className="px-6 py-3 rounded-full bg-accent text-[#1C1917] text-[14px] font-semibold tracking-[0.03em] hover:bg-accent-dim transition-colors">See the Work</Link>
            <Link to="/why-choose-me" className="px-6 py-3 rounded-full border border-[rgba(0,0,0,0.15)] text-text-primary text-[14px] font-medium hover:border-accent hover:text-accent transition-colors">Why Choose Me →</Link>
          </FadeUp>
        </div>
      </section>

      <CTASection />
      <Footer />

      </div>{/* end desktop layout */}

    </PageWrapper>
  )
}
