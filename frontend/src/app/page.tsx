'use client'

import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import NeuralNetworkHero from '@/components/ui/neural-network-hero'
import VideoSection from '@/components/ui/video-section'

// Lazy load heavy components below the fold for better initial load performance
const HomePageContent = dynamic(() => import('./homepage-content'), {
  loading: () => (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  ),
  ssr: true,
})

export default function HomePage() {
  const router = useRouter()

  // Render content immediately without waiting for auth
  // Auth check happens in background and doesn't block homepage rendering

  return (
    <div className="min-h-screen relative">
      {/* Neural Network Hero Section */}
      <NeuralNetworkHero
        title="Transform Your Hiring Process with AI Precision."
        description="Transform your hiring process with intelligent automation, advanced analytics, and bias-free candidate screening. Hire 5x faster with 95% accuracy."
        badgeText="Smart AI Integration"
        badgeLabel="New"
        ctaButtons={[
          { 
            text: "Get Started", 
            href: "/auth/signup",
            onClick: () => router.push('/auth/signup'),
            primary: true 
          },
          { 
            text: "Sign In", 
            href: "/auth/signin",
            onClick: () => router.push('/auth/signin')
          }
        ]}
      />

      {/* Video Section */}
      <VideoSection
        videoSrc="/assets/videos/HR Talking.mp4"
        title="See It in Action"
        description="Watch how our AI-powered platform transforms your hiring process"
      />

      {/* Lazy load content below the fold */}
      <HomePageContent />
    </div>
  )
}