'use client'

import { motion } from 'framer-motion'
import GlassCard from '@/components/ui/glass-card'
import { Card, CardContent } from '@/components/ui/card'
import { PulseBeamsButton } from '@/components/ui/pulse-beams-button'
import dynamic from 'next/dynamic'
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

// Lazy load heavy components
const Animated3DShape = dynamic(() => import('@/components/ui/animated-3d-shape').then(mod => ({ default: mod.default })), {
  ssr: false,
})

export default function FeaturesPage() {
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


  return (
    <div className="min-h-screen bg-black relative">
      {/* Animated Background */}
      <Animated3DShape className="opacity-20" />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:pt-40 sm:pb-24 md:pt-48 md:pb-32">
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

      {/* Pulse Beams Button Section */}
      <section className="pt-4 sm:pt-8 pb-8 sm:pb-12 px-4 relative bg-black">
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="flex items-center justify-center">
            <PulseBeamsButton 
              text="Get Started" 
              href="/auth/signup"
            />
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-20 px-4 relative bg-black">
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

          <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-4 md:gap-8 justify-items-center">
            {coreFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="w-full"
              >
                <GlassCard
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  benefits={feature.benefits}
                  index={index}
                />
              </motion.div>
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
    </div>
  )
}
