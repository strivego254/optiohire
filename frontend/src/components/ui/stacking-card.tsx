'use client';
import { ReactLenis } from 'lenis/react';
import { useTransform, motion, useScroll, MotionValue } from 'framer-motion';
import { useRef, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ProjectData {
  title: string;
  description: string;
  link: string;
  color: string;
  value?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface CardProps {
  i: number;
  title: string;
  description: string;
  url: string;
  color: string;
  value?: string;
  icon?: React.ComponentType<{ className?: string }>;
  progress: MotionValue<number>;
  range: [number, number];
  targetScale: number;
}

export const Card = ({
  i,
  title,
  description,
  url,
  color,
  value,
  icon: Icon,
  progress,
  range,
  targetScale,
}: CardProps) => {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start end', 'start start'],
  });

  const imageScale = useTransform(scrollYProgress, [0, 1], [2, 1]);
  const scale = useTransform(progress, range, [1, targetScale]);

  return (
    <div
      ref={container}
      className='h-screen flex items-center justify-center sticky top-[80px]'
    >
      <motion.div
        style={{
          backgroundColor: color,
          scale,
          top: `calc(0vh + ${i * 25}px)`,
        }}
        className={`flex flex-col relative -top-[15%] lg:-top-[18%] h-[580px] lg:h-[680px] w-[80%] lg:w-[85%] rounded-[25px] p-10 origin-top`}
      >
                <h2 className='text-[15px] sm:text-[20px] md:text-[24px] text-center font-semibold font-figtree text-white mb-6'>{title}</h2>
        <div className={`flex h-full mt-5 gap-10`}>
          <div className={`w-[40%] relative top-[10%] flex flex-col`}>
            <div>
              {Icon && (
                <div className='mb-6'>
                  <div className='w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg'>
                    <Icon className='w-8 h-8 text-white' />
                  </div>
                </div>
              )}
              <p className='text-xs sm:text-sm md:text-base text-white/90 font-figtree font-semibold leading-relaxed mb-6'>{description}</p>
            </div>
            {value && (
              <div className='mt-4'>
                <div className='text-2xl sm:text-4xl font-semibold text-white font-figtree bg-white/10 backdrop-blur-sm px-4 py-2 rounded-[25px] inline-block border border-white/20'>
                  {value}
                </div>
              </div>
            )}
          </div>

          <div className="relative w-[60%] h-full rounded-[25px] overflow-hidden">
            <motion.div
              className="relative w-full h-full"
              style={{ scale: imageScale }}
            >
              <Image
                src={url}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 600px"
                priority={i === 0}
                loading={i === 0 ? undefined : "lazy"}
                quality={85}
              />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

interface ComponentRootProps {
  projects: ProjectData[];
  heading?: string;
  subheading?: string;
}

const StackingCardComponent = forwardRef<HTMLElement, ComponentRootProps>(
  ({ projects, heading, subheading }, ref) => {
    const container = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
      target: container,
      offset: ['start start', 'end end'],
    });

    return (
      <ReactLenis root>
        <section className='bg-slate-950 text-white' ref={container as any}>
          {heading && (
            <div className='h-[20vh] w-full bg-slate-950 grid place-content-center relative'>
              <div className='absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]'></div>
              
              <div className='relative z-10 text-center px-8 pt-8 lg:pt-12 pb-4'>
                <h1 className='text-[27px] sm:text-[57px] md:text-[69px] font-extralight font-figtree text-center tracking-tight leading-[1.05] mb-4'>
                  {heading}
                </h1>
                {subheading && (
                  <p className='text-base sm:text-xl font-figtree font-semibold text-gray-300 max-w-2xl mx-auto'>
                    {subheading}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className='text-white w-full bg-slate-950 pt-[40px]'>
            {projects.map((project, i) => {
              const targetScale = 1 - (projects.length - i) * 0.05;
              return (
                <Card
                  key={`p_${i}`}
                  i={i}
                  url={project.link}
                  title={project.title}
                  color={project.color}
                  description={project.description}
                  value={project.value}
                  icon={project.icon}
                  progress={scrollYProgress}
                  range={[i * 0.25, 1]}
                  targetScale={targetScale}
                />
              );
            })}
          </div>
        </section>
      </ReactLenis>
    );
  }
);

StackingCardComponent.displayName = 'StackingCardComponent';

export default StackingCardComponent;

