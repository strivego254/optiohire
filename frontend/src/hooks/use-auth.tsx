'use client'

import { createContext, useContext, useState, useEffect } from 'react'

interface AuthUser {
  email: string
  id?: string
  created_at?: string
  role?: string
  name?: string | null
  companyRole?: string | null
  hasCompany?: boolean
  companyId?: string
  companyName?: string
  companyEmail?: string
  hrEmail?: string
  hiringManagerEmail?: string | null
}

interface AuthContextType {
  user: null | AuthUser
  loading: boolean
  signUp: (name: string, email: string, password: string, company_role: string, organization_name: string, company_email: string, hiring_manager_email: string) => Promise<{ error: null | { message: string } }>
  signIn: (email: string, password: string) => Promise<{ error: null | { message: string } }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<null | AuthUser>(null)
  const [loading, setLoading] = useState(true) // Start as true to check token on mount

  // Check for existing token on mount and fetch full user profile
  useEffect(() => {
    const loadUserProfile = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      try {
        // Try to decode token to get basic user info
        const payload = JSON.parse(atob(token.split('.')[1]))
        
        // Check token expiration
        const now = Math.floor(Date.now() / 1000)
        if (payload.exp && payload.exp < now) {
          // Token expired
          console.log('Token expired')
          localStorage.removeItem('token')
          setUser(null)
          setLoading(false)
          return
        }
        
        if (payload.sub && payload.email) {
          // Set basic user info immediately (non-blocking) for fast UI
          // Include role from token if available
          const basicUser = {
            email: payload.email,
            id: payload.sub,
            role: payload.role || undefined
          }
          setUser(basicUser)
          
          // Set loading to false immediately so UI can render
          setLoading(false)
          
          // Store basic user as fallback in case API call fails
          let fallbackUser = basicUser

          // Fetch full user profile from backend in background (non-blocking)
          // Use AbortController for timeout
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
          
          try {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
          const resp = await fetch(`${backendUrl}/api/user/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
              },
              signal: controller.signal
          })

            clearTimeout(timeoutId)

          if (resp.ok) {
            const userData = await resp.json()
            setUser({
              name: userData.name || null,
              email: userData.email,
              id: userData.id || userData.user_id,
              created_at: userData.created_at,
              role: userData.role,
              companyRole: userData.company_role || userData.companyRole || null,
              hasCompany: userData.hasCompany ?? false,
              companyId: userData.companyId || null,
              companyName: userData.companyName || null,
              companyEmail: userData.companyEmail || null,
              hrEmail: userData.hrEmail || null,
              hiringManagerEmail: userData.hiring_manager_email || userData.hiringManagerEmail || null
            })
            
            // STRICT: If user has no company and is not admin, deny access
            // But be lenient - if companyId exists, assume hasCompany is true
            if (!userData.hasCompany && !userData.companyId && userData.role !== 'admin') {
              console.error('Access denied: User has no company profile')
              localStorage.removeItem('token')
              setUser(null)
              // Redirect will be handled by dashboard guard
            } else if (userData.companyId && !userData.hasCompany) {
              // If companyId exists but hasCompany is false, set it to true
              setUser({
                ...userData,
                hasCompany: true
              })
            }
            } else if (resp.status === 401) {
              // Token invalid - clear it
              console.log('Token invalid (401), clearing')
            localStorage.removeItem('token')
            setUser(null)
            } else if (resp.status === 403) {
              // Access denied but token might be valid - keep basic user info
              console.warn('Access denied (403) but keeping user session with basic info')
              // Keep the basic user info from token
              setUser(fallbackUser)
            } else {
              // Other error (500, etc.) - keep user logged in with basic info
              console.error('Error fetching user profile:', resp.status, 'keeping basic user info')
              setUser(fallbackUser)
            }
          } catch (fetchError: any) {
            clearTimeout(timeoutId)
            // If it's an abort (timeout) or network error, keep the basic user info
            if (fetchError.name === 'AbortError') {
              console.warn('User profile fetch timed out, using basic info from token')
            } else {
              console.error('Error fetching user profile:', fetchError, 'keeping basic user info')
            }
            // Always keep the basic user info from token on network errors
            setUser(fallbackUser)
          }
        } else {
          // Invalid token payload
          console.log('Invalid token payload')
          localStorage.removeItem('token')
          setUser(null)
          setLoading(false)
        }
      } catch (e) {
        // Invalid token format, remove it
        console.error('Error decoding token:', e)
        localStorage.removeItem('token')
        setUser(null)
        setLoading(false)
      }
    }

    loadUserProfile()
  }, [])

  const signUp = async (name: string, email: string, password: string, company_role: string, organization_name: string, company_email: string, hiring_manager_email: string) => {
    try {
      setLoading(true)
      // Use Next.js API route instead of external backend
      // hr_email is set to company_email since the form doesn't have a separate hr_email field
      const resp = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          email, 
          password, 
          company_role, 
          company_name: organization_name, 
          company_email, 
          hr_email: company_email, // Use company_email as hr_email
          hiring_manager_email 
        })
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) {
        return { error: { message: data?.error || data?.details || 'Sign up failed' } }
      }
      if (data?.token) {
        localStorage.setItem('token', data.token)
        setUser({ 
          name: data?.user?.name || name,
          email: email.toLowerCase(),
          id: data?.user?.id || data?.user?.user_id, // Support both formats
          created_at: data?.user?.created_at,
          role: data?.user?.role,
          companyRole: data?.user?.company_role || company_role,
          hasCompany: data?.company ? true : (data?.user?.hasCompany ?? true), // Signup creates company, so should be true
          companyId: data?.company?.company_id || data?.user?.companyId || null,
          companyName: data?.company?.company_name || data?.user?.companyName || organization_name,
          companyEmail: data?.company?.company_email || data?.user?.companyEmail || company_email,
          hrEmail: data?.company?.hr_email || data?.user?.hrEmail || company_email,
          hiringManagerEmail: data?.company?.hiring_manager_email || data?.user?.hiringManagerEmail || hiring_manager_email
        })
      }
      return { error: null }
    } catch (err) {
      // Network error or other fetch errors
      const errorMessage = err instanceof Error ? err.message : 'Network error'
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        return { error: { message: 'Cannot connect to server. Please check your internet connection and try again.' } }
      }
      return { error: { message: errorMessage } }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      // Use Next.js API route instead of external backend
      const resp = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) {
        return { error: { message: data?.error || data?.details || 'Sign in failed' } }
      }
      if (data?.token) {
        localStorage.setItem('token', data.token)
        setUser({ 
          username: data?.user?.username || null,
          name: data?.user?.name || null,
          email: email.toLowerCase(),
          id: data?.user?.id || data?.user?.user_id, // Support both formats
          created_at: data?.user?.created_at,
          role: data?.user?.role,
          companyRole: data?.user?.company_role || null,
          hasCompany: data?.user?.hasCompany ?? false,
          companyId: data?.user?.companyId || null,
          companyName: data?.user?.companyName || null,
          companyEmail: data?.user?.companyEmail || null,
          hrEmail: data?.user?.hrEmail || null,
          hiringManagerEmail: data?.user?.hiringManagerEmail || null
        })
        
        // STRICT: If user has no company and is not admin, deny access immediately
        if (!data?.user?.hasCompany && data?.user?.role !== 'admin') {
          console.error('Access denied: User has no company profile')
          localStorage.removeItem('token')
          setUser(null)
          return { error: { message: 'Access denied: Company profile required. Please contact support.' } }
        }
      }
      return { error: null }
    } catch (err) {
      // Network error or other fetch errors
      const errorMessage = err instanceof Error ? err.message : 'Network error'
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        return { error: { message: 'Cannot connect to server. Please check your internet connection and try again.' } }
      }
      return { error: { message: errorMessage } }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
