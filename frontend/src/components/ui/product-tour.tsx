'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export interface TourStep {
  id: string
  target: string
  title: string
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  offset?: number
}

interface ProductTourProps {
  steps: TourStep[]
  isOpen: boolean
  onClose: () => void
  onComplete?: () => void
}

const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkDevice = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  return isDesktop
}

const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

export function ProductTour({ steps, isOpen, onClose, onComplete }: ProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const [spotlightPosition, setSpotlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 })
  const overlayRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const isDesktop = useIsDesktop()
  const prefersReducedMotion = useReducedMotion()

  const updatePositions = useCallback(() => {
    if (!isOpen || currentStep >= steps.length) return

    const step = steps[currentStep]
    const element = document.querySelector(step.target) as HTMLElement

    if (!element) {
      setTargetElement(null)
      return
    }

    setTargetElement(element)
    const rect = element.getBoundingClientRect()

    const spotlight = {
      top: rect.top,
      left: rect.left,
      width: Math.max(rect.width, 100),
      height: Math.max(rect.height, 50),
    }

    setSpotlightPosition(spotlight)

    const position = step.position || 'bottom'
    const offset = step.offset || 16
    let tooltipTop = 0
    let tooltipLeft = 0

    const tooltipWidth = 320
    const tooltipHeight = 240

    switch (position) {
      case 'top':
        tooltipTop = rect.top - tooltipHeight - offset
        tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2
        break
      case 'bottom':
        tooltipTop = rect.bottom + offset
        tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2
        break
      case 'left':
        tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2
        tooltipLeft = rect.left - tooltipWidth - offset
        break
      case 'right':
        tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2
        tooltipLeft = rect.right + offset
        break
      case 'center':
        tooltipTop = window.innerHeight / 2 - tooltipHeight / 2
        tooltipLeft = window.innerWidth / 2 - tooltipWidth / 2
        break
    }

    const padding = 16
    const maxTop = window.innerHeight - tooltipHeight - padding
    const maxLeft = window.innerWidth - tooltipWidth - padding
    
    tooltipTop = Math.max(padding, Math.min(tooltipTop, maxTop))
    tooltipLeft = Math.max(padding, Math.min(tooltipLeft, maxLeft))

    setTooltipPosition({ top: tooltipTop, left: tooltipLeft })
  }, [isOpen, currentStep, steps])

  useEffect(() => {
    if (!isOpen || !isDesktop) return

    updatePositions()

    const handleResize = () => updatePositions()
    const handleScroll = () => updatePositions()

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll, true)

    const interval = setInterval(updatePositions, 100)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll, true)
      clearInterval(interval)
    }
  }, [isOpen, isDesktop, updatePositions])

  useEffect(() => {
    if (!targetElement || !isOpen) return

    const computedStyle = getComputedStyle(targetElement)
    const originalPosition = targetElement.style.position
    const originalZIndex = targetElement.style.zIndex
    const originalTransform = targetElement.style.transform
    
    // Ensure the element is positioned and above the overlay
    const currentPosition = computedStyle.position
    if (currentPosition === 'static') {
      targetElement.style.position = 'relative'
    }
    
    // Set a very high z-index to ensure it's above the overlay
    targetElement.style.zIndex = '10005'
    
    // Add a transform to create a new stacking context
    if (!computedStyle.transform || computedStyle.transform === 'none') {
      targetElement.style.transform = 'translateZ(0)'
    }
    
    targetElement.style.transition = 'all 0.3s ease'

    return () => {
      if (originalPosition) {
        targetElement.style.position = originalPosition
      } else {
        targetElement.style.position = ''
      }
      if (originalZIndex) {
        targetElement.style.zIndex = originalZIndex
      } else {
        targetElement.style.zIndex = ''
      }
      if (originalTransform) {
        targetElement.style.transform = originalTransform
      } else {
        targetElement.style.transform = ''
      }
      targetElement.style.transition = ''
    }
  }, [targetElement, isOpen])

  useEffect(() => {
    if (!isOpen || !isDesktop) return

    if (targetElement) {
      targetElement.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' })
    }
  }, [currentStep, isOpen, isDesktop, targetElement, prefersReducedMotion])

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete?.()
      onClose()
    }
  }, [currentStep, steps.length, onComplete, onClose])

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  const handleSkip = useCallback(() => {
    onComplete?.()
    onClose()
  }, [onComplete, onClose])

  if (!isDesktop || !isOpen) {
    return null
  }

  const step = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {targetElement && spotlightPosition.width > 0 && spotlightPosition.height > 0 && (
            <>
              <div 
                ref={overlayRef}
                className="fixed inset-0 z-[9995] pointer-events-auto"
                onClick={handleSkip}
                aria-hidden="true"
                style={{
                  width: '100vw',
                  height: '100vh',
                }}
              >
                {/* Top overlay */}
                <div 
                  className="absolute bg-black/80 transition-all duration-300"
                  style={{
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${Math.max(0, spotlightPosition.top - 24)}px`,
                  }}
                />
                {/* Bottom overlay */}
                <div 
                  className="absolute bg-black/80 transition-all duration-300"
                  style={{
                    top: `${spotlightPosition.top + spotlightPosition.height + 24}px`,
                    left: 0,
                    width: '100%',
                    height: `${typeof window !== 'undefined' ? Math.max(0, window.innerHeight - (spotlightPosition.top + spotlightPosition.height + 24)) : 0}px`,
                  }}
                />
                {/* Left overlay */}
                <div 
                  className="absolute bg-black/80 transition-all duration-300"
                  style={{
                    top: `${Math.max(0, spotlightPosition.top - 24)}px`,
                    left: 0,
                    width: `${Math.max(0, spotlightPosition.left - 24)}px`,
                    height: `${spotlightPosition.height + 48}px`,
                  }}
                />
                {/* Right overlay */}
                <div 
                  className="absolute bg-black/80 transition-all duration-300"
                  style={{
                    top: `${Math.max(0, spotlightPosition.top - 24)}px`,
                    left: `${spotlightPosition.left + spotlightPosition.width + 24}px`,
                    width: `${typeof window !== 'undefined' ? Math.max(0, window.innerWidth - (spotlightPosition.left + spotlightPosition.width + 24)) : 0}px`,
                    height: `${spotlightPosition.height + 48}px`,
                  }}
                />
              </div>

              <div
                className="fixed z-[9999] pointer-events-none rounded-lg"
                style={{
                  top: `${spotlightPosition.top - 24}px`,
                  left: `${spotlightPosition.left - 24}px`,
                  width: `${spotlightPosition.width + 48}px`,
                  height: `${spotlightPosition.height + 48}px`,
                  border: '2px solid #2D2DDD',
                  boxSizing: 'border-box',
                  backgroundColor: 'transparent',
                }}
              />
            </>
          )}

          {targetElement && (
            <>
              <motion.div
              ref={tooltipRef}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.3,
                ease: 'easeOut',
              }}
              className="fixed z-[10000] w-80 pointer-events-auto"
              style={{
                top: `${tooltipPosition.top}px`,
                left: `${tooltipPosition.left}px`,
              }}
            >
              <div className="relative bg-white dark:bg-gray-900 border-2 border-[#2D2DDD] rounded-xl shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2D2DDD]/10 to-transparent pointer-events-none" />
                
                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#2D2DDD] flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-[#2D2DDD] mb-1">
                          Step {currentStep + 1} of {steps.length}
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
                            className="h-full bg-[#2D2DDD] rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSkip}
                      className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
                      aria-label="Close tour"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 font-figtree">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-figtree font-light leading-relaxed mb-6">
                    {step.content}
                  </p>

                  <div className="flex items-center justify-between gap-3">
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentStep === 0}
                      className={cn(
                        "flex-1 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300",
                        "hover:bg-gray-50 dark:hover:bg-gray-800",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      onClick={handleNext}
                      className="flex-1 bg-[#2D2DDD] hover:bg-[#2424c0] text-white"
                    >
                      {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                      {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
                    </Button>
                  </div>
                </div>

                <div className="absolute -top-1 -right-1 w-20 h-20 bg-[#2D2DDD]/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-1 -left-1 w-20 h-20 bg-[#2D2DDD]/20 rounded-full blur-2xl pointer-events-none" />
              </div>
            </motion.div>
            </>
          )}
        </>
      )}
    </AnimatePresence>
  )
}
