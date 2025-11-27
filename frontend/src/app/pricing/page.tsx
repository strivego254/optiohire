'use client'

import { motion, useReducedMotion } from 'framer-motion'
import PricingSection from '@/components/ui/pricing-section'
import { Card, CardContent } from '@/components/ui/card'
import { ShieldCheck, Clock, TrendingUp, Users } from 'lucide-react'

const stats = [
  {
    label: 'Avg. Time-to-Hire Reduction',
    value: '5x faster',
  },
  {
    label: 'AI Match Accuracy',
    value: '95% match',
  },
  {
    label: 'Operational Cost Savings',
    value: '70% saved',
  },
]

const assurances = [
  {
    icon: ShieldCheck,
    title: 'Enterprise-Grade Security',
    description: 'SOC 2 compliant infrastructure with end-to-end encryption and granular access controls.',
  },
  {
    icon: Users,
    title: 'White-Glove Onboarding',
    description: 'Dedicated rollout specialists and success playbooks tailored to your hiring workflows.',
  },
  {
    icon: TrendingUp,
    title: 'Proven ROI Metrics',
    description: 'Trackable outcomes with dashboards that surface fill-rate, retention, and pipeline velocity.',
  },
  {
    icon: Clock,
    title: '24/7 Priority Support',
    description: 'Always-on support team with guaranteed sub-30 minute response for enterprise accounts.',
  },
]

const fadeUp = (index: number, disableMotion: boolean) => ({
  initial: disableMotion ? undefined : { opacity: 0, y: 24 },
  whileInView: disableMotion ? undefined : { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: disableMotion
    ? undefined
    : {
        delay: index * 0.1,
        duration: 0.6,
        ease: 'easeOut',
      },
})

export default function PricingPage() {
  const prefersReducedMotion = useReducedMotion()
  const disableMotion = prefersReducedMotion ?? false

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Pricing Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 px-4 sm:pt-40 sm:pb-24 md:pt-48 md:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#2D2DDD40,transparent_60%)]" aria-hidden="true" />
        <div className="container mx-auto max-w-6xl relative z-10 text-center">
          <motion.div
            {...fadeUp(0, disableMotion)}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-full px-4 py-2 mb-6"
          >
            <span className="text-xs sm:text-sm font-medium text-white/80">Transparent pricing engineered for HR velocity</span>
          </motion.div>
          <motion.h1
            {...fadeUp(1, disableMotion)}
            className="text-[32px] sm:text-[48px] md:text-[64px] font-figtree font-extralight leading-[1.05] tracking-tight mb-4"
          >
            Choose the plan that accelerates your hiring strategy
          </motion.h1>
          <motion.p
            {...fadeUp(2, disableMotion)}
            className="text-base sm:text-xl font-figtree font-light text-gray-300 max-w-3xl mx-auto"
          >
            Start with the plan that matches your team size today and scale effortlessly. Every tier includes AI-powered screening, collaborative workflows, and analytics out of the box.
          </motion.p>

          <motion.div
            {...fadeUp(3, disableMotion)}
            className="mt-8 flex flex-wrap justify-center gap-4"
          >
            {stats.map(stat => (
              <div
                key={stat.label}
                className="rounded-full border border-white/10 bg-white/5 px-5 py-2"
              >
                <span className="block text-xs uppercase tracking-wide text-gray-300 font-figtree">
                  {stat.label}
                </span>
                <span className="text-lg font-figtree font-semibold text-white">
                  {stat.value}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="relative bg-black">
        <PricingSection />
      </section>

      {/* Assurance Grid */}
      <section className="py-16 sm:py-20 md:py-24 px-4 bg-black">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            {...fadeUp(0, disableMotion)}
            className="text-center mb-12"
          >
            <h2 className="text-[27px] sm:text-[57px] md:text-[69px] font-extralight font-figtree leading-[1.05] tracking-tight">
              What every plan delivers
            </h2>
            <p className="text-base sm:text-xl font-figtree font-light text-gray-300 max-w-3xl mx-auto">
              Beyond pricing, we commit to security, enablement, and measurable business outcomes from day one.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 sm:gap-6">
            {assurances.map((assurance, index) => (
              <motion.div key={assurance.title} {...fadeUp(index / 2, disableMotion)}>
                <Card className="bg-neutral-900/70 border border-neutral-800/80 backdrop-blur-lg h-full">
                  <CardContent className="p-6 flex flex-col gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#2D2DDD] flex items-center justify-center shadow-lg shadow-[#2D2DDD40]">
                      <assurance.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-figtree font-medium text-white mb-2">
                        {assurance.title}
                      </h3>
                      <p className="text-sm text-gray-300 font-figtree font-light leading-relaxed">
                        {assurance.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 px-4 bg-black">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            {...fadeUp(0, disableMotion)}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/10 backdrop-blur-lg px-6 sm:px-10 md:px-16 py-12 text-center"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#2D2DDD33,transparent_70%)]" aria-hidden="true" />
            <div className="relative z-10 space-y-6">
              <h2 className="text-[28px] sm:text-[40px] md:text-[52px] font-figtree font-extralight leading-tight">
                Ready to experience faster, smarter hiring?
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-100 font-figtree font-light max-w-3xl mx-auto">
                Launch in days with guided onboarding, or partner with our solution architects for a custom enterprise rollout.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="/auth/signup"
                  className="inline-flex items-center justify-center rounded-full bg-[#2D2DDD] px-8 py-3 font-figtree font-medium text-white transition-colors hover:bg-[#2424c0]"
                >
                  Start free trial
                </a>
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full border border-white/30 px-8 py-3 font-figtree font-medium text-white hover:bg-white/10"
                >
                  Talk to sales
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
