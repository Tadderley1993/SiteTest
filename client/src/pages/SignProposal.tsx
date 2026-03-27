import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, PenLine, RotateCcw, AlertCircle, Loader2 } from 'lucide-react'
import { getProposalByToken, signProposal, Proposal } from '../lib/api'

const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'A$' }

function fmt(amount: number, currency = 'USD') {
  const sym = CURRENCY_SYMBOLS[currency] ?? '$'
  return `${sym}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ── Signature Canvas ──────────────────────────────────────────────────────────

interface SignatureCanvasProps {
  onChange: (dataUrl: string | null) => void
}

function SignatureCanvas({ onChange }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const hasStrokes = useRef(false)

  const getPos = (e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const startDraw = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    drawing.current = true
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }, [])

  const draw = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault()
    if (!drawing.current) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    hasStrokes.current = true
  }, [])

  const stopDraw = useCallback(() => {
    if (!drawing.current) return
    drawing.current = false
    if (hasStrokes.current) {
      onChange(canvasRef.current!.toDataURL('image/png'))
    }
  }, [onChange])

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.strokeStyle = '#0d1117'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    canvas.addEventListener('mousedown', startDraw)
    canvas.addEventListener('mousemove', draw)
    canvas.addEventListener('mouseup', stopDraw)
    canvas.addEventListener('mouseleave', stopDraw)
    canvas.addEventListener('touchstart', startDraw, { passive: false })
    canvas.addEventListener('touchmove', draw, { passive: false })
    canvas.addEventListener('touchend', stopDraw)

    return () => {
      canvas.removeEventListener('mousedown', startDraw)
      canvas.removeEventListener('mousemove', draw)
      canvas.removeEventListener('mouseup', stopDraw)
      canvas.removeEventListener('mouseleave', stopDraw)
      canvas.removeEventListener('touchstart', startDraw)
      canvas.removeEventListener('touchmove', draw)
      canvas.removeEventListener('touchend', stopDraw)
    }
  }, [startDraw, draw, stopDraw])

  const clear = () => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    hasStrokes.current = false
    onChange(null)
  }

  return (
    <div className="space-y-2">
      <div className="relative rounded-xl border-2 border-dashed border-gray-300 bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={180}
          className="w-full touch-none cursor-crosshair block"
          style={{ height: '120px' }}
        />
        <div className="absolute top-2 left-3 text-xs text-gray-400 pointer-events-none select-none">
          Sign here
        </div>
      </div>
      <button
        type="button"
        onClick={clear}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Clear signature
      </button>
    </div>
  )
}

// ── Section Block ─────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{title}</h3>
      <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{children}</div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SignProposal() {
  const { token } = useParams<{ token: string }>()
  const [proposal, setProposal] = useState<Partial<Proposal> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [signature, setSignature] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [signed, setSigned] = useState(false)
  const [signedAt, setSignedAt] = useState('')

  useEffect(() => {
    if (!token) return
    getProposalByToken(token)
      .then(data => {
        setProposal(data)
        if (data.clientSignedAt) {
          setSigned(true)
          setSignedAt(new Date(data.clientSignedAt).toLocaleString())
        }
      })
      .catch(e => {
        const msg = e?.response?.data?.error ?? 'Failed to load proposal.'
        setError(msg)
      })
      .finally(() => setLoading(false))
  }, [token])

  const handleSubmit = async () => {
    if (!signature) { setSubmitError('Please draw your signature above.'); return }
    if (!agreed) { setSubmitError('Please check the agreement box.'); return }
    if (!token) return
    setSubmitError('')
    setSubmitting(true)
    try {
      const res = await signProposal(token, signature)
      setSigned(true)
      setSignedAt(new Date(res.signedAt).toLocaleString())
    } catch (e: unknown) {
      const ae = e as { response?: { data?: { error?: string } }; message?: string }
      setSubmitError(ae?.response?.data?.error ?? ae?.message ?? 'Failed to submit signature.')
    } finally {
      setSubmitting(false)
    }
  }

  const sym = CURRENCY_SYMBOLS[proposal?.currency ?? 'USD'] ?? '$'

  let lineItems: { id: string; description: string; qty: number; unitPrice: number; total: number }[] = []
  try { if (proposal?.lineItems) lineItems = JSON.parse(proposal.lineItems) } catch {}

  const discountAmt = proposal?.discountType === 'percent'
    ? (proposal.subtotal ?? 0) * ((proposal.discountValue ?? 0) / 100)
    : (proposal?.discountValue ?? 0)
  const taxAmt = ((proposal?.subtotal ?? 0) - discountAmt) * ((proposal?.taxRate ?? 0) / 100)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#0d1117] py-6 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <img src="/logo.png" alt="Designs By Terrence Adderley" className="h-8 w-auto brightness-0 invert" />
            <div className="text-xs text-gray-400 mt-0.5">designsbyta.com</div>
          </div>
          {proposal && (
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase tracking-widest">Proposal</div>
              <div className="text-sm font-bold text-[#e2f545] mt-0.5">{proposal.proposalNumber}</div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {loading && (
          <div className="flex items-center justify-center py-24 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading proposal…
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-5 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Unable to load proposal</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Already signed */}
        {!loading && signed && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Proposal Signed</h2>
            <p className="text-gray-500">
              This proposal was signed by <strong>{proposal?.clientName}</strong> on {signedAt}.
            </p>
            <p className="text-gray-400 text-sm mt-2">
              A copy has been recorded. Designs By Terrence Adderley will be in touch shortly.
            </p>
          </motion.div>
        )}

        {/* Proposal content + signing form */}
        {!loading && !error && !signed && proposal && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {/* Title card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Prepared for</p>
                  <h1 className="text-xl font-bold text-gray-900">{proposal.clientName}</h1>
                  {proposal.clientCompany && <p className="text-gray-500 text-sm">{proposal.clientCompany}</p>}
                  <p className="text-gray-400 text-sm">{proposal.clientEmail}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Project</p>
                  <p className="text-base font-semibold text-gray-800">{proposal.title}</p>
                  <p className="text-xs text-gray-400 mt-1">Date: {proposal.date}</p>
                  {proposal.validUntil && <p className="text-xs text-gray-400">Valid until: {proposal.validUntil}</p>}
                </div>
              </div>
            </div>

            {/* Proposal body */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm space-y-0">
              {proposal.executiveSummary && (
                <div className="mb-6 p-4 bg-[#fafff0] border-l-4 border-[#c8dc30] rounded-r-xl">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Executive Summary</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{proposal.executiveSummary}</p>
                </div>
              )}
              {proposal.clientNeeds && <Section title="Client Challenges & Needs">{proposal.clientNeeds}</Section>}
              {proposal.proposedSolution && <Section title="Our Proposed Solution">{proposal.proposedSolution}</Section>}
              {proposal.projectScope && <Section title="Project Scope">{proposal.projectScope}</Section>}
              {proposal.deliverables && <Section title="Deliverables">{proposal.deliverables}</Section>}
              {proposal.timeline && <Section title="Timeline & Milestones">{proposal.timeline}</Section>}

              {/* Investment */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Investment</h3>
                {lineItems.length > 0 && (
                  <table className="w-full text-sm mb-4">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-3 py-2 text-xs text-gray-500 font-semibold">Description</th>
                        <th className="text-center px-3 py-2 text-xs text-gray-500 font-semibold w-16">Qty</th>
                        <th className="text-right px-3 py-2 text-xs text-gray-500 font-semibold w-24">Rate</th>
                        <th className="text-right px-3 py-2 text-xs text-gray-500 font-semibold w-24">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item, i) => (
                        <tr key={item.id} className={`border-t border-gray-100 ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                          <td className="px-3 py-2 text-gray-800">{item.description}</td>
                          <td className="px-3 py-2 text-center text-gray-600">{item.qty}</td>
                          <td className="px-3 py-2 text-right text-gray-600">{sym}{item.unitPrice.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right font-medium text-gray-800">{sym}{item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <div className="space-y-1.5 text-sm border-t border-gray-100 pt-3">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span><span>{fmt(proposal.subtotal ?? 0, proposal.currency)}</span>
                  </div>
                  {(proposal.discountValue ?? 0) > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>Discount{proposal.discountType === 'percent' ? ` (${proposal.discountValue}%)` : ''}</span>
                      <span>−{fmt(discountAmt, proposal.currency)}</span>
                    </div>
                  )}
                  {(proposal.taxRate ?? 0) > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>Tax ({proposal.taxRate}%)</span>
                      <span>{fmt(taxAmt, proposal.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base text-gray-900 border-t border-gray-200 pt-2 mt-1">
                    <span>Total</span>
                    <span>{fmt(proposal.total ?? 0, proposal.currency)}</span>
                  </div>
                </div>
              </div>

              {proposal.paymentTerms && (
                <div className="mt-6">
                  <Section title="Payment Terms">{proposal.paymentTerms}</Section>
                </div>
              )}
              {proposal.termsConditions && (
                <div className="mt-4">
                  <Section title="Terms & Conditions">
                    <span className="text-xs">{proposal.termsConditions}</span>
                  </Section>
                </div>
              )}
            </div>

            {/* Signing section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <PenLine className="w-5 h-5 text-[#5a7a0a]" />
                <h2 className="text-base font-bold text-gray-900">Sign this Proposal</h2>
              </div>

              <p className="text-sm text-gray-500 mb-5">
                By signing below, you agree to the scope of work, pricing, and terms outlined in this proposal.
              </p>

              <div className="mb-4">
                <label className="block text-xs text-gray-500 font-medium mb-2">
                  Your signature <span className="text-red-400">*</span>
                </label>
                <SignatureCanvas onChange={setSignature} />
              </div>

              <label className="flex items-start gap-3 cursor-pointer mb-5">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-[#5a7a0a] cursor-pointer"
                />
                <span className="text-sm text-gray-600">
                  I, <strong>{proposal.clientName}</strong>, have read and agree to the terms and conditions outlined in this proposal ({proposal.proposalNumber}).
                </span>
              </label>

              {submitError && (
                <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {submitError}
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !signature || !agreed}
                className="w-full py-3 bg-[#0d1117] text-[#e2f545] font-bold text-sm rounded-xl hover:bg-[#1a2433] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {submitting ? 'Submitting…' : 'I Agree — Sign Proposal'}
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pb-10 text-xs text-gray-400">
        Powered by <span className="font-bold">Designs By Terrence Adderley</span> · designsbyta.com
      </div>
    </div>
  )
}
