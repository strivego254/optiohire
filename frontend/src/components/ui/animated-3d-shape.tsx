'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { motion } from 'framer-motion'

interface Animated3DShapeProps {
  className?: string
}

export default function Animated3DShape({ className = '' }: Animated3DShapeProps) {
  const [scrollY, setScrollY] = useState(0)
  const [shapeIndex, setShapeIndex] = useState(0)
  const [mounted, setMounted] = useState(false)
  const shapeRef = useRef<HTMLDivElement>(null)

  // Generate random values once on mount to avoid hydration mismatches
  const floatingShapesData = useMemo(() => {
    if (typeof window === 'undefined') return []
    return Array.from({ length: 5 }, () => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      width: 50 + Math.random() * 100,
      height: 50 + Math.random() * 100,
      borderRadius: Math.random() * 50,
      shapeIndex: Math.floor(Math.random() * 5),
      duration: 4 + Math.random() * 2,
      delay: Math.random() * 2,
    }))
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Define different geometric shapes
  const shapes = [
    // Cube-like shape
    {
      borderRadius: '0%',
      transform: 'rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
      clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
    },
    // Diamond shape
    {
      borderRadius: '20%',
      transform: 'rotateX(45deg) rotateY(45deg) rotateZ(45deg)',
      clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
    },
    // Hexagon shape
    {
      borderRadius: '50%',
      transform: 'rotateX(60deg) rotateY(30deg) rotateZ(90deg)',
      clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
    },
    // Octagon shape
    {
      borderRadius: '30%',
      transform: 'rotateX(30deg) rotateY(60deg) rotateZ(120deg)',
      clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)',
    },
    // Star-like shape
    {
      borderRadius: '40%',
      transform: 'rotateX(90deg) rotateY(45deg) rotateZ(180deg)',
      clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
    },
  ]

  useEffect(() => {
    let ticking = false
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
      const scrollPosition = window.scrollY
      setScrollY(scrollPosition)
      
      // Change shape based on scroll position
      const newShapeIndex = Math.floor(scrollPosition / 200) % shapes.length
      setShapeIndex(newShapeIndex)
          
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [shapes.length])

  const currentShape = shapes[shapeIndex]

  // Don't render on server
  if (!mounted) {
    return null
  }

  return (
    <div 
      ref={shapeRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
    >
      {/* Multiple animated shapes for depth */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute gpu-accelerated"
          style={{
            top: `${20 + i * 30}%`,
            left: `${10 + i * 20}%`,
            width: `${200 + i * 100}px`,
            height: `${200 + i * 100}px`,
          }}
          animate={{
            ...currentShape,
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 3 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
            type: "tween",
          }}
        >
          <div
            className="w-full h-full bg-gradient-to-br from-primary/20 via-secondary/15 to-primary/20"
            style={{
              borderRadius: currentShape.borderRadius,
              clipPath: currentShape.clipPath,
              transform: currentShape.transform,
              filter: 'blur(1px)',
            }}
          />
        </motion.div>
      ))}

      {/* Additional floating shapes */}
      {floatingShapesData.map((shapeData, i) => (
        <motion.div
          key={`floating-${i}`}
          className="absolute gpu-accelerated"
          style={{
            top: `${shapeData.top}%`,
            left: `${shapeData.left}%`,
            width: `${shapeData.width}px`,
            height: `${shapeData.height}px`,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            rotate: [0, 180, 360],
            scale: [0.8, 1.2, 0.8],
            opacity: [0.05, 0.15, 0.05],
          }}
          transition={{
            duration: shapeData.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: shapeData.delay,
            type: "tween",
          }}
        >
          <div
            className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10"
            style={{
              borderRadius: `${shapeData.borderRadius}%`,
              clipPath: shapes[shapeData.shapeIndex].clipPath,
              filter: 'blur(2px)',
            }}
          />
        </motion.div>
      ))}

      {/* Main animated shape */}
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 gpu-accelerated"
        style={{
          width: '400px',
          height: '400px',
        }}
        animate={{
          ...currentShape,
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          type: "tween",
        }}
      >
        <div
          className="w-full h-full bg-gradient-to-br from-primary/30 via-secondary/20 to-primary/30"
          style={{
            borderRadius: currentShape.borderRadius,
            clipPath: currentShape.clipPath,
            transform: currentShape.transform,
            filter: 'blur(1px)',
          }}
        />
      </motion.div>

      {/* Scroll-responsive shapes */}
      <motion.div
        className="absolute gpu-accelerated"
        style={{
          top: `${50 + Math.sin(scrollY * 0.01) * 20}%`,
          right: `${20 + Math.cos(scrollY * 0.008) * 15}%`,
          width: '300px',
          height: '300px',
        }}
        animate={{
          rotateX: scrollY * 0.1,
          rotateY: scrollY * 0.15,
          rotateZ: scrollY * 0.05,
          scale: [0.8, 1.2, 0.8],
          opacity: [0.1, 0.25, 0.1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          type: "tween",
        }}
      >
        <div
          className="w-full h-full bg-gradient-to-br from-secondary/25 to-primary/25"
          style={{
            borderRadius: `${20 + Math.sin(scrollY * 0.01) * 30}%`,
            clipPath: shapes[Math.floor(scrollY / 300) % shapes.length].clipPath,
            filter: 'blur(1px)',
          }}
        />
      </motion.div>
    </div>
  )
}
