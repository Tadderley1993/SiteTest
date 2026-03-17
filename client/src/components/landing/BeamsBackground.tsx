import { motion } from 'framer-motion'

interface BeamProps {
  x: string
  rotate: number
  color: string
  opacity: number
  width: string
  height: string
  delay: number
  duration: number
  blur: number
}

function Beam({ x, rotate, color, opacity, width, height, delay, duration, blur }: BeamProps) {
  return (
    <motion.div
      style={{
        position: 'absolute',
        top: '-20%',
        left: x,
        width,
        height,
        background: `linear-gradient(180deg, transparent 0%, ${color} 30%, ${color} 70%, transparent 100%)`,
        borderRadius: '50%',
        transform: `rotate(${rotate}deg)`,
        transformOrigin: 'center top',
        filter: `blur(${blur}px)`,
        opacity,
        pointerEvents: 'none',
      }}
      animate={{
        opacity: [opacity * 0.6, opacity, opacity * 0.7, opacity],
        scaleX: [1, 1.08, 0.95, 1],
        y: [0, 10, -5, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

export default function BeamsBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* Wide diffuse cyan glow — left */}
      <Beam x="-5%" rotate={-12} color="rgba(71,198,255,0.55)" opacity={0.6} width="35%" height="130%" delay={0} duration={7} blur={60} />

      {/* Narrow sharp cyan beam — left-centre */}
      <Beam x="8%" rotate={-8} color="rgba(71,198,255,0.9)" opacity={0.45} width="12%" height="120%" delay={1.2} duration={9} blur={20} />

      {/* Thin cyan highlight */}
      <Beam x="18%" rotate={-4} color="rgba(180,235,255,0.8)" opacity={0.3} width="6%" height="110%" delay={2.5} duration={11} blur={8} />

      {/* Central white-cyan core */}
      <Beam x="22%" rotate={0} color="rgba(220,245,255,0.95)" opacity={0.2} width="8%" height="125%" delay={0.5} duration={8} blur={15} />

      {/* Yellow-green accent beam — right side */}
      <Beam x="60%" rotate={14} color="rgba(232,255,71,0.75)" opacity={0.35} width="18%" height="115%" delay={1.8} duration={10} blur={35} />

      {/* Narrow yellow highlight */}
      <Beam x="72%" rotate={18} color="rgba(232,255,71,0.9)" opacity={0.25} width="8%" height="105%" delay={3} duration={13} blur={12} />

      {/* Far-right wide cyan fill */}
      <Beam x="75%" rotate={22} color="rgba(71,198,255,0.5)" opacity={0.3} width="30%" height="120%" delay={0.8} duration={9} blur={70} />

      {/* Bottom ambient glow — cyan */}
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '0%',
          width: '55%',
          height: '40%',
          background: 'radial-gradient(ellipse at center, rgba(71,198,255,0.15) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Bottom ambient glow — yellow */}
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '5%',
          width: '40%',
          height: '35%',
          background: 'radial-gradient(ellipse at center, rgba(232,255,71,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
    </div>
  )
}
