'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { GradientCard } from '@/components/ui/gradient-card'
import dynamic from 'next/dynamic'
import { useRef } from 'react'

// Lazy load heavy components for better performance
const Animated3DShape = dynamic(() => import('@/components/ui/animated-3d-shape').then(mod => ({ default: mod.default })), {
  ssr: false,
})

const PricingSection = dynamic(() => import('@/components/ui/pricing-section').then(mod => ({ default: mod.default })), {
  ssr: true,
})

const FinalCTASection = dynamic(() => import('@/components/ui/final-cta-section').then(mod => ({ default: mod.default })), {
  ssr: false,
})

const HowItWorksCards = dynamic(() => import('@/components/ui/how-it-works-cards').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 w-full">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="h-[400px] bg-neutral-800/50 rounded-[32px] animate-pulse" />
    ))}
  </div>,
})

const StackingCardComponent = dynamic(() => import('@/components/ui/stacking-card').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => <div className="h-screen bg-slate-950 animate-pulse" />,
})

const PricingBackground = dynamic(() => import('@/components/ui/pricing-background').then(mod => ({ default: mod.default })), {
  ssr: false,
})

// Shader background is a client component that mounts in useEffect; import directly to avoid chunk delays
import { 
  Brain, 
  Users, 
  Zap, 
  Target, 
  TrendingUp, 
  Clock, 
  Shield,
  DollarSign,
  Building2,
  GraduationCap,
  Code,
  Palette,
  ShoppingCart,
  Stethoscope,
} from 'lucide-react'

export default function HomePageContent() {
  const router = useRouter()
  const backgroundRef = useRef<HTMLDivElement>(null)

  const coreFeatures = [
    {
      icon: Brain,
      title: 'AI-Powered Candidate Screening',
      description: 'Advanced machine learning algorithms analyze resumes, cover letters, and portfolios to identify the best candidates in seconds.',
      benefits: ['95% accuracy rate', '10x faster screening', 'Bias-free evaluation'],
    },
    {
      icon: Users,
      title: 'Intelligent Candidate Pipeline',
      description: 'Automatically organize, score, and rank candidates with smart categorization and predictive analytics.',
      benefits: ['Automated ranking', 'Smart tagging', 'Pipeline insights'],
    },
    {
      icon: Zap,
      title: 'Automated Workflow Engine',
      description: 'Streamline your entire recruitment process from job posting to offer letter with intelligent automation.',
      benefits: ['Zero manual tasks', 'Custom workflows', 'Smart notifications'],
    },
    {
      icon: Target,
      title: 'Advanced Analytics & Insights',
      description: 'Get deep insights into your recruitment performance with real-time dashboards and predictive analytics.',
      benefits: ['Real-time metrics', 'Predictive insights', 'ROI tracking'],
    },
  ]

  const industrySolutions = [
    {
      icon: Code,
      title: 'Technology & Software',
      description: 'Specialized screening for developers, engineers, and technical roles with coding assessment integration.',
      metrics: '85% faster tech hiring',
    },
    {
      icon: Building2,
      title: 'Enterprise & Corporate',
      description: 'Scalable solutions for large organizations with complex hiring needs and compliance requirements.',
      metrics: '60% cost reduction',
    },
    {
      icon: GraduationCap,
      title: 'Education & Training',
      description: 'Academic and training institution recruitment with specialized educator screening capabilities.',
      metrics: '90% candidate quality',
    },
    {
      icon: Stethoscope,
      title: 'Healthcare & Medical',
      description: 'Healthcare-specific screening with credential verification and specialized medical role matching.',
      metrics: '100% compliance',
    },
    {
      icon: ShoppingCart,
      title: 'Retail & E-commerce',
      description: 'High-volume hiring solutions for retail positions with seasonal scaling capabilities.',
      metrics: '3x faster scaling',
    },
    {
      icon: Palette,
      title: 'Creative & Design',
      description: 'Portfolio-based screening for creative roles with visual assessment and design evaluation.',
      metrics: '95% match accuracy',
    },
  ]

  const businessBenefits = [
    {
      icon: DollarSign,
      title: 'Reduce Hiring Costs',
      description: 'Cut recruitment costs by up to 70% with automated screening and reduced time-to-hire.',
      value: '70% cost savings',
      color: 'from-green-500 to-emerald-600',
    },
    {
      icon: Clock,
      title: 'Faster Time-to-Hire',
      description: 'Reduce average time-to-hire from weeks to days with intelligent automation and smart matching.',
      value: '5x faster hiring',
      color: 'from-blue-500 to-cyan-600',
    },
    {
      icon: TrendingUp,
      title: 'Higher Quality Hires',
      description: 'Improve candidate quality with AI-powered matching and predictive analytics for better outcomes.',
      value: '40% better retention',
      color: 'from-[#2D2DDD] to-pink-600',
    },
    {
      icon: Shield,
      title: 'Compliance & Security',
      description: 'Ensure full compliance with employment laws and data protection regulations with built-in safeguards.',
      value: '100% compliant',
      color: 'from-orange-500 to-red-600',
    },
  ]

  return (
    <>
      {/* Animated 3D Background Shape for Content Sections */}
      <Animated3DShape className="opacity-30" />
      
      {/* Enhanced Features Section with Gradient Cards */}
      <section className="py-20 px-4 relative bg-black">
        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'tween', duration: 0.5, ease: 'easeOut' }}
            className="text-center mb-16 gpu-accelerated"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-white/80">Your all-in-one AI engine</span>
            </div>
            <h2 className="text-[27px] sm:text-[57px] md:text-[69px] font-extralight font-figtree leading-[1.05] tracking-tight mb-4 text-white">
              <span>Powerful</span>{' '}
              <span>AI-Driven Features</span>
            </h2>
            <p className="text-base sm:text-xl font-figtree font-light text-gray-300 max-w-3xl mx-auto">
              Transform your recruitment process with cutting-edge AI technology that learns, adapts, and delivers exceptional results.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-2 gap-x-4 gap-y-2 md:gap-x-8 md:gap-y-4">
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

      {/* Industry Solutions Section */}
      <section className="py-20 px-4 relative overflow-hidden bg-black min-h-screen">
        <div ref={backgroundRef} className="absolute inset-0 w-full h-full">
          <PricingBackground backgroundRef={backgroundRef} />
        </div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'tween', duration: 0.5, ease: 'easeOut' }}
            className="text-center mb-16 gpu-accelerated"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6">
              <Building2 className="w-4 h-4 text-[#3ca2fa]" />
              <span className="text-sm font-medium text-white/80">Tools, security, and integrations</span>
            </div>
            <h2 className="text-[27px] sm:text-[57px] md:text-[69px] font-extralight font-figtree leading-[1.05] tracking-tight mb-4 text-white">
              Industry-Specific Solutions
            </h2>
            <p className="text-base sm:text-xl font-figtree font-light text-gray-300 max-w-2xl mx-auto">
              Tailored recruitment solutions for every industry with specialized screening and assessment tools.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {industrySolutions.map((solution, index) => (
              <motion.div
                key={solution.title}
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'tween', duration: 0.4, delay: index * 0.1, ease: 'easeOut' }}
                className="gpu-accelerated"
              >
                <Card className="h-full hover:shadow-2xl transition-all duration-500 group bg-neutral-900/80 backdrop-blur-sm border border-neutral-800/50 hover:bg-neutral-900/90 hover:scale-105 relative overflow-hidden hover:border-[#3ca2fa]/50">
                  <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-[#3ca2fa]/20 to-blue-600/20 rounded-full blur-xl"></div>
                  <CardContent className="p-3 sm:p-4 md:p-6 relative z-10">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-r from-[#3ca2fa] to-blue-600 flex items-center justify-center mb-2 sm:mb-3 md:mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-[#3ca2fa]/30">
                      <solution.icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <h3 className="text-[15px] sm:text-[20px] md:text-[24px] font-semibold mb-1 sm:mb-2 text-white leading-tight">{solution.title}</h3>
                    <p className="text-xs sm:text-sm md:text-base text-gray-300 mb-2 sm:mb-3 leading-snug line-clamp-3">{solution.description}</p>
                    <div className="text-[9px] sm:text-xs md:text-sm font-medium text-[#3ca2fa] bg-[#3ca2fa]/10 px-2 py-0.5 sm:px-2.5 sm:py-1 md:px-3 md:py-1 rounded-full inline-block border border-[#3ca2fa]/20">{solution.metrics}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Business Benefits Section - Stacking Cards */}
      <div className="hidden md:block">
        <StackingCardComponent
          projects={businessBenefits.map((benefit) => {
            // Map colors by title as specified
            const colorMap: Record<string, string> = {
              'Reduce Hiring Costs': '#2D2DDD',
              'Faster Time-to-Hire': '#06B6D4',
              'Higher Quality Hires': '#2D2DDD',
              'Compliance & Security': '#06B6D4',
            };
            
            // Select appropriate images for each benefit
            const imageMap: Record<string, string> = {
              'Reduce Hiring Costs': '/assets/images/Reduce Cost Image.jpg',
              'Faster Time-to-Hire': '/assets/images/Higher Faster.jpg',
              'Higher Quality Hires': '/assets/images/Quality Hires.jpg',
              'Compliance & Security': '/assets/images/Security and Compliance Image.jpg',
            };

            return {
              title: benefit.title,
              description: benefit.description,
              link: imageMap[benefit.title] || '/assets/images/Reduce Cost Image.jpg',
              color: colorMap[benefit.title] || '#2D2DDD',
              value: benefit.value,
              icon: benefit.icon,
            };
          })}
          heading="Measurable Business Impact"
          subheading="See the real impact on your bottom line with our comprehensive ROI tracking and analytics."
        />
      </div>

      

      

      

      {/* Enhanced How It Works Section with Modern Cards */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-black relative overflow-hidden">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'tween', duration: 0.5, ease: 'easeOut' }}
            className="text-center mb-8 sm:mb-12 md:mb-16 gpu-accelerated"
          >
                <h2 className="text-[27px] sm:text-[57px] md:text-[69px] font-extralight font-figtree leading-[1.05] tracking-tight mb-3 sm:mb-4 text-white">
                  How It Works
                </h2>
            <p className="text-sm sm:text-lg md:text-xl font-figtree font-light text-gray-300 max-w-2xl mx-auto px-4">
              Get started in minutes and see results immediately with our streamlined process
            </p>
          </motion.div>

          <HowItWorksCards />
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative bg-black overflow-hidden pb-8 sm:pb-12 md:pb-16">
        <PricingSection />
      </section>

      {/* Final CTA Section */}
      <FinalCTASection />
    </>
  )
}
