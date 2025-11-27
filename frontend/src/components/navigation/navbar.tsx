'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import {
  Menu,
  X
} from 'lucide-react'
import { GradientButton } from '@/components/ui/gradient-button'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Features', href: '/features' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Contact', href: '/contact' },
]

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  return (
    <header className="fixed top-6 left-0 right-0 z-30 px-4 md:px-6">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 lg:px-6 rounded-[28px] border border-white/20 bg-white/10 backdrop-blur-xl supports-[backdrop-filter]:bg-white/5 shadow-lg" aria-label="Global">
        {/* Logo */}
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 flex items-center">
            <span className="sr-only">HR AI Agent</span>
            <div className="flex items-center space-x-2">
              <Image
                src="/assets/logo/ChatGPT%20Image%20Nov%208,%202025,%2010_47_18%20PM.png"
                alt="HR AI Agent"
                width={112}
                height={112}
                className="h-12 w-12 md:h-14 md:w-14 object-contain"
                priority
              />
              <span className="hidden sm:block text-white text-lg font-medium font-figtree">HR AI Agent</span>
            </div>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-white"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Desktop navigation */}
        <div className="hidden lg:flex lg:gap-x-12">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`text-base font-extralight leading-6 transition-colors hover:text-white font-figtree whitespace-nowrap ${
                pathname === item.href ? 'text-white font-medium' : 'text-white/90'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4 lg:items-center">
          {user ? (
            <GradientButton
              onClick={() => router.push('/dashboard')}
              showArrow={false}
            >
              Dashboard
            </GradientButton>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => router.push('/auth/signin')}
                className="text-white hover:text-white hover:bg-white/10 font-figtree"
              >
                Sign in
              </Button>
              <GradientButton
                onClick={() => router.push('/auth/signup')}
              >
                Get Started
              </GradientButton>
            </>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed top-0 right-0 bottom-auto z-50 w-full overflow-y-auto bg-white dark:bg-gray-900 px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10 rounded-[15px] max-h-[85vh] mt-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <Link href="/" className="-m-1.5 p-1.5 flex items-center" onClick={() => setMobileMenuOpen(false)}>
                <span className="sr-only">HR AI Agent</span>
                <div className="flex items-center space-x-2">
                  <Image
                    src="/assets/logo/ChatGPT%20Image%20Nov%208,%202025,%2010_47_18%20PM.png"
                    alt="HR AI Agent"
                    width={112}
                    height={112}
                    className="h-12 w-12 object-contain"
                    priority
                  />
                  <span className="text-gray-900 dark:text-white text-lg font-medium font-figtree">HR AI Agent</span>
                </div>
              </Link>
              <button
                type="button"
                className="-m-2.5 rounded-md p-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-200 dark:divide-gray-700">
                <div className="space-y-2 py-6">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="-mx-3 block rounded-lg px-3 py-2 text-base sm:text-lg font-light leading-7 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-l-4 hover:border-[#2D2DDD] transition-all duration-200 font-figtree"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
                <div className="py-6">
                  {user ? (
                    <div className="flex justify-center">
                      <GradientButton
                        onClick={() => {
                          router.push('/dashboard')
                          setMobileMenuOpen(false)
                        }}
                        showArrow={false}
                        className="w-auto min-w-[200px]"
                      >
                        Dashboard
                      </GradientButton>
                    </div>
                  ) : (
                    <div className="space-y-3 flex flex-col items-center">
                      <button
                        onClick={() => {
                          router.push('/auth/signin')
                          setMobileMenuOpen(false)
                        }}
                        className="w-auto min-w-[200px] h-10 px-6 rounded-lg border-2 border-[#2D2DDD] text-gray-900 dark:text-white font-medium font-figtree transition-all hover:bg-[#2D2DDD] hover:text-white"
                      >
                        Sign in
                      </button>
                      <GradientButton
                        onClick={() => {
                          router.push('/auth/signup')
                          setMobileMenuOpen(false)
                        }}
                        className="w-auto min-w-[200px]"
                      >
                        Get Started
                      </GradientButton>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
