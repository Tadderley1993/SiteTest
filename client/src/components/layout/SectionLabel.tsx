interface SectionLabelProps {
  number?: string
  label: string
  className?: string
}

export default function SectionLabel({ number, label, className = '' }: SectionLabelProps) {
  return (
    <span className={`inline-flex items-center gap-2 text-[13px] font-medium tracking-[0.12em] uppercase text-accent ${className}`}>
      {number && <span className="text-accent-dim">{number}</span>}
      {number && <span className="text-accent-dim">/</span>}
      {label}
    </span>
  )
}
