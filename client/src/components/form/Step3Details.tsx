import { motion } from 'framer-motion'
import { HoverBorderGradient } from '../ui/HoverBorderGradient'

const teamSizes = ['Just me', '2–5', '6–20', '20+']

interface Props {
  teamSize: string
  budget: string
  timelineMonths: string
  timelineWeeks: string
  timelineDays: string
  onTeamSizeChange: (value: string) => void
  onBudgetChange: (value: string) => void
  onTimelineChange: (field: 'months' | 'weeks' | 'days', value: string) => void
  onSubmit: () => void
  onBack: () => void
  errors: { teamSize?: string; budget?: string }
  isSubmitting: boolean
}

const inputCls =
  'w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:bg-white/[0.08] focus:border-white/[0.3] transition-all duration-200'

const labelCls = 'block text-xs font-medium text-white/50 mb-1.5 tracking-wide'

export default function Step3Details({
  teamSize,
  budget,
  timelineMonths,
  timelineWeeks,
  timelineDays,
  onTeamSizeChange,
  onBudgetChange,
  onTimelineChange,
  onSubmit,
  onBack,
  errors,
  isSubmitting,
}: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
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
        <label className={labelCls}>Team size</label>
        <div className="flex gap-2">
          {teamSizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => onTeamSizeChange(size)}
              className={`flex-1 py-2 px-1 rounded-xl border text-xs font-medium transition-all duration-200 ${
                teamSize === size
                  ? 'border-white/40 bg-white/[0.12] text-white'
                  : 'border-white/[0.08] bg-white/[0.03] text-white/40 hover:border-white/20 hover:text-white/60'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
        {errors.teamSize && <p className="text-red-400 text-xs mt-1">{errors.teamSize}</p>}
      </div>

      <div>
        <label className={labelCls}>Budget</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">$</span>
          <input
            type="text"
            value={budget}
            onChange={(e) => onBudgetChange(e.target.value)}
            className={`${inputCls} pl-8`}
            placeholder="10,000"
          />
        </div>
        {errors.budget && <p className="text-red-400 text-xs mt-1">{errors.budget}</p>}
      </div>

      <div>
        <label className={labelCls}>Ideal timeline</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { field: 'months' as const, label: 'months', value: timelineMonths },
            { field: 'weeks' as const, label: 'weeks', value: timelineWeeks },
            { field: 'days' as const, label: 'days', value: timelineDays },
          ].map(({ field, label, value }) => (
            <div key={field}>
              <input
                type="number"
                value={value}
                onChange={(e) => onTimelineChange(field, e.target.value)}
                min="0"
                className={`${inputCls} text-center`}
                placeholder="0"
              />
              <span className="block text-xs text-white/30 text-center mt-1">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 py-2.5 rounded-full border border-white/[0.12] text-white/50 text-sm font-medium hover:border-white/25 hover:text-white/70 transition-all duration-200 disabled:opacity-40"
        >
          ← Back
        </button>
        <div className="flex-1">
          <HoverBorderGradient type="submit" disabled={isSubmitting} innerClassName="py-2.5">
            {isSubmitting ? 'Submitting…' : 'Submit →'}
          </HoverBorderGradient>
        </div>
      </div>
    </motion.form>
  )
}
