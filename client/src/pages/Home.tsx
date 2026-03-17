import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import FormPanel from '../components/form/FormPanel'
import DigitalFootprintSection from '../components/landing/DigitalFootprintSection'
import CaseStudiesSection from '../components/landing/CaseStudiesSection'
import ExampleProjectsSection from '../components/landing/ExampleProjectsSection'
import OurProcessSection from '../components/landing/OurProcessSection'
import ReadySection from '../components/landing/ReadySection'

const HERO_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4'

// Layered pill button matching the template spec
function PillButton({
  children, onClick, variant = 'dark', className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'dark' | 'light'
  className?: string
}) {
  return (
    <div className={`relative rounded-full p-[0.6px] border border-white/20 ${className}`}>
      {/* Top glow streak */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      <button
        type="button"
        onClick={onClick}
        className={`relative rounded-full px-[29px] py-[11px] text-sm font-medium transition-opacity hover:opacity-80 ${
          variant === 'dark' ? 'bg-black text-white' : 'bg-white text-black'
        }`}
      >
        {children}
      </button>
    </div>
  )
}

export default function Home() {
  const [formCompleted, setFormCompleted] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const exploreSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (formCompleted && exploreSectionRef.current) {
      const timer = setTimeout(() => {
        exploreSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 120)
      return () => clearTimeout(timer)
    }
  }, [formCompleted])

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToForm = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {/* ── Sticky navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-[120px] py-5 max-md:px-6">
        <img src="/dbt_white.png" alt="Designs By TA" className="h-8 w-auto" />
        <span className="text-white font-body font-medium text-sm tracking-wide">Designs By TA</span>
      </nav>

      <div
        ref={scrollContainerRef}
        className="w-screen h-screen overflow-y-scroll"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {/* ── Hero ── */}
        <div
          className="relative w-screen h-screen flex-shrink-0 overflow-hidden bg-black"
          style={{ scrollSnapAlign: 'start' }}
        >
          {/* Background video */}
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            src={HERO_VIDEO}
          />
          {/* 50% black overlay */}
          <div className="absolute inset-0 bg-black/50" />

          {/* ── Hero content ── */}
          <div className="relative z-10 flex h-full pt-[80px]">
          {/* Left — badge + headline + subtitle */}
          <div
            className="flex-1 flex flex-col justify-center px-[120px] max-md:px-6 gap-5"
          >
            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.7 }}
              className="font-display font-medium leading-[1.1] tracking-tight max-w-[580px] text-[clamp(1.875rem,4vw,3rem)]"
              style={{
                background: 'linear-gradient(144.5deg, #ffffff 28%, rgba(0,0,0,0) 115%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              We build digital experiences that grow your business.
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-white/70 text-[14px] font-normal leading-relaxed max-w-[480px]"
            >
              From brand identity to full-stack web applications, Designs By TA delivers precision-crafted digital products that convert browsers into buyers and elevate how the world sees your brand.
            </motion.p>

          </div>

          {/* Right — form */}
          <div className="flex-1 flex items-end justify-center pr-[120px] max-md:hidden pb-[120px]">
            <FormPanel onComplete={() => setFormCompleted(true)} />
          </div>
        </div>

        {/* Scroll hint after form complete */}
        <AnimatePresence>
          {formCompleted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3 pointer-events-none"
            >
              {/* Text — expands letter-spacing into place */}
              <motion.span
                initial={{ opacity: 0, letterSpacing: '0.6em' }}
                animate={{ opacity: 1, letterSpacing: '0.28em' }}
                transition={{ delay: 0.1, duration: 0.8, ease: 'easeOut' }}
                className="font-body text-[10px] uppercase text-white/40"
              >
                Scroll to explore
              </motion.span>

              {/* Line + traveling orb */}
              <div className="relative flex flex-col items-center" style={{ width: 1, height: 36 }}>
                {/* Line draws itself down */}
                <motion.div
                  className="absolute top-0 left-0 w-px bg-gradient-to-b from-white/30 to-transparent"
                  initial={{ height: 0 }}
                  animate={{ height: 36 }}
                  transition={{ delay: 0.5, duration: 0.55, ease: 'easeOut' }}
                />
                {/* Orb travels down the line, loops */}
                <motion.div
                  className="absolute left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full bg-white/70"
                  initial={{ y: 0, opacity: 0 }}
                  animate={{ y: [0, 33, 33], opacity: [0, 1, 0] }}
                  transition={{
                    delay: 1.1,
                    duration: 1.4,
                    ease: ['easeIn', 'easeOut'],
                    repeat: Infinity,
                    repeatDelay: 0.6,
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Sections (unlocked after form complete) ── */}
      <AnimatePresence>
        {formCompleted && (
          <>
            <motion.div
              ref={exploreSectionRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="flex-shrink-0"
              style={{ scrollSnapAlign: 'start' }}
            >
              <DigitalFootprintSection />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="flex-shrink-0"
              style={{ scrollSnapAlign: 'start' }}
            >
              <CaseStudiesSection />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex-shrink-0"
              style={{ scrollSnapAlign: 'start' }}
            >
              <ExampleProjectsSection />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="flex-shrink-0"
              style={{ scrollSnapAlign: 'start' }}
            >
              <OurProcessSection />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex-shrink-0"
              style={{ scrollSnapAlign: 'start' }}
            >
              <ReadySection onScrollToTop={scrollToTop} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
    </>
  )
}
