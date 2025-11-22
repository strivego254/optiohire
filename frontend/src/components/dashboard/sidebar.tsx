'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  BarChart3, 
  Settings, 
  ChevronRight,
  Calendar,
  Shield
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'

const sidebarItems = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    id: 'jobs',
    label: 'Job Postings',
    icon: Briefcase,
    href: '/dashboard/jobs',
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    icon: BarChart3,
    href: '/dashboard/reports',
  },
  {
    id: 'interviews',
    label: 'Interviews',
    icon: Calendar,
    href: '/dashboard/interviews',
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: Settings,
    href: '/dashboard/profile',
  },
]

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const logoSrc =
    resolvedTheme === 'light'
      ? '/assets/logo/black_logo.png'
      : '/assets/logo/ChatGPT%20Image%20Nov%208,%202025,%2010_47_18%20PM.png'

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 h-screen sticky top-0 ${
        isCollapsed ? 'w-16' : 'w-64'
      } transition-all duration-300 overflow-y-auto`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              {mounted ? (
                <Image
                  src={logoSrc}
                  alt="Hirebit logo"
                  fill
                  sizes="40px"
                  className="object-contain"
                  priority
                />
              ) : (
                <span className="block h-full w-full rounded-lg bg-muted-foreground/20" />
              )}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">HireBit</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">HR Platform</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 sm:p-4 space-y-2 overflow-y-auto">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 group ${
                  isActive
                    ? 'bg-[#2D2DDD] text-white shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#2D2DDD] dark:hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-[#2D2DDD] dark:group-hover:text-white'}`} />
                {!isCollapsed && (
                  <>
                    <span className="font-figtree font-medium">{item.label}</span>
                    {isActive && (
                      <ChevronRight className="w-4 h-4 ml-auto text-white" />
                    )}
                  </>
                )}
              </Link>
            )
          })}
          
          {/* Admin Dashboard Link (only for admins) */}
          {user?.role === 'admin' && (
            <button
              onClick={() => router.push('/admin')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group ${
                pathname?.startsWith('/admin')
                  ? 'bg-gradient-to-r from-purple-600/10 to-purple-600/5 dark:from-purple-600/20 dark:to-purple-600/10 text-purple-600 dark:text-purple-400 border border-purple-600/30 dark:border-purple-600/50'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-purple-600 dark:hover:text-purple-400'
              }`}
            >
              <Shield className={`w-5 h-5 flex-shrink-0 ${pathname?.startsWith('/admin') ? 'text-purple-600' : 'text-gray-500 dark:text-gray-400 group-hover:text-purple-600'}`} />
              {!isCollapsed && (
                <>
                  <span className="font-figtree font-medium">Admin Dashboard</span>
                  {pathname?.startsWith('/admin') && (
                    <ChevronRight className="w-4 h-4 ml-auto text-purple-600" />
                  )}
                </>
              )}
            </button>
          )}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
