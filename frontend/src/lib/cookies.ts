/**
 * Cookie utility functions for tracking user preferences and analytics
 */

export interface CookieData {
  userId?: string
  sessionId: string
  timestamp: number
  preferences: {
    analytics: boolean
    marketing: boolean
    functional: boolean
  }
  deviceInfo?: {
    userAgent: string
    screenWidth: number
    screenHeight: number
    timezone: string
    language: string
  }
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

/**
 * Get or create session ID
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  
  let sessionId = localStorage.getItem('session_id')
  if (!sessionId) {
    sessionId = generateSessionId()
    localStorage.setItem('session_id', sessionId)
  }
  return sessionId
}

/**
 * Check if analytics cookies are enabled
 */
export function isAnalyticsEnabled(): boolean {
  if (typeof window === 'undefined') return false
  
  const consent = localStorage.getItem('cookie-consent')
  if (!consent) return false
  
  try {
    const data = JSON.parse(consent)
    return data.preferences?.analytics === true
  } catch {
    return false
  }
}

/**
 * Track user activity (only if analytics is enabled)
 */
export function trackActivity(event: string, data?: Record<string, any>) {
  if (!isAnalyticsEnabled()) return
  
  const sessionId = getSessionId()
  const activity = {
    event,
    sessionId,
    timestamp: Date.now(),
    data: data || {},
    url: window.location.href,
    path: window.location.pathname,
  }
  
  // Store in localStorage for batch sending
  const activities = JSON.parse(localStorage.getItem('user_activities') || '[]')
  activities.push(activity)
  
  // Keep only last 100 activities
  if (activities.length > 100) {
    activities.shift()
  }
  
  localStorage.setItem('user_activities', JSON.stringify(activities))
  
  // Send to backend if available
  sendActivityToBackend(activity).catch(err => {
    console.error('Failed to send activity to backend:', err)
  })
}

/**
 * Send activity to backend
 */
async function sendActivityToBackend(activity: any) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
    const token = localStorage.getItem('token')
    
    await fetch(`${backendUrl}/api/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(activity),
    })
  } catch (error) {
    // Silently fail - analytics should not break the app
    console.error('Analytics tracking error:', error)
  }
}

/**
 * Get device information
 */
export function getDeviceInfo() {
  if (typeof window === 'undefined') {
    return {
      userAgent: '',
      screenWidth: 0,
      screenHeight: 0,
      timezone: '',
      language: '',
    }
  }
  
  return {
    userAgent: navigator.userAgent,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language || 'en',
  }
}

/**
 * Initialize cookie tracking
 */
export function initializeCookieTracking() {
  if (typeof window === 'undefined') return
  
  const sessionId = getSessionId()
  const deviceInfo = getDeviceInfo()
  
  // Store device info
  localStorage.setItem('device_info', JSON.stringify(deviceInfo))
  
  // Track page view
  trackActivity('page_view', {
    path: window.location.pathname,
    referrer: document.referrer,
    deviceInfo,
  })
  
  // Track session start
  trackActivity('session_start', {
    sessionId,
    deviceInfo,
  })
}

/**
 * Get all stored cookie data
 */
export function getCookieData(): CookieData | null {
  if (typeof window === 'undefined') return null
  
  const consent = localStorage.getItem('cookie-consent')
  const sessionId = getSessionId()
  const deviceInfo = getDeviceInfo()
  
  if (!consent) return null
  
  try {
    const consentData = JSON.parse(consent)
    return {
      sessionId,
      timestamp: consentData.timestamp || Date.now(),
      preferences: consentData.preferences || {
        analytics: false,
        marketing: false,
        functional: false,
      },
      deviceInfo,
    }
  } catch {
    return null
  }
}

