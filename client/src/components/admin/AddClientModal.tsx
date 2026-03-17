import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UserPlus, Users } from 'lucide-react'
import { Submission, ClientFormData } from '../../lib/api'

interface Props {
  submissions: Submission[]
  onClose: () => void
  onCreate: (data: ClientFormData) => void
}

export default function AddClientModal({ submissions, onClose, onCreate }: Props) {
  const [mode, setMode] = useState<'manual' | 'from-submission'>('manual')
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [form, setForm] = useState<ClientFormData>({
    firstName: '',
    lastName: '',
    title: '',
    email: '',
    phone: '',
    website: '',
    organization: '',
    instagram: '',
    twitter: '',
    linkedin: '',
    facebook: '',
    notes: '',
  })

  const handleSubmissionSelect = (sub: Submission | null) => {
    setSelectedSubmission(sub)
    if (sub) {
      setForm(prev => ({
        ...prev,
        firstName: sub.firstName,
        lastName: sub.lastName,
        email: sub.email,
        phone: sub.phone,
        submissionId: sub.id,
      }))
    } else {
      setForm(prev => ({ ...prev, firstName: '', lastName: '', email: '', phone: '', submissionId: undefined }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate(form)
  }

  const field = (label: string, key: keyof ClientFormData, placeholder?: string, type = 'text') => (
    <div>
      <label className="block text-xs text-text-muted mb-1">{label}</label>
      <input
        type={type}
        value={(form[key] as string) ?? ''}
        onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-text-primary placeholder-text-muted/40 focus:outline-none focus:border-accent/50 text-sm transition-colors"
      />
    </div>
  )

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#0d1017] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-text-primary">Add Current Client</h2>
            <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-2 px-6 pt-4">
            <button
              onClick={() => setMode('manual')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'manual'
                  ? 'bg-accent text-black'
                  : 'bg-white/5 text-text-muted hover:text-text-primary'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Enter Manually
            </button>
            <button
              onClick={() => setMode('from-submission')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'from-submission'
                  ? 'bg-accent text-black'
                  : 'bg-white/5 text-text-muted hover:text-text-primary'
              }`}
            >
              <Users className="w-4 h-4" />
              From Submissions
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Submission picker */}
            {mode === 'from-submission' && (
              <div>
                <label className="block text-xs text-text-muted mb-2">Select a Submission</label>
                {submissions.length === 0 ? (
                  <p className="text-sm text-text-muted">No submissions available.</p>
                ) : (
                  <select
                    value={selectedSubmission?.id ?? ''}
                    onChange={e => {
                      const sub = submissions.find(s => s.id === Number(e.target.value)) ?? null
                      handleSubmissionSelect(sub)
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-text-primary focus:outline-none focus:border-accent/50 text-sm transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">— Choose a submission —</option>
                    {submissions.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.firstName} {sub.lastName} · {sub.email}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Form fields */}
            <div className="grid grid-cols-2 gap-4">
              {field('First Name *', 'firstName', 'Jane')}
              {field('Last Name *', 'lastName', 'Doe')}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {field('Email *', 'email', 'jane@company.com', 'email')}
              {field('Phone', 'phone', '+1 (555) 000-0000')}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {field('Title / Role', 'title', 'CEO, Founder, etc.')}
              {field('Organization', 'organization', 'Company name')}
            </div>
            {field('Website', 'website', 'https://example.com', 'url')}

            <div className="pt-1">
              <p className="text-xs text-text-muted mb-3 uppercase tracking-widest">Social Media</p>
              <div className="grid grid-cols-2 gap-4">
                {field('Instagram', 'instagram', '@handle')}
                {field('Twitter / X', 'twitter', '@handle')}
                {field('LinkedIn', 'linkedin', 'linkedin.com/in/...')}
                {field('Facebook', 'facebook', 'facebook.com/...')}
              </div>
            </div>

            <div>
              <label className="block text-xs text-text-muted mb-1">Notes</label>
              <textarea
                value={form.notes ?? ''}
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any initial notes..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-text-primary placeholder-text-muted/40 focus:outline-none focus:border-accent/50 text-sm transition-colors resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 pb-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-lg border border-white/10 text-text-muted hover:text-text-primary text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!form.firstName || !form.lastName || !form.email}
                className="px-5 py-2 rounded-lg bg-accent text-black font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors"
              >
                Add Client
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
