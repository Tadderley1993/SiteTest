import { motion } from 'framer-motion'

// Staggered container + item — use on card grids
export const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

export const staggerItem = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
}

// Scale-in for image wrappers
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
  },
}

export { motion }
