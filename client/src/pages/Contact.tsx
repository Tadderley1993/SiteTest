import { useState } from 'react'
import { motion } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'
import Footer from '../components/layout/Footer'
import { createSubmission } from '../lib/api'

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

const PROJECT_TYPES = [
  'Brand Identity',
  'Web Design',
  'Web Development',
  'E-Commerce',
  'SEO Optimization',
  'Ongoing Maintenance',
  'Other',
]

const BUDGETS = ['Under $2,000', '$2,000 – $5,000', '$5,000 – $10,000', '$10,000 – $25,000', '$25,000+']
const TIMELINES = ['ASAP', '1–2 months', '3–4 months', '6+ months', 'Flexible']

interface FormState {
  firstName: string
  lastName: string
  email: string
  phone: string
  businessName: string
  projectTypes: string[]
  budget: string
  timeline: string
  message: string
}

const initial: FormState = {
  firstName: '', lastName: '', email: '', phone: '',
  businessName: '', projectTypes: [], budget: '', timeline: '', message: '',
}

type Errors = Partial<Record<keyof FormState, string>>

function toggleItem(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]
}

function Field({
  label, id, error, children,
}: {
  label: string; id: string; error?: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12px] font-semibold tracking-[0.08em] uppercase text-[#474747]">
        {label}
      </label>
      {children}
      {error && <p className="text-[12px] text-red-600">{error}</p>}
    </div>
  )
}

export default function Contact() {
  const [form, setForm] = useState<FormState>(initial)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [serverError, setServerError] = useState('')

  const set = (field: keyof FormState, val: string) => {
    setForm(p => ({ ...p, [field]: val }))
    if (errors[field]) setErrors(p => ({ ...p, [field]: undefined }))
  }

  const validate = (): boolean => {
    const e: Errors = {}
    if (!form.firstName.trim()) e.firstName = 'Required'
    if (!form.lastName.trim()) e.lastName = 'Required'
    if (!form.email.trim()) e.email = 'Required'
    else if (!EMAIL_REGEX.test(form.email)) e.email = 'Enter a valid email address'
    if (!form.phone.trim()) e.phone = 'Required'
    else if (form.phone.replace(/\D/g, '').length < 10) e.phone = 'Enter a valid phone number'
    if (form.projectTypes.length === 0) e.projectTypes = 'Select at least one service'
    if (!form.budget) e.budget = 'Please select a budget range'
    if (!form.message.trim()) e.message = 'Tell me about your project'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setServerError('')
    try {
      await createSubmission({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        clientType: form.businessName || 'Not provided',
        services: form.projectTypes,
        description: [
          form.message,
          form.timeline ? `Timeline: ${form.timeline}` : '',
        ].filter(Boolean).join('\n\n'),
        teamSize: '1-5',
        budget: form.budget,
      })
      setDone(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        || 'Something went wrong. Please try again.'
      setServerError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = (field: keyof FormState) =>
    `w-full bg-white border px-4 py-3 text-[14px] text-black placeholder-[#999] focus:outline-none focus:border-black transition-colors ${
      errors[field] ? 'border-red-500' : 'border-[#e5e5e5]'
    }`

  return (
    <PageWrapper
      title="Contact Terrence Adderley — Book a Free Web Design Consultation"
      description="Book a free 30-minute consultation with Terrence Adderley. Boston-based web designer ready to discuss your project, goals, and budget."
      canonical="https://designsbyta.com/contact"
    >

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="bg-white pt-20 pb-12 md:pt-28 md:pb-20 px-6 lg:px-8 border-b border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#777] mb-6">Contact</p>
            <h1 className="text-[clamp(36px,6vw,72px)] font-extrabold leading-[1.0] tracking-[-0.04em] text-black mb-5 max-w-2xl uppercase">
              Let's Build Something Great.
            </h1>
            <p className="text-[17px] text-[#474747] leading-relaxed max-w-lg">
              Tell me about your project. I'll respond within 24 hours with honest thoughts, clear pricing, and a plan.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── FORM + SIDEBAR ───────────────────────────────────────── */}
      <section className="bg-[#f3f3f4] py-16 md:py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Form */}
          <div className="lg:col-span-2">
            {done ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-10 text-center"
              >
                <span className="material-symbols-outlined text-[48px] text-black block mb-4">check_circle</span>
                <h2 className="text-[24px] font-bold text-black mb-3">Message received.</h2>
                <p className="text-[15px] text-[#474747] leading-relaxed">
                  Thanks for reaching out. I'll be in touch within 24 hours to discuss your project.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="bg-white p-8 md:p-10">
                <h2 className="text-[18px] font-bold text-black mb-8">Project Inquiry</h2>

                {serverError && (
                  <div className="mb-6 p-4 border border-red-200 bg-red-50 text-[13px] text-red-700">
                    {serverError}
                  </div>
                )}

                {/* Name row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                  <Field label="First Name" id="firstName" error={errors.firstName}>
                    <input
                      id="firstName"
                      type="text"
                      value={form.firstName}
                      onChange={e => set('firstName', e.target.value)}
                      placeholder="John"
                      className={inputClass('firstName')}
                    />
                  </Field>
                  <Field label="Last Name" id="lastName" error={errors.lastName}>
                    <input
                      id="lastName"
                      type="text"
                      value={form.lastName}
                      onChange={e => set('lastName', e.target.value)}
                      placeholder="Smith"
                      className={inputClass('lastName')}
                    />
                  </Field>
                </div>

                {/* Email + Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                  <Field label="Email Address" id="email" error={errors.email}>
                    <input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      placeholder="john@company.com"
                      className={inputClass('email')}
                    />
                  </Field>
                  <Field label="Phone Number" id="phone" error={errors.phone}>
                    <input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={e => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                        let formatted = digits
                        if (digits.length >= 7) {
                          formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
                        } else if (digits.length >= 4) {
                          formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`
                        } else if (digits.length >= 1) {
                          formatted = `(${digits}`
                        }
                        set('phone', formatted)
                      }}
                      placeholder="(617) 555-0100"
                      className={inputClass('phone')}
                    />
                  </Field>
                </div>

                {/* Business Name */}
                <div className="mb-5">
                  <Field label="Business Name" id="businessName" error={errors.businessName}>
                    <input
                      id="businessName"
                      type="text"
                      value={form.businessName}
                      onChange={e => set('businessName', e.target.value)}
                      placeholder="Acme Inc."
                      className={inputClass('businessName')}
                    />
                  </Field>
                </div>

                {/* Services — multi-select chips */}
                <div className="mb-5">
                  <label className="text-[12px] font-semibold tracking-[0.08em] uppercase text-[#474747] block mb-2">
                    Services Needed
                    <span className="ml-1.5 text-[#999] font-normal normal-case tracking-normal">(select all that apply)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PROJECT_TYPES.map(t => {
                      const isSelected = form.projectTypes.includes(t)
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={(e) => { e.preventDefault(); setForm(p => ({ ...p, projectTypes: toggleItem(p.projectTypes, t) })); if (errors.projectTypes) setErrors(p => ({ ...p, projectTypes: undefined })) }}
                          className={`px-4 py-2 text-[12px] font-semibold tracking-[0.04em] border transition-all duration-150 ${
                            isSelected
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-[#474747] border-[#e5e5e5] hover:border-black hover:text-black'
                          }`}
                        >
                          {isSelected && <span className="mr-1.5">✓</span>}
                          {t}
                        </button>
                      )
                    })}
                  </div>
                  {errors.projectTypes && <p className="text-[12px] text-red-600 mt-1.5">{errors.projectTypes}</p>}
                </div>

                {/* Budget + Timeline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                  <Field label="Budget Range" id="budget" error={errors.budget}>
                    <select
                      id="budget"
                      value={form.budget}
                      onChange={e => set('budget', e.target.value)}
                      className={`${inputClass('budget')} cursor-pointer`}
                    >
                      <option value="">Select a range</option>
                      {BUDGETS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Timeline" id="timeline" error={errors.timeline}>
                    <select
                      id="timeline"
                      value={form.timeline}
                      onChange={e => set('timeline', e.target.value)}
                      className={`${inputClass('timeline')} cursor-pointer`}
                    >
                      <option value="">Select a timeline</option>
                      {TIMELINES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                {/* Message */}
                <div className="mb-8">
                  <Field label="Project Details" id="message" error={errors.message}>
                    <textarea
                      id="message"
                      rows={5}
                      value={form.message}
                      onChange={e => set('message', e.target.value)}
                      placeholder="Tell me about your project — goals, audience, current challenges, and anything else that's important..."
                      className={`${inputClass('message')} resize-none`}
                    />
                  </Field>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-black text-white text-[12px] font-semibold tracking-[0.1em] uppercase py-4 hover:bg-[#222] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-8">
            {/* Contact info */}
            <div className="bg-white p-7">
              <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#777] mb-5">Direct Contact</p>
              <a
                href="mailto:terrenceadderley@designsbyta.com"
                className="text-[15px] font-bold text-black hover:text-[#474747] transition-colors block mb-2"
              >
                terrenceadderley@designsbyta.com
              </a>
              <p className="text-[13px] text-[#777]">Boston, MA</p>
            </div>

            {/* What happens next */}
            <div className="bg-white p-7">
              <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#777] mb-5">What Happens Next</p>
              <div className="flex flex-col gap-5">
                {[
                  { n: '01', title: 'I review your inquiry', desc: 'I read every submission personally and take time to understand your goals.' },
                  { n: '02', title: 'You get a response in 24h', desc: 'A direct reply with my thoughts, questions, and a proposed next step.' },
                  { n: '03', title: 'Free 30-min consultation', desc: 'We hop on a call to align on scope, timeline, and budget before any commitment.' },
                  { n: '04', title: 'Proposal & kickoff', desc: 'Clear, itemized proposal. Once aligned, we start building.' },
                ].map(({ n, title, desc }) => (
                  <div key={n} className="flex gap-4">
                    <span className="text-[11px] font-bold text-[#c6c6c6] pt-0.5 shrink-0 w-5">{n}</span>
                    <div>
                      <p className="text-[13px] font-bold text-black mb-0.5">{title}</p>
                      <p className="text-[12px] text-[#777] leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </PageWrapper>
  )
}
