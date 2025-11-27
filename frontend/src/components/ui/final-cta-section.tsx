'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, CheckCircle, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState, useCallback } from 'react'

const benefits = [
  '95% AI accuracy rate',
  '5x faster hiring process',
  '70% cost reduction',
  'Zero setup fees',
]

export default function FinalCTASection() {
  const router = useRouter()
  const sectionRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  const handleGetStarted = useCallback(() => {
    router.push('/auth/signup')
  }, [router])

  const handleContact = useCallback(() => {
    router.push('/contact')
  }, [router])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }

  return (
    <section
      ref={sectionRef}
      className="relative py-20 sm:py-24 md:py-32 px-4 sm:px-6 overflow-hidden bg-black"
    >
      {/* Background gradient effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(45, 45, 221, 0.15) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: 'radial-gradient(ellipse at top, rgba(45, 45, 221, 0.1) 0%, transparent 50%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      <div className="container mx-auto max-w-5xl relative z-10">
        <motion.div
          variants={shouldReduceMotion ? {} : containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="text-center"
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6"
          >
            <Sparkles className="w-4 h-4 text-[#2D2DDD]" />
            <span className="text-sm font-medium text-white/80 font-figtree">
              Ready to Transform Your Hiring?
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h2
            variants={itemVariants}
            className="text-[27px] sm:text-[57px] md:text-[69px] font-extralight font-figtree leading-[1.05] tracking-tight mb-4 sm:mb-6 text-white"
          >
            Start Hiring Smarter Today
          </motion.h2>

          {/* Description */}
          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg md:text-xl font-figtree font-light text-gray-300 max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed"
          >
            Join thousands of companies already using AI to find the best talent faster. 
            Get started in minutes with no credit card required.
          </motion.p>

          {/* Benefits List */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-10 sm:mb-12"
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 + 0.6, duration: 0.3 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"
              >
                <CheckCircle className="w-4 h-4 text-[#2D2DDD] flex-shrink-0" />
                <span className="text-xs sm:text-sm text-white/80 font-figtree font-light">
                  {benefit}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
          >
            <motion.button
              onClick={handleGetStarted}
              onHoverStart={() => setIsHovered(true)}
              onHoverEnd={() => setIsHovered(false)}
              className="group relative px-8 py-4 sm:px-10 sm:py-5 rounded-full font-semibold font-figtree text-white overflow-hidden transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #2D2DDD 0%, rgba(45, 45, 221, 0.9) 100%)',
                boxShadow: isHovered
                  ? '0 20px 40px -12px rgba(45, 45, 221, 0.5), 0 0 0 1px rgba(45, 45, 221, 0.3)'
                  : '0 10px 30px -10px rgba(45, 45, 221, 0.4)',
              }}
              whileHover={shouldReduceMotion ? {} : { scale: 1.05, y: -2 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
            >
              <span className="relative z-10 flex items-center gap-2 text-sm sm:text-base">
                Get Started Free
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" />
              </span>
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(45, 45, 221, 0.9) 0%, rgba(45, 45, 221, 0.7) 100%)',
                }}
              />
            </motion.button>

            <motion.button
              onClick={handleContact}
              className="group px-8 py-4 sm:px-10 sm:py-5 rounded-full font-semibold font-figtree text-white border-2 border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/30 transition-all duration-300"
              whileHover={shouldReduceMotion ? {} : { scale: 1.05, y: -2 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
            >
              <span className="text-sm sm:text-base">Talk to Sales</span>
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
