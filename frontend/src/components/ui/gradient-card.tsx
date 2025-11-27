'use client'
import React, { useRef, useState, useCallback, memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { CheckCircle } from "lucide-react";

interface GradientCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  benefits: string[];
  index?: number;
}

export const GradientCard = memo(({ icon: Icon, title, description, benefits, index = 0 }: GradientCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const shouldReduceMotion = useReducedMotion();

  // Handle mouse movement for 3D effect (disabled for reduced motion)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();

    // Calculate mouse position relative to card center
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    // Calculate rotation (limited range for subtle effect)
    const rotateX = -(y / rect.height) * 5; // Max 5 degrees rotation
    const rotateY = (x / rect.width) * 5; // Max 5 degrees rotation

    setRotation({ x: rotateX, y: rotateY });
  }, [shouldReduceMotion]);

  // Reset rotation when not hovering
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  return (
    <motion.div
      ref={cardRef}
      className="relative rounded-[32px] overflow-hidden h-full"
      style={{
        transformStyle: "preserve-3d",
        backgroundColor: "#0e131f",
        boxShadow: "0 -10px 100px 10px rgba(45, 45, 221, 0.25), 0 0 10px 0 rgba(0, 0, 0, 0.5)",
        willChange: shouldReduceMotion ? "auto" : "transform",
      }}
      initial={{ opacity: 1, y: 0 }}
      animate={{
        opacity: 1,
        y: shouldReduceMotion ? 0 : (isHovered ? -5 : 0),
        rotateX: shouldReduceMotion ? 0 : rotation.x,
        rotateY: shouldReduceMotion ? 0 : rotation.y,
        perspective: shouldReduceMotion ? 0 : 1000,
      }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {/* Subtle glass reflection overlay */}
      <motion.div
        className="absolute inset-0 z-35 pointer-events-none"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 80%, rgba(255,255,255,0.05) 100%)",
          backdropFilter: "blur(2px)",
        }}
        animate={{
          opacity: isHovered ? 0.7 : 0.5,
        }}
        transition={{
          duration: 0.4,
          ease: "easeOut"
        }}
      />

      {/* Dark background with black gradient */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{
          background: "linear-gradient(180deg, #000000 0%, #000000 70%)",
        }}
      />

      {/* Noise texture overlay */}
      <motion.div
        className="absolute inset-0 opacity-30 mix-blend-overlay z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Blue glow effect */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-2/3 z-20"
        style={{
          background: `
            radial-gradient(ellipse at bottom right, rgba(45, 45, 221, 0.7) -10%, rgba(45, 45, 221, 0) 70%),
            radial-gradient(ellipse at bottom left, rgba(45, 45, 221, 0.7) -10%, rgba(45, 45, 221, 0) 70%)
          `,
          filter: "blur(40px)",
        }}
        animate={{
          opacity: isHovered ? 0.9 : 0.8,
        }}
        transition={{
          duration: 0.4,
          ease: "easeOut"
        }}
      />

      {/* Central blue glow */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-2/3 z-21"
        style={{
          background: `
            radial-gradient(circle at bottom center, rgba(45, 45, 221, 0.7) -20%, rgba(45, 45, 221, 0) 60%)
          `,
          filter: "blur(45px)",
        }}
        animate={{
          opacity: isHovered ? 0.85 : 0.75,
        }}
        transition={{
          duration: 0.4,
          ease: "easeOut"
        }}
      />

      {/* Enhanced bottom border glow */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[2px] z-25"
        style={{
          background: "linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.7) 50%, rgba(255, 255, 255, 0.05) 100%)",
        }}
        animate={{
          boxShadow: isHovered
            ? "0 0 20px 4px rgba(45, 45, 221, 0.9), 0 0 30px 6px rgba(45, 45, 221, 0.7), 0 0 40px 8px rgba(45, 45, 221, 0.5)"
            : "0 0 15px 3px rgba(45, 45, 221, 0.8), 0 0 25px 5px rgba(45, 45, 221, 0.6), 0 0 35px 7px rgba(45, 45, 221, 0.4)",
          opacity: isHovered ? 1 : 0.9,
        }}
        transition={{
          duration: 0.4,
          ease: "easeOut"
        }}
      />

      {/* Card content */}
      <motion.div
        className="relative flex flex-col h-full p-4 sm:p-6 md:p-8 z-40"
      >
        {/* Icon circle */}
        <motion.div
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-3 sm:mb-4 md:mb-6"
          style={{
            background: "linear-gradient(225deg, #171c2c 0%, #121624 100%)",
            position: "relative",
            overflow: "hidden"
          }}
          initial={{ filter: "blur(3px)", opacity: 0.7 }}
          animate={{
            filter: "blur(0px)",
            opacity: 1,
            boxShadow: isHovered
              ? "0 8px 16px -2px rgba(0, 0, 0, 0.3), 0 4px 8px -1px rgba(0, 0, 0, 0.2), inset 2px 2px 5px rgba(255, 255, 255, 0.15), inset -2px -2px 5px rgba(0, 0, 0, 0.7)"
              : "0 6px 12px -2px rgba(0, 0, 0, 0.25), 0 3px 6px -1px rgba(0, 0, 0, 0.15), inset 1px 1px 3px rgba(255, 255, 255, 0.12), inset -2px -2px 4px rgba(0, 0, 0, 0.5)",
            y: isHovered ? -2 : 0,
          }}
          transition={{
            duration: 0.4,
            ease: "easeOut"
          }}
        >
          {/* Icon */}
          <div className="flex items-center justify-center w-full h-full relative z-10">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          className="mb-auto"
        >
          <motion.h3
            className="text-[15px] sm:text-[20px] md:text-[24px] font-medium text-white mb-2 sm:mb-3 font-figtree leading-tight"
            style={{
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
            }}
            initial={{ filter: "blur(3px)", opacity: 0.7 }}
            animate={{
              textShadow: isHovered ? "0 2px 4px rgba(0,0,0,0.2)" : "none",
              filter: "blur(0px)",
              opacity: 1,
            }}
            transition={{ duration: 1.2, delay: 0.2 }}
          >
            {title}
          </motion.h3>

          <motion.p
            className="text-xs sm:text-sm md:text-base mb-3 sm:mb-4 md:mb-6 text-gray-300 font-figtree font-light leading-snug"
            style={{
              lineHeight: 1.4,
            }}
            initial={{ filter: "blur(3px)", opacity: 0.7 }}
            animate={{
              textShadow: isHovered ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
              filter: "blur(0px)",
              opacity: 0.85,
            }}
            transition={{ duration: 1.2, delay: 0.4 }}
          >
            {description}
          </motion.p>

          {/* Benefits list */}
          <div className="space-y-1 sm:space-y-2">
            {benefits.map((benefit, idx) => (
              <motion.div
                key={idx}
                className="flex items-center gap-1.5 sm:gap-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + idx * 0.1 }}
              >
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs md:text-sm text-gray-300 font-figtree font-light leading-tight">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
});

GradientCard.displayName = 'GradientCard';
