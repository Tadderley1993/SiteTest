import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

interface ParallaxImageProps {
  src: string
  alt?: string
  containerClass?: string
  imgClass?: string
  speed?: number
  video?: boolean   // render as autoplay video instead of img
}

/**
 * Parallax reveal — image or video.
 * Container clips oversized media that drifts slower than scroll.
 */
export default function ParallaxImage({
  src,
  alt = '',
  containerClass = '',
  imgClass = '',
  speed = 0.15,
  video = false,
}: ParallaxImageProps) {
  const ref = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const pct = speed * 100
  const y = useTransform(scrollYProgress, [0, 1], [`-${pct}%`, `${pct}%`])

  return (
    <div ref={ref} className={`overflow-hidden ${containerClass}`}>
      <motion.div
        style={{
          y,
          height: `${100 + pct * 2}%`,
          marginTop: `-${pct}%`,
          width: '100%',
        }}
      >
        {video ? (
          <video
            src={src}
            autoPlay
            muted
            loop
            playsInline
            className={`w-full h-full object-cover ${imgClass}`}
          />
        ) : (
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover ${imgClass}`}
            loading="lazy"
          />
        )}
      </motion.div>
    </div>
  )
}
