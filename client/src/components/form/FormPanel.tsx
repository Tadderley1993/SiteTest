import { useState } from 'react'

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'temp-mail.org', 'throwaway.email',
  'yopmail.com', 'maildrop.cc', 'fakeinbox.com', 'trashmail.com', 'trashmail.net',
  'trashmail.me', 'tempinbox.com', 'sharklasers.com', 'guerrillamail.info',
  'spam4.me', 'tempr.email', 'discard.email', 'getairmail.com', 'filzmail.com',
  'getnada.com', 'mailnesia.com', 'mailnull.com', 'spamgourmet.com',
  'spamgourmet.net', 'spamgourmet.org', 'spamhereplease.com',
])
import { AnimatePresence, motion } from 'framer-motion'
import Step1Contact from './Step1Contact'
import Step2Services from './Step2Services'
import Step3Details from './Step3Details'
import SuccessMessage from './SuccessMessage'
import { createSubmission, SubmissionData } from '../../lib/api'

interface FormState {
  firstName: string
  lastName: string
  email: string
  phone: string
  clientType: string
  services: string[]
  painPoints: string[]
  description: string
  teamSize: string
  budget: string
  timelineMonths: string
  timelineWeeks: string
  timelineDays: string
}

const initialFormState: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  clientType: '',
  services: [],
  painPoints: [],
  description: '',
  teamSize: '',
  budget: '',
  timelineMonths: '',
  timelineWeeks: '',
  timelineDays: '',
}

type FormErrors = Partial<Record<keyof FormState, string>>

interface FormPanelProps {
  onComplete?: () => void
}

const stepTitles = ['Contact Info', 'Pain Points', 'Project Details']

export default function FormPanel({ onComplete }: FormPanelProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormState>(initialFormState)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const toggleService = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter((s) => s !== serviceId)
        : [...prev.services, serviceId],
    }))
    if (errors.services) setErrors((prev) => ({ ...prev, services: undefined }))
  }

  const togglePainPoint = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      painPoints: prev.painPoints.includes(id)
        ? prev.painPoints.filter((p) => p !== id)
        : [...prev.painPoints, id],
    }))
  }

  const validateStep1 = (): boolean => {
    const e: FormErrors = {}
    if (!formData.firstName.trim()) e.firstName = 'Required'
    if (!formData.lastName.trim()) e.lastName = 'Required'
    if (!formData.email.trim()) e.email = 'Required'
    else if (!EMAIL_REGEX.test(formData.email)) e.email = 'Enter a valid email address'
    else {
      const domain = formData.email.split('@')[1]?.toLowerCase() ?? ''
      if (DISPOSABLE_DOMAINS.has(domain)) e.email = 'Please use a valid business email'
    }
    if (!formData.phone.trim()) e.phone = 'Required'
    else if (formData.phone.replace(/\D/g, '').length !== 10) e.phone = 'Enter a valid 10-digit phone number'
    if (!formData.clientType) e.clientType = 'Please select an option'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep2 = (): boolean => {
    const e: FormErrors = {}
    if (formData.services.length === 0) e.services = 'Select at least one service'
    if (!formData.description.trim()) e.description = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep3 = (): boolean => {
    const e: FormErrors = {}
    if (!formData.teamSize) e.teamSize = 'Please select a team size'
    if (!formData.budget.trim()) e.budget = 'Required'
    else if (!/^\d[\d,]*$/.test(formData.budget.trim())) e.budget = 'Enter numbers only (e.g. 10000)'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleStep1Next = () => { if (validateStep1()) setStep(2) }
  const handleStep2Next = () => { if (validateStep2()) setStep(3) }

  const handleSubmit = async () => {
    if (!validateStep3()) return
    setIsSubmitting(true)
    setSubmitError('')
    try {
      const submissionData: SubmissionData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        clientType: formData.clientType,
        services: formData.services,
        painPoints: formData.painPoints.length > 0 ? formData.painPoints : undefined,
        description: formData.description,
        teamSize: formData.teamSize,
        budget: formData.budget,
        timelineMonths: formData.timelineMonths || undefined,
        timelineWeeks: formData.timelineWeeks || undefined,
        timelineDays: formData.timelineDays || undefined,
      }
      await createSubmission(submissionData)
      setIsSuccess(true)
    } catch (error: unknown) {
      console.error('Submission error:', error)
      const msg =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Unable to submit. Make sure the server is running and try again.'
      setSubmitError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className="w-full max-w-[420px] relative"
    >
      {/* Glassmorphic card */}
      <div className="relative rounded-2xl border border-white/[0.12] bg-white/[0.06] backdrop-blur-2xl shadow-2xl shadow-black/50 overflow-hidden">

        {/* Top highlight streak */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

        {/* Subtle inner glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-white/[0.04] rounded-full blur-3xl pointer-events-none" />

        <div className="relative p-6 max-h-[calc(100svh-160px)] md:max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-none" style={{ scrollbarWidth: 'none' }}>
          {!isSuccess && (
            <>
              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-6">
                {stepTitles.map((title, i) => (
                  <div key={i} className="flex items-center gap-2 flex-1">
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                          i + 1 < step
                            ? 'bg-white text-black'
                            : i + 1 === step
                            ? 'bg-white text-black ring-2 ring-white/20 ring-offset-1 ring-offset-transparent'
                            : 'bg-white/10 text-white/30'
                        }`}
                      >
                        {i + 1 < step ? (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          i + 1
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-medium tracking-wide transition-colors duration-300 hidden sm:block ${
                          i + 1 <= step ? 'text-white/70' : 'text-white/25'
                        }`}
                      >
                        {title}
                      </span>
                    </div>
                    {i < stepTitles.length - 1 && (
                      <div className="flex-1 h-px mx-1">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            background: i + 1 < step
                              ? 'rgba(255,255,255,0.4)'
                              : 'rgba(255,255,255,0.08)',
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <h2 className="text-lg font-semibold text-white mb-5">
                {stepTitles[step - 1]}
              </h2>
            </>
          )}

          <AnimatePresence mode="wait">
            {isSuccess ? (
              <SuccessMessage key="success" onContinue={onComplete} />
            ) : step === 1 ? (
              <Step1Contact
                key="step1"
                data={formData}
                onChange={updateField}
                onNext={handleStep1Next}
                errors={errors}
              />
            ) : step === 2 ? (
              <Step2Services
                key="step2"
                selectedServices={formData.services}
                selectedPainPoints={formData.painPoints}
                description={formData.description}
                onServiceToggle={toggleService}
                onPainPointToggle={togglePainPoint}
                onDescriptionChange={(v) => updateField('description', v)}
                onNext={handleStep2Next}
                onBack={() => setStep(1)}
                errors={errors}
              />
            ) : (
              <div key="step3" className="space-y-0">
                {submitError && (
                  <div className="mb-4 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs leading-relaxed">
                    {submitError}
                  </div>
                )}
              <Step3Details
                teamSize={formData.teamSize}
                budget={formData.budget}
                timelineMonths={formData.timelineMonths}
                timelineWeeks={formData.timelineWeeks}
                timelineDays={formData.timelineDays}
                onTeamSizeChange={(v) => updateField('teamSize', v)}
                onBudgetChange={(v) => updateField('budget', v)}
                onTimelineChange={(field, v) =>
                  updateField(
                    field === 'months' ? 'timelineMonths' : field === 'weeks' ? 'timelineWeeks' : 'timelineDays',
                    v
                  )
                }
                onSubmit={handleSubmit}
                onBack={() => setStep(2)}
                errors={errors}
                isSubmitting={isSubmitting}
              />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
