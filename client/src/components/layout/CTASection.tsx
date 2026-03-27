import { useState } from 'react'
import FormPanel from '../form/FormPanel'
import SectionLabel from './SectionLabel'

export default function CTASection() {
  const [formCompleted, setFormCompleted] = useState(false)

  return (
    // Dark section so the glassmorphic form card reads clearly
    <section id="start-project" className="py-24 bg-[#1C1917]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <SectionLabel label="Get Started" className="mb-4" />
          <h2 className="text-h2 font-bold text-[#F5F0E8] mb-4">
            Ready to start your project?
          </h2>
          <p className="text-[17px] text-[#78706A] leading-relaxed">
            Tell me what you need. I'll take care of the rest, on time, on budget, and built to perform.
          </p>
        </div>

        {formCompleted ? (
          <div className="max-w-lg mx-auto text-center py-16">
            <div className="w-16 h-16 rounded-full bg-[rgba(198,168,75,0.15)] flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl text-accent">✓</span>
            </div>
            <h3 className="text-[24px] font-bold text-[#F5F0E8] mb-3">You're all set.</h3>
            <p className="text-[#78706A]">I'll be in touch within 24 hours to discuss your project.</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto flex justify-center">
            <FormPanel onComplete={() => setFormCompleted(true)} />
          </div>
        )}
      </div>
    </section>
  )
}
