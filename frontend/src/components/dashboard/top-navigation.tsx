'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Briefcase, 
  BarChart3, 
  Calendar,
  Settings,
  Home
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

const quickNavItems = [
  {
    label: 'Home',
    icon: Home,
    href: '/dashboard',
    id: 'overview',
  },
  {
    label: 'Jobs',
    icon: Briefcase,
    href: '/dashboard/jobs',
    id: 'jobs',
  },
  {
    label: 'Reports',
    icon: BarChart3,
    href: '/dashboard/reports',
    id: 'reports',
  },
  {
    label: 'Interviews',
    icon: Calendar,
    href: '/dashboard/interviews',
    id: 'interviews',
  },
  {
    label: 'Profile',
    icon: Settings,
    href: '/dashboard/profile',
    id: 'profile',
  },
]

export function TopNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()

  // Don't show on admin pages or auth pages
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/auth')) {
    return null
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1">
      {quickNavItems.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
        return (
              <Button
                key={item.id}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  try {
                    router.push(item.href)
                  } catch (error) {
                    console.error('Navigation error:', error)
                  }
                }}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap',
                  isActive 
                    ? 'bg-[#2D2DDD] text-white hover:bg-[#2D2DDD] shadow-none hover:shadow-none' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#2D2DDD] dark:hover:text-white'
                )}
              >
            <item.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{item.label}</span>
          </Button>
        )
      })}
    </div>
  )
}

