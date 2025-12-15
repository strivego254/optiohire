'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { X, Cookie, Shield, Settings, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  functional: boolean
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, cannot be disabled
    analytics: false,
    marketing: false,
    functional: false,
  })

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      // Show banner after a short delay
      setTimeout(() => setShowBanner(true), 1000)
    } else {
      // Load saved preferences
      try {
        const saved = JSON.parse(consent)
        setPreferences(saved.preferences || preferences)
        // Apply saved preferences
        applyCookiePreferences(saved.preferences || preferences)
      } catch (e) {
        console.error('Error loading cookie preferences:', e)
      }
    }
  }, [])

  const applyCookiePreferences = (prefs: CookiePreferences) => {
    // Set cookies based on preferences
    if (prefs.analytics) {
      // Enable analytics cookies
      document.cookie = `analytics_enabled=true; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`
    } else {
      document.cookie = `analytics_enabled=false; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`
    }

    if (prefs.marketing) {
      document.cookie = `marketing_enabled=true; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`
    } else {
      document.cookie = `marketing_enabled=false; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`
    }

    if (prefs.functional) {
      document.cookie = `functional_enabled=true; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`
    } else {
      document.cookie = `functional_enabled=false; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`
    }

    // Always set necessary cookies
    document.cookie = `necessary_enabled=true; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`
    
    // Track consent timestamp
    document.cookie = `consent_timestamp=${Date.now()}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`
  }

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    }
    setPreferences(allAccepted)
    applyCookiePreferences(allAccepted)
    localStorage.setItem('cookie-consent', JSON.stringify({ 
      accepted: true, 
      preferences: allAccepted,
      timestamp: Date.now()
    }))
    setShowBanner(false)
    setShowPreferences(false)
  }

  const handleRejectAll = () => {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    }
    setPreferences(onlyNecessary)
    applyCookiePreferences(onlyNecessary)
    localStorage.setItem('cookie-consent', JSON.stringify({ 
      accepted: true, 
      preferences: onlyNecessary,
      timestamp: Date.now()
    }))
    setShowBanner(false)
    setShowPreferences(false)
  }

  const handleSavePreferences = () => {
    applyCookiePreferences(preferences)
    localStorage.setItem('cookie-consent', JSON.stringify({ 
      accepted: true, 
      preferences,
      timestamp: Date.now()
    }))
    setShowBanner(false)
    setShowPreferences(false)
  }

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return // Cannot disable necessary cookies
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (!showBanner && !showPreferences) return null

  return (
    <AnimatePresence>
      {(showBanner || showPreferences) && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
        >
          <Card className="max-w-sm ml-auto mr-4 sm:mr-6 shadow-2xl border-2 border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl">
            <CardContent className="p-4 sm:p-5">
              {!showPreferences ? (
                // Cookie Banner
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2D2DDD] to-[#2D2DDD]/80 flex items-center justify-center">
                        <Cookie className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1.5">
                        We Value Your Privacy
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        We use cookies to enhance your experience. By clicking "Accept All", you consent to our use of cookies. 
                        <a href="/privacy" className="text-[#2D2DDD] hover:underline font-medium ml-1">
                          Learn more
                        </a>.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => setShowPreferences(true)}
                      variant="outline"
                      size="sm"
                      className="text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <Settings className="w-3 h-3 mr-1.5" />
                      Customize
                    </Button>
                    <Button
                      onClick={handleRejectAll}
                      variant="outline"
                      size="sm"
                      className="text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Reject All
                    </Button>
                    <Button
                      onClick={handleAcceptAll}
                      size="sm"
                      className="text-xs bg-[#2D2DDD] hover:bg-[#2D2DDD]/90 text-white"
                    >
                      Accept All
                    </Button>
                  </div>
                </div>
              ) : (
                // Cookie Preferences
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                        Cookie Preferences
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Manage your cookie preferences. You can enable or disable different types of cookies below.
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        setShowPreferences(false)
                        setShowBanner(false)
                      }}
                      variant="ghost"
                      size="icon"
                      className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {/* Necessary Cookies */}
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Shield className="w-5 h-5 text-[#2D2DDD]" />
                          <h4 className="font-semibold text-gray-900 dark:text-white">Necessary Cookies</h4>
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                            Always Active
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Essential cookies required for the website to function properly. These cannot be disabled.
                        </p>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      </div>
                    </div>

                    {/* Analytics Cookies */}
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          <h4 className="font-semibold text-gray-900 dark:text-white">Analytics Cookies</h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Help us understand how visitors interact with our website by collecting and reporting information anonymously.
                        </p>
                      </div>
                      <button
                        onClick={() => togglePreference('analytics')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          preferences.analytics ? 'bg-[#2D2DDD]' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            preferences.analytics ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Marketing Cookies */}
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Cookie className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          <h4 className="font-semibold text-gray-900 dark:text-white">Marketing Cookies</h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Used to track visitors across websites to display relevant advertisements.
                        </p>
                      </div>
                      <button
                        onClick={() => togglePreference('marketing')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          preferences.marketing ? 'bg-[#2D2DDD]' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            preferences.marketing ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Functional Cookies */}
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          <h4 className="font-semibold text-gray-900 dark:text-white">Functional Cookies</h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Enable enhanced functionality and personalization, such as remembering your preferences.
                        </p>
                      </div>
                      <button
                        onClick={() => togglePreference('functional')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          preferences.functional ? 'bg-[#2D2DDD]' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            preferences.functional ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      onClick={handleSavePreferences}
                      className="flex-1 bg-[#2D2DDD] hover:bg-[#2D2DDD]/90 text-white"
                    >
                      Save Preferences
                    </Button>
                    <Button
                      onClick={handleAcceptAll}
                      variant="outline"
                      className="flex-1 border-[#2D2DDD] text-[#2D2DDD] hover:bg-[#2D2DDD] hover:text-white"
                    >
                      Accept All
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

