'use client'

import { useState, useEffect, useRef } from 'react'

interface VideoSectionProps {
  videoSrc?: string
  poster?: string
  title?: string
  description?: string
  useHowdyGo?: boolean
}

interface CounterItem {
  number: string
  text: string
  numericValue: number
  suffix: string
}

export default function VideoSection({
  videoSrc = '/assets/videos/demo-video.mp4',
  poster,
  title = "See It in Action",
  description = "Watch how our AI-powered platform transforms your hiring process",
  useHowdyGo = true
}: VideoSectionProps) {
  const microContentRef = useRef<HTMLDivElement>(null)
  const howdyGoRef = useRef<HTMLDivElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [counters, setCounters] = useState<CounterItem[]>([
    { number: "0%", text: "AI Accuracy", numericValue: 95, suffix: "%" },
    { number: "0x", text: "Faster Hiring", numericValue: 5, suffix: "x" },
    { number: "0%", text: "Cost Reduction", numericValue: 70, suffix: "%" }
  ])

  // Load HowdyGo script only when component is in view (lazy loading)
  useEffect(() => {
    if (!useHowdyGo || scriptLoaded) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !scriptLoaded) {
            setIsInView(true)
            
            // Check if script is already loaded
            if (document.getElementById('howdygo-script')) {
              setScriptLoaded(true)
              return
            }

            // Load HowdyGo script
            const script = document.createElement('script')
            script.id = 'howdygo-script'
            script.src = 'https://js.howdygo.com/v1.2.1/index.js'
            script.async = true
            script.defer = true
            script.onload = () => {
              setScriptLoaded(true)
            }
            script.onerror = () => {
              console.error('Failed to load HowdyGo script')
            }
            document.head.appendChild(script)
          }
        })
      },
      {
        threshold: 0.1, // Trigger when 10% is visible
        rootMargin: '50px' // Start loading slightly before it comes into view
      }
    )

    if (howdyGoRef.current) {
      observer.observe(howdyGoRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [useHowdyGo, scriptLoaded])

  // Counter animation effect
  useEffect(() => {
    if (!microContentRef.current || hasAnimated) return

    const counterData: CounterItem[] = [
      { number: "0%", text: "AI Accuracy", numericValue: 95, suffix: "%" },
      { number: "0x", text: "Faster Hiring", numericValue: 5, suffix: "x" },
      { number: "0%", text: "Cost Reduction", numericValue: 70, suffix: "%" }
    ]

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true)
            
            // Animate each counter
            counterData.forEach((item, index) => {
              const duration = 2000 // 2 seconds
              const startTime = Date.now()
              const startValue = 0
              const endValue = item.numericValue
              const suffix = item.suffix

              const animate = () => {
                const elapsed = Date.now() - startTime
                const progress = Math.min(elapsed / duration, 1)
                
                // Easing function (ease-out)
                const easeOut = 1 - Math.pow(1 - progress, 3)
                const currentValue = Math.floor(startValue + (endValue - startValue) * easeOut)

                setCounters((prev) => {
                  const updated = [...prev]
                  updated[index] = {
                    ...updated[index],
                    number: `${currentValue}${suffix}`
                  }
                  return updated
                })

                if (progress < 1) {
                  requestAnimationFrame(animate)
                } else {
                  // Ensure final value is set
                  setCounters((prev) => {
                    const updated = [...prev]
                    updated[index] = {
                      ...updated[index],
                      number: `${endValue}${suffix}`
                    }
                    return updated
                  })
                }
              }

              // Stagger the animations slightly
              setTimeout(() => {
                requestAnimationFrame(animate)
              }, index * 100)
            })
          }
        })
      },
      {
        threshold: 0.3, // Trigger when 30% of the element is visible
        rootMargin: '0px'
      }
    )

    observer.observe(microContentRef.current)

    return () => {
      observer.disconnect()
    }
  }, [hasAnimated])

  return (
    <section className="relative w-full bg-black pt-2 sm:pt-4 md:pt-12 pb-20 px-4 md:pb-24">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        {(title || description) && (
          <div className="text-center mb-12 md:mb-16">
            {title && (
              <h2 className="text-[27px] sm:text-[57px] md:text-[69px] font-extralight font-figtree leading-[1.05] tracking-tight text-white mb-4">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm sm:text-base md:text-lg text-white/70 max-w-2xl mx-auto">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Video Container with Glow Effect */}
        <div className="relative">
          {/* Glow Effect - Outer Layer */}
          <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-r opacity-75 blur-xl animate-pulse" style={{ background: 'linear-gradient(to right, rgba(74, 13, 186, 0.8), rgba(74, 13, 186, 0.6), rgba(74, 13, 186, 0.8))' }} />
          {/* Glow Effect - Inner Layer */}
          <div className="absolute -inset-0.5 rounded-[32px] bg-gradient-to-r opacity-50 blur-lg animate-pulse" style={{ animationDelay: '0.5s', background: 'linear-gradient(to right, rgba(74, 13, 186, 0.6), rgba(74, 13, 186, 0.4), rgba(74, 13, 186, 0.6))' }} />

          {/* Video Box - HowdyGo Embed or Video Player */}
          <div className="relative rounded-[32px] overflow-hidden bg-black shadow-2xl border" style={{ borderColor: 'rgba(74, 13, 186, 0.3)' }}>
            {useHowdyGo ? (
              <div 
                ref={howdyGoRef}
                id="howdygo-embed"
                className="w-full relative mx-auto"
                style={{
                  maxWidth: '1536px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0px 0px 1px rgba(45, 55, 72, 0.05), 0px 4px 8px rgba(45, 55, 72, 0.1)',
                }}
              >
                {isInView && (
                  <div
                    id="howdygo-wrapper"
                    className="relative w-full"
                    style={{
                      height: 0,
                      paddingBottom: 'calc(45.44270833333333% + 40px)',
                    }}
                  >
                    <iframe
                      id="howdygo-frame"
                      src="https://app.howdygo.com/prescreen-embed/23af4d85-e442-49a7-a4c3-854d8d8f6ce2?bdBlur=0&mobileStrategy=newTab&launchButton=Launch+interactive+demo"
                      frameBorder="0"
                      scrolling="no"
                      allow="autoplay"
                      allowFullScreen
                      className="absolute top-0 left-0 w-full h-full"
                      loading="lazy"
                      title="Product Demo - Interactive Walkthrough"
                      style={{
                        border: 'none',
                      }}
                    />
                  </div>
                )}
                {!isInView && (
                  <div 
                    className="w-full flex items-center justify-center bg-white"
                    style={{
                      aspectRatio: '16/9',
                      minHeight: '280px',
                    }}
                  >
                    <div className="text-center p-8">
                      <div className="w-16 h-16 border-4 border-[#4a0dba] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-gray-600 text-sm md:text-base">
                        Loading interactive demo...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
            <div className="aspect-video sm:aspect-video h-[280px] sm:h-auto w-full relative group">
              {videoSrc ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                    <video
                      className="w-full h-full object-cover"
                  src={videoSrc} 
                  poster={poster}
                      controls
                      preload="metadata"
                      playsInline
                />
                  </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                  <div className="text-center p-8">
                    <svg
                      className="w-16 h-16 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: '#4a0dba' }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-white/60 text-sm md:text-base">
                      Video placeholder
                    </p>
                    <p className="text-white/40 text-xs mt-2">
                      Add your video to /public/assets/videos/
                    </p>
                  </div>
                </div>
              )}
            </div>
            )}
          </div>
        </div>

        {/* Micro Content Below Video */}
        <div ref={microContentRef} className="mt-24 md:mt-32 lg:mt-40">
          <div className="flex flex-wrap items-center justify-center gap-16 md:gap-20 lg:gap-24 xl:gap-32">
            {counters.map((item, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extralight tracking-tight text-white mb-2">
                  {item.number}
                </div>
                <div className="text-xs sm:text-sm md:text-base font-light tracking-tight text-white/70">
                  {item.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

