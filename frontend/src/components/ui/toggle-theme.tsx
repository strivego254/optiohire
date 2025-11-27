'use client'

import React from 'react'
import { Monitor, MoonStar, Sun } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

const THEME_OPTIONS = [
  { icon: Monitor, value: 'system' },
  { icon: Sun, value: 'light' },
  { icon: MoonStar, value: 'dark' },
]

export function ToggleTheme() {
  const themeContext = useTheme()
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted || !themeContext) {
    return <div className="flex h-8 w-24" />
  }

  const { theme, setTheme, resolvedTheme } = themeContext

  if (!setTheme) {
    return <div className="flex h-8 w-24" />
  }

  // Determine if option is active (considering system theme)
  const isActive = (optionValue: string) => {
    if (optionValue === 'system') {
      return theme === 'system'
    }
    return theme === optionValue || (theme === 'system' && resolvedTheme === optionValue)
  }

  const handleThemeChange = (value: string) => {
    console.log('Changing theme to:', value)
    setTheme(value)
    // Force a small delay to ensure the theme is applied
    setTimeout(() => {
      console.log('Theme changed. Current theme:', document.documentElement.classList.contains('dark') ? 'dark' : 'light')
    }, 100)
  }

  return (
    <motion.div
      key={String(isMounted)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-gray-100 dark:bg-gray-800 inline-flex items-center overflow-hidden rounded-md border border-gray-300 dark:border-gray-700"
      role="radiogroup"
      aria-label="Theme selector"
    >
      {THEME_OPTIONS.map((option) => {
        const active = isActive(option.value)
        return (
          <button
            key={option.value}
            className={cn(
              'relative flex size-7 cursor-pointer items-center justify-center rounded-md transition-all z-10',
              active
                ? 'text-[#2D2DDD] dark:text-white' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
            )}
            role="radio"
            aria-checked={active}
            aria-label={`Switch to ${option.value} theme`}
            onClick={() => handleThemeChange(option.value)}
          >
            {active && (
              <motion.div
                layoutId="theme-option"
                transition={{ type: 'spring', bounce: 0.1, duration: 0.75 }}
                className="border-[#2D2DDD] dark:border-white/50 absolute inset-0 rounded-md border-2 bg-white dark:bg-gray-700"
              />
            )}
            <option.icon className="size-3.5 relative z-10" />
          </button>
        )
      })}
    </motion.div>
  )
}


