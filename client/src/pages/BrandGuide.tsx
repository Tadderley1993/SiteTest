import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { SLIDES, slideVariants } from '../data/brandGuideSlides'

export default function BrandGuide() {
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [copied, setCopied] = useState(false)

  const slide = SLIDES[index]
  const progress = ((index + 1) / SLIDES.length) * 100

  const goTo = useCallback((next: number) => {
    if (next < 0 || next >= SLIDES.length) return
    setDirection(next > index ? 1 : -1)
    setIndex(next)
  }, [index])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(index + 1)
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goTo(index - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, goTo])

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#08090D] text-[#F5F0E8] flex flex-col select-none overflow-hidden">

      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        {/* Progress bar */}
        <div className="h-0.5 bg-white/10">
          <motion.div
            className="h-full bg-[#C6A84B]"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
        <div className="flex items-center justify-between px-6 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#6B6560] hover:text-[#F5F0E8] transition-colors text-sm"
          >
            <span className="text-lg leading-none">←</span>
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[#C6A84B] text-xs font-bold tracking-widest uppercase">DBTA</span>
            <span className="text-[#6B6560] text-xs">·</span>
            <span className="text-[#6B6560] text-xs">Brand Guide</span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 text-[#6B6560] hover:text-[#C6A84B] transition-colors text-sm"
          >
            <span className="text-base leading-none">{copied ? '✓' : '⎘'}</span>
            <span className="hidden sm:inline text-xs">{copied ? 'Copied!' : 'Copy link'}</span>
          </button>
        </div>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-28 max-w-3xl mx-auto w-full">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="w-full space-y-8"
          >
            {/* Slide tag + number */}
            <div className="flex items-center gap-3">
              <div>
                <p className="text-[#C6A84B] text-[10px] font-bold uppercase tracking-[0.2em]">
                  {slide.tag}
                </p>
                <p className="text-[#6B6560] text-[10px] font-bold tracking-widest">
                  {slide.number} / {String(SLIDES.length).padStart(2, '0')}
                </p>
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter leading-tight text-[#F5F0E8]">
                {slide.headline}
              </h1>
              {slide.subheadline && (
                <p className="text-[#6B6560] text-base sm:text-lg leading-relaxed">
                  {slide.subheadline}
                </p>
              )}
            </div>

            {/* Body paragraphs */}
            {slide.body && slide.body.length > 0 && (
              <div className="space-y-3">
                {slide.body.map((p, i) => (
                  <p key={i} className="text-[#F5F0E8]/80 text-base leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            )}

            {/* Bullets */}
            {slide.bullets && slide.bullets.length > 0 && (
              <ul className="space-y-3">
                {slide.bullets.map((b, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.07 }}
                    className="flex items-start gap-4"
                  >
                    <span className="text-[#C6A84B] text-sm font-black mt-0.5 w-5 flex-shrink-0 text-center">
                      {b.icon}
                    </span>
                    <span className="text-[#F5F0E8]/90 text-base leading-relaxed">{b.text}</span>
                  </motion.li>
                ))}
              </ul>
            )}

            {/* Two-column (slide 18) */}
            {slide.twoCol && (
              <div className="grid grid-cols-2 gap-6">
                {[slide.twoCol.left, slide.twoCol.right].map((col, ci) => (
                  <div
                    key={ci}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 space-y-3"
                  >
                    <p className="text-[#C6A84B] text-[10px] font-bold uppercase tracking-widest">
                      {col.label}
                    </p>
                    <ul className="space-y-2">
                      {col.items.map((item, ii) => (
                        <li key={ii} className="text-[#F5F0E8]/80 text-sm flex items-center gap-2">
                          <span className="text-[#C6A84B] text-xs">◈</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Callout */}
            {slide.callout && (
              <div className="border-l-2 border-[#C6A84B] pl-5">
                <p className="text-[#F5F0E8] text-base sm:text-lg font-medium leading-relaxed whitespace-pre-line">
                  {slide.callout}
                </p>
              </div>
            )}

            {/* Final CTA */}
            {slide.isFinal && (
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <a
                  href="/#contact"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#C6A84B] text-[#08090D] font-bold text-sm rounded-full hover:bg-[#8A6F2E] transition-colors"
                >
                  Let's Work Together →
                </a>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-white/10 text-[#F5F0E8]/70 font-medium text-sm rounded-full hover:border-white/20 hover:text-[#F5F0E8] transition-colors"
                >
                  {copied ? '✓ Copied!' : '⎘ Share this guide'}
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#08090D]/80 backdrop-blur-xl border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-6 py-4 gap-4">
          <button
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 text-sm font-medium text-[#F5F0E8]/60 hover:text-[#F5F0E8] hover:border-white/20 disabled:opacity-20 disabled:pointer-events-none transition-all"
          >
            ← Prev
          </button>

          {/* Dot indicators */}
          <div className="flex gap-1.5 flex-wrap justify-center flex-1">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all ${
                  i === index
                    ? 'w-5 h-1.5 bg-[#C6A84B]'
                    : i < index
                    ? 'w-1.5 h-1.5 bg-white/30'
                    : 'w-1.5 h-1.5 bg-white/10'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => goTo(index + 1)}
            disabled={index === SLIDES.length - 1}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 text-sm font-medium text-[#F5F0E8]/60 hover:text-[#F5F0E8] hover:border-white/20 disabled:opacity-20 disabled:pointer-events-none transition-all"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}
