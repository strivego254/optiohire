'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { FileText, Brain, Users, CheckCircle } from 'lucide-react'
import { useRef, useState, useCallback } from 'react'

interface StepCard {
  id: string
  step: string
  title: string
  description: string
  icon: typeof FileText
}

const steps: StepCard[] = [
  {
    id: '1',
    step: 'Step 1',
    title: 'Create & Post Jobs',
    description: 'Use our AI-optimized templates to create compelling job postings that attract top talent. Multi-channel posting and SEO optimization included.',
    icon: FileText,
  },
  {
    id: '2',
    step: 'Step 2',
    title: 'AI Candidate Screening',
    description: 'Our advanced AI analyzes and scores candidates based on your specific requirements. Resume analysis, skill matching, and bias-free evaluation.',
    icon: Brain,
  },
  {
    id: '3',
    step: 'Step 3',
    title: 'Review & Interview',
    description: 'Review AI-ranked candidates with detailed insights and conduct smart interviews. Smart ranking, interview scheduling, and collaborative review tools.',
    icon: Users,
  },
  {
    id: '4',
    step: 'Step 4',
    title: 'Hire & Onboard',
    description: 'Make data-driven hiring decisions and seamlessly onboard your new team members. Decision analytics, offer management, and onboarding automation.',
    icon: CheckCircle,
  },
]

interface HowItWorksCardProps {
  step: StepCard
  index: number
}

const HowItWorksCard = ({ step, index }: HowItWorksCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  const Icon = step.icon

  const cardVariants = {
    initial: {
      opacity: 0,
      y: 30,
      scale: 0.95,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }

  const hoverVariants = {
    hover: shouldReduceMotion
      ? {}
      : {
          y: -8,
          scale: 1.02,
          transition: {
            duration: 0.3,
            ease: [0.22, 1, 0.36, 1],
          },
        },
  }

  return (
    <motion.div
      ref={cardRef}
      variants={cardVariants}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: '-50px' }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative h-full"
    >
      <motion.div
        variants={hoverVariants}
        whileHover="hover"
        className="relative h-full rounded-[32px] overflow-hidden bg-black border border-white/10 p-6 sm:p-8 md:p-10 flex flex-col group"
        style={{
          background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #000000 100%)',
          boxShadow: isHovered
            ? '0 20px 60px -12px rgba(45, 45, 221, 0.4), 0 0 0 1px rgba(45, 45, 221, 0.2)'
            : '0 10px 40px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Blue gradient glow effect */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(45, 45, 221, 0.15) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        {/* Animated border glow */}
        <motion.div
          className="absolute inset-0 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(45, 45, 221, 0.3) 0%, rgba(45, 45, 221, 0.1) 50%, rgba(45, 45, 221, 0.3) 100%)',
            filter: 'blur(1px)',
            border: '1px solid rgba(45, 45, 221, 0.3)',
          }}
        />

        {/* Step number badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
          className="inline-flex items-center gap-2 mb-4 sm:mb-6"
        >
          <div
            className="px-3 py-1 rounded-full text-xs sm:text-sm font-semibold font-figtree uppercase tracking-wider"
            style={{
              background: 'linear-gradient(135deg, rgba(45, 45, 221, 0.2) 0%, rgba(45, 45, 221, 0.1) 100%)',
              color: '#2D2DDD',
              border: '1px solid rgba(45, 45, 221, 0.3)',
            }}
          >
            {step.step}
          </div>
        </motion.div>

        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: index * 0.1 + 0.3, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mb-4 sm:mb-6"
        >
          <div
            className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(45, 45, 221, 0.2) 0%, rgba(45, 45, 221, 0.1) 100%)',
              border: '1px solid rgba(45, 45, 221, 0.3)',
            }}
          >
            <motion.div
              animate={isHovered && !shouldReduceMotion ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#2D2DDD]" />
            </motion.div>
            {/* Icon glow */}
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: 'radial-gradient(circle, rgba(45, 45, 221, 0.3) 0%, transparent 70%)',
                filter: 'blur(8px)',
              }}
            />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 + 0.4, duration: 0.3 }}
          className="text-[15px] sm:text-[20px] md:text-[24px] font-semibold font-figtree text-white mb-3 sm:mb-4 leading-tight"
        >
          {step.title}
        </motion.h3>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 + 0.5, duration: 0.3 }}
          className="text-xs sm:text-sm md:text-base text-gray-300 font-figtree font-light leading-relaxed flex-grow"
        >
          {step.description}
        </motion.p>

        {/* Bottom accent line */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ delay: index * 0.1 + 0.6, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="h-[2px] mt-4 sm:mt-6"
          style={{
            background: 'linear-gradient(90deg, #2D2DDD 0%, rgba(45, 45, 221, 0.5) 50%, transparent 100%)',
          }}
        />
      </motion.div>
    </motion.div>
  )
}

export default function HowItWorksCards() {
  const shouldReduceMotion = useReducedMotion()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  return (
    <motion.div
      variants={shouldReduceMotion ? {} : containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 w-full"
    >
      {steps.map((step, index) => (
        <HowItWorksCard key={step.id} step={step} index={index} />
      ))}
    </motion.div>
  )
}
