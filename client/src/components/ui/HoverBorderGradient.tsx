import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

type Direction = 'TOP' | 'LEFT' | 'BOTTOM' | 'RIGHT'

const movingMap: Record<Direction, string> = {
  TOP: 'radial-gradient(20.7% 50% at 50% 0%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)',
  LEFT: 'radial-gradient(16.6% 43.1% at 0% 50%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)',
  BOTTOM: 'radial-gradient(20.7% 50% at 50% 100%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)',
  RIGHT: 'radial-gradient(16.2% 41.2% at 100% 50%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)',
}

const highlight =
  'radial-gradient(75% 181.16% at 50% 50%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 100%)'

const dirs: Direction[] = ['TOP', 'LEFT', 'BOTTOM', 'RIGHT']

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  containerClassName?: string
  innerClassName?: string
  duration?: number
  clockwise?: boolean
}

export function HoverBorderGradient({
  children,
  containerClassName = '',
  innerClassName = '',
  duration = 1.4,
  clockwise = true,
  disabled,
  ...props
}: Props) {
  const [hovered, setHovered] = useState(false)
  const [direction, setDirection] = useState<Direction>('BOTTOM')

  const rotate = (current: Direction): Direction => {
    const idx = dirs.indexOf(current)
    const next = clockwise
      ? (idx - 1 + dirs.length) % dirs.length
      : (idx + 1) % dirs.length
    return dirs[next]
  }

  useEffect(() => {
    if (!hovered) {
      const id = setInterval(() => setDirection(prev => rotate(prev)), duration * 1000)
      return () => clearInterval(id)
    }
  }, [hovered, duration])

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      className={`relative flex w-full items-center justify-center overflow-hidden rounded-full p-px transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${containerClassName}`}
      {...props}
    >
      {/* Rotating gradient border */}
      <motion.div
        className="absolute inset-0 z-0 rounded-[inherit]"
        style={{ filter: 'blur(3px)', width: '100%', height: '100%' }}
        initial={{ background: movingMap[direction] }}
        animate={{
          background: hovered
            ? [movingMap[direction], highlight]
            : movingMap[direction],
        }}
        transition={{ ease: 'linear', duration: hovered ? 0.4 : duration }}
      />
      {/* Inner pill */}
      <div
        className={`relative z-10 w-full rounded-[inherit] bg-black/80 px-6 py-3 text-center text-sm font-semibold text-white backdrop-blur-sm transition-colors duration-300 ${
          hovered ? 'bg-black/60' : 'bg-black/80'
        } ${innerClassName}`}
      >
        {children}
      </div>
    </button>
  )
}
