"use client"

import {
  forwardRef,
  useCallback,
  useEffect,
  useState,
  memo,
  type MouseEvent,
} from "react"
import Image, { type StaticImageData } from "next/image"
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  type MotionStyle,
  type MotionValue,
  type Variants,
} from "framer-motion"
import { cn } from "@/lib/utils"
import { FileText, Brain, Users, CheckCircle } from "lucide-react"

type WrapperStyle = MotionStyle & {
  "--x": MotionValue<string>
  "--y": MotionValue<string>
}

interface ImageSet {
  step1img1: StaticImageData | string
  step1img2: StaticImageData | string
  step2img1: StaticImageData | string
  step2img2: StaticImageData | string
  step3img: StaticImageData | string
  step4img: StaticImageData | string
  alt: string
}

interface FeatureCarouselProps {
  step1img1Class?: string
  step1img2Class?: string
  step2img1Class?: string
  step2img2Class?: string
  step3imgClass?: string
  step4imgClass?: string
  image: ImageSet
}

interface StepImageProps {
  src: StaticImageData | string
  alt: string
  className?: string
  style?: React.CSSProperties
  width?: number
  height?: number
  priority?: boolean
  sizes?: string
}

interface Step {
  id: string
  name: string
  title: string
  description: string
}

// --- Constants ---
const TOTAL_STEPS = 4

const steps: readonly Step[] = [
  {
    id: "1",
    name: "Step 1",
    title: "Create & Post Jobs",
    description: "Use our AI-optimized templates to create compelling job postings that attract top talent. Multi-channel posting and SEO optimization included.",
  },
  {
    id: "2",
    name: "Step 2",
    title: "AI Candidate Screening",
    description: "Our advanced AI analyzes and scores candidates based on your specific requirements. Resume analysis, skill matching, and bias-free evaluation.",
  },
  {
    id: "3",
    name: "Step 3",
    title: "Review & Interview",
    description: "Review AI-ranked candidates with detailed insights and conduct smart interviews. Smart ranking, interview scheduling, and collaborative review tools.",
  },
  {
    id: "4",
    name: "Step 4",
    title: "Hire & Onboard",
    description: "Make data-driven hiring decisions and seamlessly onboard your new team members. Decision analytics, offer management, and onboarding automation.",
  },
]

const ANIMATION_PRESETS = {
  fadeInScale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { type: "spring", stiffness: 300, damping: 25, mass: 0.5 },
  },
  slideInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { type: "spring", stiffness: 300, damping: 25, mass: 0.5 },
  },
  slideInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { type: "spring", stiffness: 300, damping: 25, mass: 0.5 },
  },
} as const

type AnimationPreset = keyof typeof ANIMATION_PRESETS

interface AnimatedStepImageProps extends StepImageProps {
  preset?: AnimationPreset
  delay?: number
  onAnimationComplete?: () => void
}

// --- Hooks ---
function useNumberCycler(totalSteps: number = TOTAL_STEPS, interval: number = 5000) {
  const [currentNumber, setCurrentNumber] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) return;
    
    const timerId = setTimeout(() => {
      setCurrentNumber((prev) => (prev + 1) % totalSteps);
    }, interval);

    return () => clearTimeout(timerId);
  }, [currentNumber, totalSteps, interval, shouldReduceMotion]);

  const setStep = useCallback((stepIndex: number) => {
      setCurrentNumber(stepIndex % totalSteps);
  }, [totalSteps]);

  return { currentNumber, setStep };
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches)
    }
    checkDevice()
    window.addEventListener("resize", checkDevice)
    return () => window.removeEventListener("resize", checkDevice)
  }, [])
  return isMobile
}

// --- Components ---
const IconCheck = memo(({ className, ...props }: React.ComponentProps<"svg">) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={cn("h-4 w-4", className)} {...props} >
      <path d="m229.66 77.66-128 128a8 8 0 0 1-11.32 0l-56-56a8 8 0 0 1 11.32-11.32L96 188.69 218.34 66.34a8 8 0 0 1 11.32 11.32Z" />
    </svg>
  )
})
IconCheck.displayName = "IconCheck"

const stepVariants: Variants = {
  inactive: { scale: 0.9, opacity: 0.7 },
  active: { scale: 1, opacity: 1 },
}

const StepImage = memo(forwardRef<HTMLDivElement, StepImageProps>(
  ({ src, alt, className, style, width, height, priority, sizes }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("absolute select-none", className)}
        style={{
          position: "absolute",
          userSelect: "none",
          maxWidth: "unset",
          height: "auto",
          ...style,
        }}
      >
        <Image
          alt={alt}
          src={src}
          width={width ?? 1200}
          height={height ?? 900}
          priority={priority}
          className="h-full w-full object-cover"
          sizes={sizes ?? "(max-width: 768px) 90vw, (max-width: 1200px) 50vw, 33vw"}
          draggable={false}
          loading={priority ? undefined : "lazy"}
          quality={85}
        />
      </div>
    )
  }
))
StepImage.displayName = "StepImage"

const MotionStepImage = motion(StepImage)

const AnimatedStepImage = memo(({ preset = "fadeInScale", delay = 0, ...props }: AnimatedStepImageProps) => {
  const presetConfig = ANIMATION_PRESETS[preset]
  return <MotionStepImage {...props} {...presetConfig} transition={{ ...presetConfig.transition, delay }} />
})
AnimatedStepImage.displayName = "AnimatedStepImage"

const FeatureCard = memo(({ children, step }: { children: React.ReactNode; step: number }) => {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const isMobile = useIsMobile()
  const shouldReduceMotion = useReducedMotion()

  const handleMouseMove = useCallback(({ currentTarget, clientX, clientY }: MouseEvent) => {
    if (isMobile || shouldReduceMotion) return
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }, [isMobile, shouldReduceMotion, mouseX, mouseY])

  return (
    <motion.div
      className="animated-cards group relative w-full rounded-2xl"
      onMouseMove={handleMouseMove}
      style={{ 
        "--x": useMotionTemplate`${mouseX}px`, 
        "--y": useMotionTemplate`${mouseY}px`,
        willChange: shouldReduceMotion ? "auto" : "transform"
      } as WrapperStyle}
    >
      <div 
        className="relative w-full overflow-hidden rounded-[25px] backdrop-blur-sm transition-colors duration-300 h-[480px] lg:h-[560px]"
        style={{
          backgroundColor: "#4A4A4A",
          borderWidth: "1.6px",
          borderColor: "white",
          borderStyle: "solid"
        }}
      >
        <div className="m-4 sm:m-6 md:m-8 lg:m-10 min-h-[350px] sm:min-h-[400px] md:min-h-[450px] lg:h-full w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              className="flex w-full flex-col gap-3 sm:gap-4 md:w-3/5 z-10 relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="text-sm font-semibold uppercase tracking-wider font-figtree"
                style={{ color: "#4A0DBA" }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1]}}
              >
                  {steps[step].name}
              </motion.div>
              <motion.h2
                className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white font-figtree"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.3, ease: [0.22, 1, 0.36, 1]}}
              >
                {steps[step].title}
              </motion.h2>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.3, ease: [0.22, 1, 0.36, 1]}}
              >
                <p className="text-sm sm:text-base leading-relaxed text-gray-300 font-figtree font-light">
                  {steps[step].description}
                </p>
              </motion.div>
            </motion.div>
          </AnimatePresence>
          {children}
        </div>
      </div>
    </motion.div>
  )
})
FeatureCard.displayName = "FeatureCard"

const StepsNav = memo(({ steps: stepItems, current, onChange }: { steps: readonly Step[]; current: number; onChange: (index: number) => void; }) => {
    const shouldReduceMotion = useReducedMotion();
    
    return (
        <nav aria-label="Progress" className="flex justify-center px-4">
            <ol className="flex w-full flex-wrap items-center justify-center gap-2" role="list">
                {stepItems.map((step, stepIdx) => {
                    const isCompleted = current > stepIdx;
                    const isCurrent = current === stepIdx;
                    return (
                        <motion.li 
                          key={step.name} 
                          initial={shouldReduceMotion ? false : "inactive"} 
                          animate={isCurrent ? "active" : "inactive"} 
                          variants={stepVariants} 
                          transition={{ duration: 0.3 }} 
                          className="relative"
                        >
                            <button
                                type="button"
                                className={cn(
                                    "group flex items-center gap-2.5 rounded-full px-3.5 py-1.5 text-sm font-medium font-figtree transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                                    isCurrent 
                                        ? "bg-[#4A0DBA] text-white focus-visible:ring-[#4A0DBA]" 
                                        : "bg-white/10 text-gray-300 hover:bg-white/20 border border-white/10"
                                )}
                                onClick={() => onChange(stepIdx)}
                            >
                                <span className={cn(
                                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-300 font-figtree",
                                    isCompleted 
                                        ? "bg-[#4A0DBA] text-white" 
                                        : isCurrent 
                                            ? "bg-[#4A0DBA]/80 text-white" 
                                            : "bg-white/10 text-gray-400 group-hover:bg-white/20"
                                )}>
                                    {isCompleted ? (
                                        <IconCheck className="h-3.5 w-3.5" />
                                    ) : (
                                        <span>{stepIdx + 1}</span>
                                    )}
                                </span>
                                <span className="hidden sm:inline-block">{step.name}</span>
                            </button>
                        </motion.li>
                    );
                })}
            </ol>
        </nav>
    );
})
StepsNav.displayName = "StepsNav"

const defaultClasses = {
  img: "rounded-xl border border-white/10 shadow-2xl shadow-black/50 object-cover",
  step1img1: "w-[45%] sm:w-[50%] left-0 top-[12%] sm:top-[15%]",
  step1img2: "w-[55%] sm:w-[60%] left-[38%] sm:left-[40%] top-[30%] sm:top-[35%]",
  step2img1: "w-[45%] sm:w-[50%] left-[3%] sm:left-[5%] top-[18%] sm:top-[20%]",
  step2img2: "w-[40%] left-[52%] sm:left-[55%] top-[42%] sm:top-[45%]",
  step3img: "w-[85%] sm:w-[90%] left-[3%] sm:left-[5%] top-[22%] sm:top-[25%]",
  step4img: "w-[85%] sm:w-[90%] left-[3%] sm:left-[5%] top-[22%] sm:top-[25%]",
} as const

export const FeatureCarousel = memo(({
  image,
  step1img1Class = defaultClasses.step1img1,
  step1img2Class = defaultClasses.step1img2,
  step2img1Class = defaultClasses.step2img1,
  step2img2Class = defaultClasses.step2img2,
  step3imgClass = defaultClasses.step3img,
  step4imgClass = defaultClasses.step4img,
  ...props
}: FeatureCarouselProps) => {
  const { currentNumber: step, setStep } = useNumberCycler()
  const shouldReduceMotion = useReducedMotion();

  const renderStepContent = useCallback(() => {
    switch (step) {
      case 0:
        return (
          <div className="relative w-full h-full">
            <AnimatedStepImage alt={image.alt} className={cn(defaultClasses.img, step1img1Class)} src={image.step1img1} preset={shouldReduceMotion ? "fadeInScale" : "slideInLeft"} />
            <AnimatedStepImage alt={image.alt} className={cn(defaultClasses.img, step1img2Class)} src={image.step1img2} preset={shouldReduceMotion ? "fadeInScale" : "slideInRight"} delay={0.1} />
          </div>
        )
      case 1:
        return (
          <div className="relative w-full h-full">
            <AnimatedStepImage alt={image.alt} className={cn(defaultClasses.img, step2img1Class)} src={image.step2img1} preset="fadeInScale" />
            <AnimatedStepImage alt={image.alt} className={cn(defaultClasses.img, step2img2Class)} src={image.step2img2} preset="fadeInScale" delay={0.1} />
          </div>
        )
      case 2:
        return <AnimatedStepImage alt={image.alt} className={cn(defaultClasses.img, step3imgClass)} src={image.step3img} preset="fadeInScale" />
      case 3:
        return <AnimatedStepImage alt={image.alt} className={cn(defaultClasses.img, step4imgClass)} src={image.step4img} preset="fadeInScale" />
      default: return null
    }
  }, [step, image, step1img1Class, step1img2Class, step2img1Class, step2img2Class, step3imgClass, step4imgClass, shouldReduceMotion])

  return (
    <div className="flex flex-col gap-8 sm:gap-10 md:gap-12 w-[90%] lg:w-[95%] mx-auto p-2 sm:p-4 md:p-6">
        <FeatureCard {...props} step={step}>
            <AnimatePresence mode="wait">
                <motion.div 
                  key={step} 
                  {...(shouldReduceMotion ? {} : ANIMATION_PRESETS.fadeInScale)} 
                  className="w-full h-full absolute"
                >
                    {renderStepContent()}
                </motion.div>
            </AnimatePresence>
        </FeatureCard>
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }}
        >
            <StepsNav current={step} onChange={setStep} steps={steps} />
        </motion.div>
    </div>
  )
})
FeatureCarousel.displayName = "FeatureCarousel"
