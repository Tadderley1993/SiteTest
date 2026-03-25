import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'
import Footer from '../components/layout/Footer'

const SKILLS = [
  'Figma', 'React', 'TypeScript', 'Next.js', 'Tailwind CSS',
  'Framer Motion', 'Node.js', 'Prisma', 'PostgreSQL', 'SEO',
  'GA4 Analytics', 'Webflow', 'Adobe CC', 'Shopify',
]

const VALUES = [
  {
    n: '01',
    title: 'Precision',
    desc: 'Every pixel, every word, every line of code is intentional. Good design is in the details — and I obsess over them so you don\'t have to.',
  },
  {
    n: '02',
    title: 'Partnership',
    desc: 'Your business goals are my brief. I don\'t hand off mockups and disappear — I stay in the trenches until the work is done and performing.',
  },
  {
    n: '03',
    title: 'Performance',
    desc: 'Beautiful work that doesn\'t convert isn\'t good work. Every project is engineered for speed, SEO, and measurable business outcomes.',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] },
  }),
}

export default function About() {
  return (
    <PageWrapper
      title="About Terrence Adderley — Boston Web Designer & Developer"
      description="Meet Terrence Adderley, the designer and developer behind Designs By TA. Built by obsession, driven by results — Boston-based freelance web design studio."
      canonical="https://designsbyta.com/about"
    >

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="bg-white pt-20 pb-16 md:pt-28 md:pb-24 px-6 lg:px-8 border-b border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#777] mb-6">About</p>
            <h1 className="text-[clamp(36px,6vw,80px)] font-extrabold leading-[1.0] tracking-[-0.04em] text-black mb-6 max-w-3xl uppercase">
              Built by Obsession. Driven by Results.
            </h1>
            <p className="text-[17px] text-[#474747] leading-relaxed max-w-xl">
              Terrence Adderley is a designer, developer, and strategist based in Boston, MA — building websites that work as hard as the businesses they represent.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── HERO IMAGE ───────────────────────────────────────────── */}
      <div className="w-full overflow-hidden border-b border-[#e5e5e5]" style={{ height: 'clamp(260px, 40vw, 540px)' }}>
        <img
          src="/imgs/about-hero.png"
          alt="Terrence Adderley — Boston MA Web Designer"
          className="w-full h-full object-cover grayscale"
        />
      </div>

      {/* ── STORY ────────────────────────────────────────────────── */}
      <section className="bg-[#f3f3f4] py-20 md:py-28 px-6 lg:px-8 border-b border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#777] mb-5">The Story</p>
              <h2 className="text-[clamp(26px,3.5vw,42px)] font-bold leading-[1.1] tracking-[-0.03em] text-black">
                The intersection of code and creativity is where I've always wanted to work.
              </h2>
            </div>
            <div className="flex flex-col gap-5">
              {[
                "I didn't fall into web design — I was pulled toward it. The craft of building something that both looks right and functions perfectly has been a lifelong obsession.",
                "What started as a passion for aesthetics became an obsession with outcomes. Clean code isn't enough if the design doesn't convert. Great design isn't enough if the site loads in 4 seconds. SEO isn't enough if the copy doesn't land.",
                "Designs By TA is the product of that synthesis — a studio that combines design craft, engineering rigor, and growth strategy under one roof. I keep the team small intentionally. You work with me — not a junior contractor managed by someone who's never seen your project.",
                "Based in Boston, MA. Serving clients everywhere.",
              ].map((para, i) => (
                <motion.p
                  key={i}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  className="text-[15px] text-[#474747] leading-[1.75]"
                >
                  {para}
                </motion.p>
              ))}
              <div className="mt-4 inline-flex items-center gap-3 border border-[#e5e5e5] bg-white px-5 py-3">
                <span className="text-[13px] font-bold text-black">Boston, MA</span>
                <span className="w-px h-4 bg-[#e5e5e5]" />
                <span className="text-[13px] text-[#777]">Available Worldwide</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SKILLS ───────────────────────────────────────────────── */}
      <section className="bg-white py-20 md:py-28 px-6 lg:px-8 border-b border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#777] mb-5">Tools & Skills</p>
          <h2 className="text-[clamp(26px,3.5vw,42px)] font-bold leading-[1.1] tracking-[-0.03em] text-black mb-12">
            The stack behind every project.
          </h2>
          <div className="flex flex-wrap gap-2">
            {SKILLS.map((skill, i) => (
              <motion.span
                key={skill}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="px-4 py-2 border border-[#e5e5e5] text-[12px] font-medium text-[#474747] uppercase tracking-[0.08em] hover:border-black hover:text-black transition-colors"
              >
                {skill}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUES ───────────────────────────────────────────────── */}
      <section className="bg-[#f3f3f4] py-20 md:py-28 px-6 lg:px-8 border-b border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#777] mb-5">Philosophy</p>
          <h2 className="text-[clamp(26px,3.5vw,42px)] font-bold leading-[1.1] tracking-[-0.03em] text-black mb-14">
            Three principles. Every project.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#e5e5e5]">
            {VALUES.map(({ n, title, desc }, i) => (
              <motion.div
                key={n}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="bg-white p-8 group hover:bg-black transition-colors duration-300"
              >
                <span className="text-[11px] font-bold tracking-[0.1em] text-[#c6c6c6] group-hover:text-white/30 transition-colors block mb-6">{n}</span>
                <h3 className="text-[20px] font-bold text-black group-hover:text-white transition-colors mb-3">{title}</h3>
                <p className="text-[14px] text-[#474747] group-hover:text-white/60 transition-colors leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/services"
              className="bg-black text-white text-[12px] font-semibold tracking-[0.1em] uppercase px-7 py-3.5 hover:bg-[#222] transition-colors"
            >
              View Services
            </Link>
            <Link
              to="/contact"
              className="border border-black text-black text-[12px] font-semibold tracking-[0.1em] uppercase px-7 py-3.5 hover:bg-black hover:text-white transition-all"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </PageWrapper>
  )
}
