'use client'

import { motion } from 'framer-motion'
import { GradientCard } from '@/components/ui/gradient-card'
import { Card, CardContent } from '@/components/ui/card'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import {
  Brain,
  Users,
  Zap,
  Target,
  TrendingUp,
  Sparkles,
  Star,
  Clock,
  DollarSign,
  Award,
} from 'lucide-react'


export default function FeaturesPage() {
  const featuresScrollRef = useRef<HTMLDivElement>(null)
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0)
  const featuresAnimationRef = useRef<number>()

  const coreFeatures = [
    {
      icon: Brain,
      title: 'AI-Powered Candidate Screening',
      description: 'Advanced machine learning algorithms analyze resumes, cover letters, and portfolios to identify the best candidates in seconds. Our AI understands context, skills, and experience to match candidates with job requirements accurately.',
      benefits: [
        '95% accuracy rate in candidate matching',
        '10x faster resume screening',
        'Bias-free evaluation process',
        'Multi-language support',
        'Context-aware skill extraction',
      ],
    },
    {
      icon: Users,
      title: 'Intelligent Candidate Pipeline',
      description: 'Automatically organize, score, and rank candidates with smart categorization and predictive analytics. Build a talent pipeline that adapts to your hiring needs and identifies top performers.',
      benefits: [
        'Automated candidate ranking',
        'Smart tagging and categorization',
        'Pipeline health insights',
        'Talent pool management',
        'Candidate relationship tracking',
      ],
    },
    {
      icon: Zap,
      title: 'Automated Workflow Engine',
      description: 'Streamline your entire recruitment process from job posting to offer letter with intelligent automation. Create custom workflows that adapt to your organization\'s unique hiring process.',
      benefits: [
        'Zero manual data entry',
        'Custom workflow builder',
        'Smart email notifications',
        'Automated interview scheduling',
        'Offer letter generation',
      ],
    },
    {
      icon: Target,
      title: 'Advanced Analytics & Insights',
      description: 'Get deep insights into your recruitment performance with real-time dashboards and predictive analytics. Make data-driven decisions to improve your hiring process continuously.',
      benefits: [
        'Real-time recruitment metrics',
        'Predictive hiring analytics',
        'ROI tracking and reporting',
        'Time-to-fill predictions',
        'Candidate source analysis',
      ],
    },
  ]

  // Track animation progress for Core Features cards (mobile only)
  useEffect(() => {
    const container = featuresScrollRef.current
    if (!container) return

    const scrollElement = container.querySelector('.core-features-scroll') as HTMLElement
    if (!scrollElement) return

    // Track animation progress using requestAnimationFrame
    let startTime = Date.now()
    const duration = 30000 // 30 seconds (matches CSS animation duration)

    const updateProgress = () => {
      const elapsed = (Date.now() - startTime) % duration
      const progress = elapsed / duration
      
      // Calculate which card should be active based on progress
      const currentIndex = Math.floor(progress * coreFeatures.length) % coreFeatures.length
      setActiveFeatureIndex(currentIndex)

      featuresAnimationRef.current = requestAnimationFrame(updateProgress)
    }

    // Also use IntersectionObserver as a backup to detect which card is most visible
    const observer = new IntersectionObserver(
      (entries) => {
        let maxRatio = 0
        let mostVisibleIndex = activeFeatureIndex

        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio
            const cardIndex = parseInt(entry.target.getAttribute('data-card-index') || '0')
            mostVisibleIndex = cardIndex % coreFeatures.length
          }
        })

        if (maxRatio > 0.3) {
          setActiveFeatureIndex(mostVisibleIndex)
        }
      },
      {
        root: container,
        rootMargin: '-20% 0px -20% 0px',
        threshold: [0, 0.3, 0.5, 0.7, 1],
      }
    )

    // Observe all cards
    const cards = container.querySelectorAll('[data-card-index]')
    cards.forEach((card) => observer.observe(card))

    // Start tracking animation progress
    updateProgress()

    return () => {
      observer.disconnect()
      if (featuresAnimationRef.current) {
        cancelAnimationFrame(featuresAnimationRef.current)
      }
    }
  }, [coreFeatures.length])

  return (
    <div className="min-h-screen bg-black relative">
      {/* Hero Section */}
      <section className="relative pt-32 pb-8 px-4 sm:pt-40 sm:pb-10 md:pt-48 md:pb-12">
        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white/80">Comprehensive Feature Set</span>
            </div>
            <h1 className="text-[27px] sm:text-[57px] md:text-[69px] font-extralight font-figtree leading-[1.05] tracking-tight mb-4 text-white">
              Powerful Features for
              <br />
              <span className="text-white">Modern Recruitment</span>
            </h1>
            <p className="text-base sm:text-xl font-figtree font-light text-gray-300 max-w-3xl mx-auto">
              Discover how our AI-powered platform transforms your hiring process with intelligent automation, 
              advanced analytics, and seamless integrations.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Dashboard Image */}
      <section className="relative py-8 px-4 sm:py-12 md:py-16">
        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative w-full"
          >
            <div className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl md:rounded-[32px] shadow-2xl border border-white/10 bg-black/20">
              <div className="relative w-full" style={{ aspectRatio: '16/9', minHeight: '280px' }}>
                {/* Use img tag with proper URL encoding for spaces */}
                <img
                  src="/assets/images/Features page .jpg"
                  alt="OptioHire HR Platform Dashboard - Features Overview showing recruitment analytics, job postings, and candidate management"
                  className="w-full h-full object-contain sm:object-cover rounded-2xl sm:rounded-3xl md:rounded-[32px]"
                  loading="lazy"
                  style={{
                    display: 'block',
                    maxWidth: '100%',
                    height: 'auto',
                  }}
                  onError={(e) => {
                    console.error('Failed to load features image:', e)
                    // Try URL encoded version as fallback
                    const target = e.target as HTMLImageElement
                    if (!target.src.includes('%20')) {
                      target.src = '/assets/images/Features%20page%20.jpg'
                    }
                  }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="pt-8 pb-20 px-4 relative bg-black">
        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6">
              <Brain className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white/80">Core Capabilities</span>
            </div>
            <h2 className="text-[27px] sm:text-[57px] md:text-[69px] font-extralight font-figtree leading-[1.05] tracking-tight mb-4 text-white">
              Core Features
            </h2>
            <p className="text-base sm:text-xl font-figtree font-light text-gray-300 max-w-3xl mx-auto">
              The foundation of intelligent recruitment powered by cutting-edge AI technology.
            </p>
          </motion.div>

          {/* Mobile: Auto-scrolling horizontal container */}
          <div className="lg:hidden">
            <div ref={featuresScrollRef} className="overflow-hidden">
              <div className="flex gap-4 core-features-scroll">
                {/* Duplicate cards for seamless loop */}
                {[...coreFeatures, ...coreFeatures].map((feature, index) => (
                  <div 
                    key={`${feature.title}-${index}`} 
                    data-card-index={index}
                    className="flex-shrink-0 w-[85vw] max-w-sm"
                  >
                    <GradientCard
                      icon={feature.icon}
                      title={feature.title}
                      description={feature.description}
                      benefits={feature.benefits}
                      index={index % coreFeatures.length}
                    />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Progress Dots */}
            <div className="flex justify-center items-center gap-2 mt-6">
              {coreFeatures.map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    "transition-all duration-300 rounded-full",
                    activeFeatureIndex === index
                      ? "w-8 h-2 bg-[#2D2DDD]"
                      : "w-2 h-2 bg-white/30 hover:bg-white/50"
                  )}
                  aria-label={`Go to feature ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Desktop: Grid layout */}
          <div className="hidden lg:grid grid-cols-2 gap-3 sm:gap-4 md:gap-8">
            {coreFeatures.map((feature, index) => (
              <GradientCard
                key={feature.title}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  benefits={feature.benefits}
                  index={index}
                />
            ))}
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-20 px-4 relative bg-black">
        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6">
              <Award className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-white/80">Why Choose Us</span>
            </div>
            <h2 className="text-[27px] sm:text-[57px] md:text-[69px] font-extralight font-figtree leading-[1.05] tracking-tight mb-4 text-white">
              Key Benefits
            </h2>
            <p className="text-base sm:text-xl font-figtree font-light text-gray-300 max-w-3xl mx-auto">
              See why leading companies trust our platform for their recruitment needs.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Clock,
                title: '5x Faster Hiring',
                description: 'Reduce time-to-hire from weeks to days',
                color: 'from-blue-500 to-cyan-600',
              },
              {
                icon: DollarSign,
                title: '70% Cost Savings',
                description: 'Cut recruitment costs significantly',
                color: 'from-green-500 to-emerald-600',
              },
              {
                icon: TrendingUp,
                title: '95% Accuracy',
                description: 'AI-powered matching accuracy',
                color: 'from-[#2D2DDD] to-pink-600',
              },
              {
                icon: Star,
                title: '40% Better Retention',
                description: 'Higher quality hires stay longer',
                color: 'from-orange-500 to-red-600',
              },
            ].map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-2xl transition-all duration-500 group bg-gradient-to-br bg-neutral-900/80 backdrop-blur-sm border border-neutral-800/50 hover:bg-neutral-900/90 hover:scale-105 relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${benefit.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                  <CardContent className="p-6 relative z-10">
                    <div className="w-12 h-12 rounded-full bg-[#2D2DDD] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                      <benefit.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-white">{benefit.title}</h3>
                    <p className="text-sm text-gray-300">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative bg-black">
        <div className="container mx-auto max-w-4xl relative z-10">
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Card className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/90 backdrop-blur-xl border border-white/10 p-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extralight font-figtree leading-tight mb-4 text-white">
                Ready to Transform Your Hiring Process?
              </h2>
              <p className="text-lg font-figtree font-light text-gray-300 mb-8 max-w-2xl mx-auto">
                Start using our AI-powered recruitment platform today and experience the future of hiring.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <motion.a
                  href="/auth/signup"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 bg-[#2D2DDD] text-white rounded-full font-medium hover:bg-[#2525c5] transition-colors"
                >
                  Get Started Free
                </motion.a>
                <motion.a
                  href="/contact"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 border border-white/20 text-white rounded-full font-medium hover:bg-white/10 transition-colors"
                >
                  Contact Sales
                </motion.a>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Add CSS animation for auto-scroll (mobile only) */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes core-features-scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(calc(-50% - 1rem));
            }
          }
          
          .core-features-scroll {
            animation: core-features-scroll 30s linear infinite;
            display: flex;
            width: fit-content;
          }
          
          .core-features-scroll:hover {
            animation-play-state: paused;
          }
        `
      }} />
    </div>
  )
}
