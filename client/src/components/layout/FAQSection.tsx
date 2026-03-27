import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'

// ── FAQ Data ───────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'How much does web design cost in Boston?',
    a: 'Web design costs in Boston typically range from $1,500 to $10,000+ depending on the complexity, features, and goals of your website. A simple small business website will cost less, while custom-designed, conversion-focused sites require more strategy and development. At Designs by Terrence Adderley, pricing is tailored to your specific needs to ensure you get a site that actually drives results.',
  },
  {
    q: 'How long does it take to build a website?',
    a: 'Most websites are completed within 2 to 6 weeks depending on the size and complexity of the project. Timelines can vary based on content readiness, revisions, and required features. Our process is designed to be efficient while still delivering a high-quality, fully optimized website.',
  },
  {
    q: 'Do you offer custom website design or templates?',
    a: 'We specialize in fully custom website design tailored to your business, brand, and goals. Unlike generic templates, custom websites are built to stand out, convert visitors, and perform better in search engines.',
  },
  {
    q: 'Can you redesign my existing website?',
    a: 'Yes, we offer complete website redesign services for Boston businesses. If your current site is outdated, slow, or not converting visitors, we can rebuild it with modern design, improved performance, and SEO optimization.',
  },
  {
    q: 'Will my website be optimized for SEO?',
    a: 'Yes, every website we build includes foundational SEO best practices such as optimized structure, fast load speeds, mobile responsiveness, and keyword-friendly content. This helps your site rank higher on Google and attract more qualified traffic.',
    cta: { label: 'Learn about our SEO services', to: '/services' },
  },
  {
    q: 'Can you help my business rank on Google in Boston?',
    a: 'Yes, we offer SEO services specifically designed to help Boston-based businesses rank locally. This includes on-page SEO, keyword targeting, and strategies to improve your visibility in local search results.',
    cta: { label: 'View SEO services', to: '/services' },
  },
  {
    q: 'Will my website be mobile-friendly?',
    a: 'Absolutely. Every website is designed with a mobile-first approach to ensure it looks great and functions smoothly on all devices, including smartphones and tablets.',
  },
  {
    q: 'What platform do you build websites on?',
    a: 'We build websites using modern technologies and platforms depending on your needs, including custom-coded solutions and CMS platforms that allow easy updates and scalability.',
  },
  {
    q: 'Will I be able to update my website myself?',
    a: 'Yes, we can provide you with a content management system (CMS) so you can easily update text, images, and content without needing technical experience.',
  },
  {
    q: 'Do you provide website hosting or domain setup?',
    a: 'We can assist with both hosting and domain setup to ensure your website is secure, fast, and properly configured from day one.',
  },
  {
    q: 'What is your web design process?',
    a: 'Our process includes discovery, strategy, design, development, and optimization. This ensures your website is not only visually appealing but also built to perform and convert visitors into customers.',
    cta: { label: 'Start the process', to: '/contact' },
  },
  {
    q: 'How do we get started?',
    a: 'Getting started is simple. You can fill out our contact form or book a consultation to discuss your project. From there, we\'ll outline the next steps and create a plan tailored to your business.',
    cta: { label: 'Book a free consultation', to: '/contact' },
  },
]

// ── JSON-LD Schema ─────────────────────────────────────────────────────────────

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: a,
    },
  })),
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (i: number) => setOpenIndex(prev => (prev === i ? null : i))

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(FAQ_SCHEMA)}
        </script>
      </Helmet>

      <section
        aria-labelledby="faq-heading"
        className="bg-white py-20 md:py-28 px-6 lg:px-8 border-b border-[#e5e5e5]"
      >
        <div className="max-w-7xl mx-auto">

          {/* Section header */}
          <div className="max-w-2xl mb-14 md:mb-18">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#777] mb-5">
              FAQ
            </p>
            <h2
              id="faq-heading"
              className="text-[clamp(28px,4vw,52px)] font-extrabold leading-[1.05] tracking-[-0.04em] text-black mb-5 uppercase"
            >
              Frequently Asked Questions
            </h2>
            <p className="text-[16px] text-[#474747] leading-relaxed">
              Answers to the most common questions about web design, SEO, and working with a Boston-based web designer.
            </p>
          </div>

          {/* Accordion */}
          <div className="max-w-3xl">
            {FAQS.map(({ q, a, cta }, i) => {
              const isOpen = openIndex === i
              return (
                <div key={i} className="border-t border-[#e5e5e5] last:border-b">
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${i}`}
                    id={`faq-question-${i}`}
                    className="w-full flex items-center justify-between gap-6 py-5 text-left group"
                  >
                    <h3 className="text-[15px] font-semibold text-black leading-snug group-hover:text-[#474747] transition-colors">
                      {q}
                    </h3>
                    <motion.span
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="material-symbols-outlined text-[20px] text-[#aaa] group-hover:text-black transition-colors shrink-0"
                    >
                      add
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-answer-${i}`}
                        role="region"
                        aria-labelledby={`faq-question-${i}`}
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="pb-6 pr-10">
                          <p className="text-[14px] text-[#474747] leading-[1.8]">
                            {a}
                          </p>
                          {cta && (
                            <Link
                              to={cta.to}
                              reloadDocument={cta.to === '/services'}
                              className="inline-flex items-center gap-1.5 mt-4 text-[12px] font-semibold tracking-[0.06em] uppercase text-black border-b border-black pb-px hover:text-[#474747] hover:border-[#474747] transition-colors"
                            >
                              {cta.label}
                              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                            </Link>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>

          {/* Bottom CTA */}
          <div className="max-w-3xl mt-12 pt-10 border-t border-[#e5e5e5] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <p className="text-[14px] text-[#474747]">
              Still have questions? I'm happy to answer them directly.
            </p>
            <Link
              to="/contact"
              className="inline-block shrink-0 bg-black text-white text-[12px] font-semibold tracking-[0.1em] uppercase px-8 py-3.5 hover:bg-[#222] transition-colors"
            >
              Get in Touch
            </Link>
          </div>

        </div>
      </section>
    </>
  )
}
