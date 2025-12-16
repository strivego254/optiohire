'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Brain, Clock, DollarSign, Shield, TrendingUp, Users, Zap, Target } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ProjectData {
  title: string;
  description: string;
  link: string;
  color: string;
  value?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface ModernBusinessImpactProps {
  projects: ProjectData[];
  heading?: string;
  subheading?: string;
}

export default function ModernBusinessImpact({
  projects,
  heading,
  subheading,
}: ModernBusinessImpactProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollElement = container.querySelector('.business-impact-scroll') as HTMLElement;
    if (!scrollElement) return;

    // Track animation progress using requestAnimationFrame
    let startTime = Date.now();
    const duration = 30000; // 30 seconds (matches CSS animation duration)

    const updateProgress = () => {
      const elapsed = (Date.now() - startTime) % duration;
      const progress = elapsed / duration;
      
      // Calculate which card should be active based on progress
      // Since we have duplicated cards, we need to map progress to the original cards
      const currentIndex = Math.floor(progress * projects.length) % projects.length;
      setActiveIndex(currentIndex);

      animationRef.current = requestAnimationFrame(updateProgress);
    };

    // Also use IntersectionObserver as a backup to detect which card is most visible
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry with the highest intersection ratio
        let maxRatio = 0;
        let mostVisibleIndex = activeIndex;

        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            const cardIndex = parseInt(entry.target.getAttribute('data-card-index') || '0');
            mostVisibleIndex = cardIndex % projects.length;
          }
        });

        if (maxRatio > 0.3) {
          setActiveIndex(mostVisibleIndex);
        }
      },
      {
        root: container,
        rootMargin: '-20% 0px -20% 0px', // Only consider cards in the center 60% of the viewport
        threshold: [0, 0.3, 0.5, 0.7, 1],
      }
    );

    // Observe all cards
    const cards = container.querySelectorAll('[data-card-index]');
    cards.forEach((card) => observer.observe(card));

    // Start tracking animation progress
    updateProgress();

    return () => {
      observer.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [projects.length]);

  return (
    <section className="bg-black pt-12 pb-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="container mx-auto max-w-7xl px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 sm:mb-24">
          {heading && (
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-[27px] sm:text-[57px] md:text-[69px] font-extralight font-figtree tracking-tight leading-[1.05] text-white mb-6"
            >
              {heading}
            </motion.h2>
          )}
          {subheading && (
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-base sm:text-xl font-figtree font-light text-gray-300 max-w-3xl mx-auto"
            >
              {subheading}
            </motion.p>
          )}
        </div>

        {/* Mobile: Auto-scrolling horizontal container */}
        <div className="lg:hidden">
          <div ref={scrollContainerRef} className="overflow-hidden">
            <div className="flex gap-6 business-impact-scroll">
              {/* Duplicate cards for seamless loop */}
              {[...projects, ...projects].map((project, index) => (
                <div 
                  key={`${project.title}-${index}`} 
                  data-card-index={index}
                  className="flex-shrink-0 w-[85vw] max-w-sm"
                >
                  <ImpactCard project={project} index={index % projects.length} />
                </div>
              ))}
            </div>
          </div>
          
          {/* Progress Dots */}
          <div className="flex justify-center items-center gap-2 mt-6">
            {projects.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "transition-all duration-300 rounded-full",
                  activeIndex === index
                    ? "w-8 h-2 bg-[#2D2DDD]"
                    : "w-2 h-2 bg-white/30 hover:bg-white/50"
                )}
                aria-label={`Go to card ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Desktop: Grid layout */}
        {/* Large screens: 2 columns, XL screens: 4 columns in one row */}
        <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-8">
          {projects.map((project, index) => (
            <ImpactCard key={project.title} project={project} index={index} />
          ))}
        </div>
      </div>

      {/* Add CSS animation for auto-scroll */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes business-impact-scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(calc(-50% - 1.5rem));
            }
          }
          
          .business-impact-scroll {
            animation: business-impact-scroll 30s linear infinite;
            display: flex;
            width: fit-content;
          }
          
          .business-impact-scroll:hover {
            animation-play-state: paused;
          }
        `
      }} />
    </section>
  );
}

function ImpactCard({ project, index }: { project: ProjectData; index: number }) {
  const Icon = project.icon;
  
  // Alternate layout for variety if needed, but keeping it consistent is cleaner for "modern" look usually.
  // We'll use a consistent clean layout.
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative overflow-hidden rounded-[32px] bg-[#111] border border-white/10 hover:border-[#2D2DDD]/50 transition-colors duration-500 h-[500px] sm:h-[600px] flex flex-col"
    >
      {/* Content Section */}
      <div className="p-8 sm:p-10 relative z-20 flex flex-col h-full">
        <div className="flex items-start justify-between mb-6">
          <div className="bg-[#2D2DDD] p-3 rounded-2xl inline-flex items-center justify-center shadow-lg shadow-[#2D2DDD]/20">
            {Icon ? <Icon className="w-6 h-6 text-white" /> : <Zap className="w-6 h-6 text-white" />}
          </div>
          {project.value && (
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-white/10 text-white border border-white/10 backdrop-blur-sm">
              {project.value}
            </span>
          )}
        </div>

        <h3 className="text-2xl sm:text-3xl font-semibold font-figtree text-white mb-4 group-hover:text-[#2D2DDD] transition-colors duration-300">
          {project.title}
        </h3>
        
        <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-md font-figtree">
          {project.description}
        </p>

        {/* Image Section - Pushed to bottom */}
        <div className="mt-auto pt-8 relative w-full flex-grow overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent z-10" />
          <div className="relative w-full h-full transform group-hover:scale-105 transition-transform duration-700 ease-out">
            <Image
              src={project.link}
              alt={project.title}
              fill
              className="object-cover rounded-xl"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 50vw, 25vw"
              loading="lazy"
              quality={85}
            />
          </div>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div 
        className="absolute -inset-px bg-gradient-to-br from-[#2D2DDD] to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none rounded-[32px]" 
        aria-hidden="true" 
      />
    </motion.div>
  );
}
