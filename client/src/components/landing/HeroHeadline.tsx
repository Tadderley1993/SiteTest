import { motion } from 'framer-motion'

export default function HeroHeadline() {
  const headline = "I know why you're here, so let's cut out all the fluff."
  const words = headline.split(' ')

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.3,
      },
    },
  }

  const child = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 100,
      },
    },
  }

  return (
    <div className="flex flex-col justify-center h-full px-8 lg:px-16">
      <motion.h1
        className="font-display text-5xl lg:text-7xl xl:text-8xl leading-none tracking-tight text-text-primary"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        {words.map((word, i) => (
          <motion.span
            key={i}
            variants={child}
            className="inline-block mr-[0.25em]"
          >
            {word}
          </motion.span>
        ))}
      </motion.h1>

      <motion.p
        className="mt-8 text-lg lg:text-xl text-text-muted max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        Tell me what you need. I'll handle the rest.
      </motion.p>
    </div>
  )
}
