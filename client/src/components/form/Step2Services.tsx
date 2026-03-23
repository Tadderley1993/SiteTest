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

interface Props {
  selectedServices: string[]
  description: string
  onServiceToggle: (serviceId: string) => void
  onDescriptionChange: (value: string) => void
  onNext: () => void
  onBack: () => void
  errors: { services?: string; description?: string }
}

export default function Step2Services({
  selectedServices,
  description,
  onServiceToggle,
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
      className="space-y-4"
    >
      <div>
        <label className="block text-xs font-medium text-white/50 mb-2 tracking-wide">
          What do you need help with?
        </label>
        <div className="grid grid-cols-2 gap-2">
          {services.map((service) => {
            const Icon = service.icon
            const isSelected = selectedServices.includes(service.id)
            return (
              <motion.button
                key={service.id}
                type="button"
                onClick={() => onServiceToggle(service.id)}
                whileTap={{ scale: 0.97 }}
                className={`p-3 rounded-xl border transition-all duration-200 text-left ${
                  isSelected
                    ? 'border-white/40 bg-white/[0.1] text-white'
                    : 'border-white/[0.08] bg-white/[0.03] text-white/40 hover:border-white/20 hover:bg-white/[0.06] hover:text-white/60'
                }`}
              >
                <Icon className="w-4 h-4 mb-1.5" />
                <span className="text-xs font-medium leading-tight block">{service.label}</span>
              </motion.button>
            )
          })}
        </div>
        {errors.services && <p className="text-red-400 text-xs mt-1.5">{errors.services}</p>}
      </div>

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
