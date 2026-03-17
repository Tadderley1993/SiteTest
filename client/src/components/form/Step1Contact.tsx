import { motion } from 'framer-motion'
import { HoverBorderGradient } from '../ui/HoverBorderGradient'

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  clientType: string
}

interface Props {
  data: FormData
  onChange: (field: keyof FormData, value: string) => void
  onNext: () => void
  errors: Partial<Record<keyof FormData, string>>
}

const inputCls =
  'w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:bg-white/[0.08] focus:border-white/[0.3] transition-all duration-200'

const labelCls = 'block text-xs font-medium text-white/50 mb-1.5 tracking-wide'

export default function Step1Contact({ data, onChange, onNext, errors }: Props) {
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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>First Name</label>
          <input
            type="text"
            value={data.firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            className={inputCls}
            placeholder="John"
          />
          {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
        </div>
        <div>
          <label className={labelCls}>Last Name</label>
          <input
            type="text"
            value={data.lastName}
            onChange={(e) => onChange('lastName', e.target.value)}
            className={inputCls}
            placeholder="Doe"
          />
          {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
        </div>
      </div>

      <div>
        <label className={labelCls}>Email</label>
        <input
          type="email"
          value={data.email}
          onChange={(e) => onChange('email', e.target.value)}
          className={inputCls}
          placeholder="john@example.com"
        />
        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
      </div>

      <div>
        <label className={labelCls}>Phone</label>
        <input
          type="tel"
          value={data.phone}
          onChange={(e) => onChange('phone', e.target.value)}
          className={inputCls}
          placeholder="(555) 123-4567"
        />
        {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
      </div>

      <div>
        <label className={labelCls}>I'm contacting on behalf of</label>
        <div className="flex gap-2">
          {[
            { value: 'individual', label: 'Myself' },
            { value: 'company', label: 'A Company' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange('clientType', opt.value)}
              className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all duration-200 ${
                data.clientType === opt.value
                  ? 'border-white/40 bg-white/[0.12] text-white'
                  : 'border-white/[0.08] bg-white/[0.03] text-white/40 hover:border-white/20 hover:text-white/60'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {errors.clientType && <p className="text-red-400 text-xs mt-1">{errors.clientType}</p>}
      </div>

      <HoverBorderGradient type="submit" innerClassName="py-2.5">
        Continue →
      </HoverBorderGradient>
    </motion.form>
  )
}
