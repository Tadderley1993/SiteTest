import React from 'react'
import { motion } from 'framer-motion'

interface AnimatedHeadingProps {
  text: string
  as?: 'h1' | 'h2' | 'h3'
  className?: string
  style?: React.CSSProperties
  highlightWords?: string[]
  highlightClass?: string
}

const wordVariants = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] },
  }),
}

export default function AnimatedHeading({
  text,
  as: Tag = 'h2',
  className = '',
  style,
  highlightWords = [],
  highlightClass = 'text-accent',
}: AnimatedHeadingProps) {
  const words = text.split(' ')

  return (
    <Tag className={className} style={style}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          custom={i}
          variants={wordVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className={`inline-block mr-[0.28em] ${highlightWords.includes(word) ? highlightClass : ''}`}
        >
          {word}
        </motion.span>
      ))}
    </Tag>
  )
}
