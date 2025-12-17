'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Mail,
  Phone,
  Bot,
  ShieldCheck,
  MessageSquare,
  LifeBuoy,
  Building2,
  Clock4,
  Globe2,
  Sparkles,
  Briefcase,
} from 'lucide-react'

const ACCENT = '#2D2DDD'

const stats = [
  {
    label: 'Average response time',
    value: '< 10 minutes',
  },
  {
    label: 'Global support teams',
    value: '1 regions',
  },
  {
    label: 'Enterprise SLA uptime',
    value: '99.9%',
  },
]

const contactMethods = [
  {
    title: 'Talk to sales',
    description: 'Design a tailored AI hiring rollout for your team and accelerate ROI in under 30 days.',
    cta: 'Book a strategy session',
    href: 'mailto:support@optiohire.com',
    icon: Briefcase,
  },
  {
    title: 'Product support',
    description: '24/7 technical assistance with proactive monitoring and guided troubleshooting workflows.',
    cta: 'Open a support ticket',
    href: 'mailto:support@optiohire.com',
    icon: LifeBuoy,
  },
  {
    title: 'Partner with us',
    description: 'Co-build integrations, reseller programs, and innovation pilots with our platform team.',
    cta: 'Connect with partnerships',
    href: 'mailto:support@optiohire.com',
    icon: Building2,
  },
]

const infoHighlights = [
  {
    title: 'Location',
    copy: 'Nairobi, Kenya',
    icon: Globe2,
  },
  {
    title: 'Availability',
    copy: 'Live chat & phone support 06:00–23:00 EAT, Monday–Sunday',
    icon: Clock4,
  },
  {
    title: 'Security posture',
    copy: 'GDPR-ready and Continuous penetration testing',
    icon: ShieldCheck,
  },
]

import { contactSchema, type ContactFormValues } from '@/lib/schemas/contact'

const fadeUp = (index: number, disable: boolean) => ({
  initial: disable ? undefined : { opacity: 0, y: 28 },
  whileInView: disable ? undefined : { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.4 },
  transition: disable
    ? undefined
    : {
        delay: index * 0.1,
        duration: 0.6,
        ease: 'easeOut',
      },
})

export default function ContactPage() {
  const prefersReducedMotion = useReducedMotion()
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const disableMotion = prefersReducedMotion ?? false

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    mode: 'onBlur',
  })

  const onSubmit = async (values: ContactFormValues) => {
    try {
      setStatus('idle')
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error?.message || 'Failed to submit contact request')
      }

      setStatus('success')
      reset()
    } catch (error) {
      setStatus('error')
      console.error('Contact form error', error)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative overflow-hidden pt-32 pb-20 px-4 sm:pt-40 sm:pb-24 md:pt-48 md:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#2D2DDD33,transparent_70%)]" aria-hidden="true" />
        <div className="container mx-auto max-w-6xl relative z-10 text-center space-y-6">
          <motion.span
            {...fadeUp(0, disableMotion)}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs sm:text-sm font-figtree font-medium text-white/80"
          >
            <Sparkles className="h-4 w-4" />
            Let’s build the future of hiring together
          </motion.span>
          <motion.h1
            {...fadeUp(1, disableMotion)}
            className="text-[32px] sm:text-[48px] md:text-[64px] font-figtree font-extralight leading-[1.05] tracking-tight"
          >
            Contact our AI hiring specialists
          </motion.h1>
          <motion.p
            {...fadeUp(2, disableMotion)}
            className="mx-auto max-w-3xl text-base sm:text-xl font-figtree font-light text-gray-300"
          >
            Whether you’re exploring automation, scaling globally, or need tactical support, our experts respond quickly with answers tailored to your hiring goals.
          </motion.p>
          <motion.div
            {...fadeUp(3, disableMotion)}
            className="flex flex-wrap justify-center gap-4"
          >
            {stats.map(stat => (
              <div key={stat.label} className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-left">
                <p className="text-xs font-figtree uppercase tracking-wide text-gray-300">{stat.label}</p>
                <p className="text-lg font-figtree font-medium text-white">{stat.value}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:pb-20 md:pb-24">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-3 md:gap-8 md:grid-cols-3">
            {contactMethods.map((method, index) => (
              <motion.div
                key={method.title}
                {...fadeUp(index, disableMotion)}
                className={cn(
                  'col-span-1',
                  index === contactMethods.length - 1 &&
                    'col-span-2 flex justify-center sm:col-span-1'
                )}
              >
                <Card
                  className={cn(
                    'h-full border-white/10 bg-white/5 backdrop-blur-xl transition-transform hover:-translate-y-1 hover:bg-white/10',
                    index === contactMethods.length - 1 && 'w-full max-w-[22rem] sm:max-w-none'
                  )}
                >
                  <CardContent className="flex h-full flex-col gap-4 p-6">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                      <method.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-figtree font-medium text-white">{method.title}</h2>
                      <p className="text-sm font-figtree font-light text-gray-300 leading-relaxed">
                        {method.description}
                      </p>
                    </div>
                    <a
                      href={method.href}
                      className="mt-auto inline-flex items-center gap-2 text-sm font-figtree font-medium text-[#2D2DDD] hover:text-white"
                    >
                      {method.cta}
                      <Mail className="h-4 w-4" />
                    </a>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:pb-20 md:pb-24">
        <div className="container mx-auto max-w-6xl grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.form
            {...fadeUp(0, disableMotion)}
            onSubmit={handleSubmit(onSubmit)}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-xl"
            aria-label="Send us a message"
          >
            <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full opacity-10 blur-3xl" style={{ background: ACCENT }} aria-hidden="true" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="fullName" className="text-xs sm:text-sm font-figtree font-medium text-white/80">
                  Full name
                </label>
                <input
                  id="fullName"
                  {...register('fullName')}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-3 text-sm font-figtree text-white placeholder-white/50 outline-none transition focus:ring-2 focus:ring-[#2D2DDD]"
                  placeholder="Jane Doe"
                  aria-invalid={!!errors.fullName}
                  autoComplete="name"
                />
                {errors.fullName && <p className="text-xs font-figtree text-red-300">{errors.fullName.message}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-xs sm:text-sm font-figtree font-medium text-white/80">
                  Work email
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-3 text-sm font-figtree text-white placeholder-white/50 outline-none transition focus:ring-2 focus:ring-[#2D2DDD]"
                  placeholder="you@company.com"
                  aria-invalid={!!errors.email}
                  autoComplete="email"
                />
                {errors.email && <p className="text-xs font-figtree text-red-300">{errors.email.message}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="company" className="text-xs sm:text-sm font-figtree font-medium text-white/80">
                  Company
                </label>
                <input
                  id="company"
                  {...register('company')}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-3 text-sm font-figtree text-white placeholder-white/50 outline-none transition focus:ring-2 focus:ring-[#2D2DDD]"
                  placeholder="Acme Inc."
                  aria-invalid={!!errors.company}
                  autoComplete="organization"
                />
                {errors.company && <p className="text-xs font-figtree text-red-300">{errors.company.message}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="role" className="text-xs sm:text-sm font-figtree font-medium text-white/80">
                  Role
                </label>
                <input
                  id="role"
                  {...register('role')}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-3 text-sm font-figtree text-white placeholder-white/50 outline-none transition focus:ring-2 focus:ring-[#2D2DDD]"
                  placeholder="Head of Talent"
                  aria-invalid={!!errors.role}
                  autoComplete="organization-title"
                />
                {errors.role && <p className="text-xs font-figtree text-red-300">{errors.role.message}</p>}
              </div>
              <div className="sm:col-span-2 flex flex-col gap-2">
                <label htmlFor="topic" className="text-xs sm:text-sm font-figtree font-medium text-white/80">
                  Topic
                </label>
                <input
                  id="topic"
                  {...register('topic')}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-3 text-sm font-figtree text-white placeholder-white/50 outline-none transition focus:ring-2 focus:ring-[#2D2DDD]"
                  placeholder="Pilot program, enterprise onboarding, integration question..."
                  aria-invalid={!!errors.topic}
                />
                {errors.topic && <p className="text-xs font-figtree text-red-300">{errors.topic.message}</p>}
              </div>
              <div className="sm:col-span-2 flex flex-col gap-2">
                <label htmlFor="message" className="text-xs sm:text-sm font-figtree font-medium text-white/80">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={6}
                  {...register('message')}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-3 text-sm font-figtree text-white placeholder-white/50 outline-none transition focus:ring-2 focus:ring-[#2D2DDD]"
                  placeholder="Share context, timelines, and what success looks like for your team."
                  aria-invalid={!!errors.message}
                />
                {errors.message && <p className="text-xs font-figtree text-red-300">{errors.message.message}</p>}
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs font-figtree text-gray-400" aria-live="polite">
                {status === 'success' && 'Message sent. We will connect within two hours.'}
                {status === 'error' && 'Something went wrong. Please try again.'}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-full bg-[#2D2DDD] px-6 py-3 text-sm font-figtree font-medium text-white transition hover:bg-[#2424c0] disabled:opacity-60"
              >
                <MessageSquare className="h-4 w-4" />
                {isSubmitting ? 'Sending...' : 'Send message'}
              </button>
            </div>
          </motion.form>

          <motion.div
            {...fadeUp(1, disableMotion)}
            className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-xl"
          >
            <h2 className="text-[27px] sm:text-[36px] font-figtree font-extralight leading-tight">
              Always-on human + AI assistance
            </h2>
            <p className="text-sm sm:text-base font-figtree font-light text-gray-300">
              Our concierge agents pair human expertise with realtime AI insights to resolve questions fast and keep your hiring engine humming.
            </p>
            <div className="space-y-5">
              {infoHighlights.map(highlight => (
                <div key={highlight.title} className="flex items-start gap-3">
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10">
                    <highlight.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-figtree font-medium text-white uppercase tracking-wide">
                      {highlight.title}
                    </p>
                    <p className="text-sm font-figtree font-light text-gray-300 leading-relaxed">
                      {highlight.copy}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-3">
              <p className="text-sm font-figtree font-medium text-white/80">Prefer a direct line?</p>
              <div className="flex flex-col gap-3">
                <a
                  href="mailto:support@optiohire.com"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-figtree font-medium text-white hover:bg-white/20"
                >
                  <Mail className="h-4 w-4" />
                  support@optiohire.com
                </a>
                <a
                  href="tel:+254701601126"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-figtree font-medium text-white hover:bg-white/20"
                >
                  <Phone className="h-4 w-4" />
                  +254 701 601 126
                </a>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-figtree font-light text-gray-300">
                Looking to automate interview scheduling? Ask about our autonomous agent pilots powered by <span className="text-white">OptioHire</span>.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 pb-24 sm:pb-28">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            {...fadeUp(0, disableMotion)}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/10 px-6 py-12 text-center backdrop-blur-xl sm:px-10"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#2D2DDD22,transparent_75%)]" aria-hidden="true" />
            <div className="relative z-10 space-y-5">
              <h2 className="text-[28px] sm:text-[40px] font-figtree font-extralight leading-tight">
                Schedule a live product walkthrough
              </h2>
              <p className="mx-auto max-w-2xl text-sm sm:text-lg font-figtree font-light text-gray-100">
                Experience the autonomous sourcing engine, adaptive interviews, and analytics cockpit in a 30-minute session tailored to your roles.
              </p>
              <a
                href="mailto:demo@hraigagent.com"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2D2DDD] px-8 py-3 text-sm font-figtree font-medium text-white transition hover:bg-[#2424c0]"
              >
                Request my demo
                <Bot className="h-5 w-5" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
