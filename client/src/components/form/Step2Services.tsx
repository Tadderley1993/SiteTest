import { motion } from 'framer-motion'
import { Monitor, Smartphone, Palette, RefreshCw, Megaphone, Search } from 'lucide-react'

import { HoverBorderGradient } from '../ui/HoverBorderGradient'

const services = [
  { id: 'website', label: 'Website Development', icon: Monitor },
  { id: 'mobile', label: 'Mobile Development', icon: Smartphone },
  { id: 'brand', label: 'Brand Identity', icon: Palette },
  { id: 'revamp', label: 'Identity Revamp', icon: RefreshCw },
  { id: 'marketing', label: 'Marketing Material', icon: Megaphone },
  { id: 'seo', label: 'SEO Optimization', icon: Search },
]

const painPoints = [
  { id: 'outdated', label: 'Outdated website' },
  { id: 'no-presence', label: 'No online presence' },
  { id: 'low-traffic', label: 'Low traffic' },
  { id: 'mobile', label: 'Poor mobile experience' },
  { id: 'branding', label: 'Weak brand identity' },
  { id: 'conversions', label: 'Low conversions' },
  { id: 'speed', label: 'Slow load times' },
  { id: 'seo', label: 'Not ranking on Google' },
  { id: 'cms', label: 'Hard to update content' },
  { id: 'messaging', label: 'No clear message' },
]

interface Props {
  selectedServices: string[]
  selectedPainPoints: string[]
  description: string
  onServiceToggle: (serviceId: string) => void
  onPainPointToggle: (id: string) => void
  onDescriptionChange: (value: string) => void
  onNext: () => void
  onBack: () => void
  errors: { services?: string; description?: string }
}

export default function Step2Services({
  selectedServices,
  selectedPainPoints,
  description,
  onServiceToggle,
  onPainPointToggle,
  onDescriptionChange,
  onNext,
  onBack,
  errors,
}: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext()
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      {/* Pain Points */}
      <div>
        <label className="block text-xs font-medium text-white/50 mb-2 tracking-wide">
          What's holding you back?
          <span className="ml-1.5 text-white/25 font-normal">(select all that apply)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {painPoints.map((point) => {
            const isSelected = selectedPainPoints.includes(point.id)
            return (
              <button
                key={point.id}
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPainPointToggle(point.id) }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                  isSelected
                    ? 'bg-white text-black border-white'
                    : 'bg-transparent text-white/45 border-white/[0.12] hover:border-white/30 hover:text-white/65'
                }`}
              >
                {point.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Services */}
      <div>
        <label className="block text-xs font-medium text-white/50 mb-2 tracking-wide">
          What do you need?
          <span className="ml-1.5 text-white/25 font-normal">(select all that apply)</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {services.map((service) => {
            const Icon = service.icon
            const isSelected = selectedServices.includes(service.id)
            return (
              <button
                key={service.id}
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onServiceToggle(service.id) }}
                className={`p-3 rounded-xl border transition-all duration-200 text-left relative ${
                  isSelected
                    ? 'border-white/60 bg-white/[0.14] text-white'
                    : 'border-white/[0.08] bg-white/[0.03] text-white/40 hover:border-white/20 hover:bg-white/[0.06] hover:text-white/60'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center">
                    <svg className="w-2 h-2 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
                <Icon className="w-4 h-4 mb-1.5" />
                <span className="text-xs font-medium leading-tight block">{service.label}</span>
              </button>
            )
          })}
        </div>
        {errors.services && <p className="text-red-400 text-xs mt-1.5">{errors.services}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-white/50 mb-1.5 tracking-wide">
          Describe your project
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
          className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:bg-white/[0.08] focus:border-white/[0.3] transition-all duration-200 resize-none"
          placeholder="Tell us about your project, goals, and any requirements..."
        />
        {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-2.5 rounded-full border border-white/[0.12] text-white/50 text-sm font-medium hover:border-white/25 hover:text-white/70 transition-all duration-200"
        >
          ← Back
        </button>
        <div className="flex-1">
          <HoverBorderGradient type="submit" innerClassName="py-2.5">
            Continue →
          </HoverBorderGradient>
        </div>
      </div>
    </motion.form>
  )
}
