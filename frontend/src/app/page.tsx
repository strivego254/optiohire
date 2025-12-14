'use client'

import { useRouter } from 'next/navigation'
import { Suspense, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { ErrorBoundary } from '@/components/ui/error-boundary'
const NeuralNetworkHero = dynamic(() => import('@/components/ui/neural-network-hero'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">Transform Your Hiring Process with AI Precision</h1>
        <p className="text-gray-400 mb-8">Transform your hiring process with intelligent automation, advanced analytics, and bias-free candidate screening.</p>
      </div>
    </div>
  ),
})
import VideoSection from '@/components/ui/video-section'

// Load homepage content immediately on client - no lazy loading delay
// This ensures features are available on first load
const HomePageContent = dynamic(() => import('./homepage-content'), {
  ssr: false, // Client component with hooks
  // Remove loading state to render immediately
})

export default function HomePage() {
  const router = useRouter()

  return (
    <ErrorBoundary>
      <div className="min-h-screen relative bg-black">
        {/* Neural Network Hero Section */}
        <ErrorBoundary fallback={
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-4xl font-bold mb-4">Transform Your Hiring Process with AI Precision</h1>
              <p className="text-gray-400 mb-8">Transform your hiring process with intelligent automation, advanced analytics, and bias-free candidate screening.</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => router.push('/auth/signup')}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Get Started
                </button>
                <button
                  onClick={() => router.push('/auth/signin')}
                  className="px-6 py-3 border border-white/20 text-white rounded-lg hover:bg-white/10"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        }>
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
        </ErrorBoundary>

        {/* Video Section */}
        <ErrorBoundary fallback={null}>
          <VideoSection
            useHowdyGo={true}
            title="See It in Action"
            description="Watch how our AI-powered platform transforms your hiring process"
          />
        </ErrorBoundary>

        {/* Lazy load content below the fold with Suspense boundary */}
        <ErrorBoundary fallback={null}>
          <Suspense fallback={
            <div className="min-h-[400px] bg-black flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <HomePageContent />
          </Suspense>
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  )
}