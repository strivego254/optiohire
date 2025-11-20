'use client'

import { createContext, useContext, useState, useEffect } from 'react'

interface AuthUser {
  email: string
  id?: string
  created_at?: string
  role?: string
  hasCompany?: boolean
  companyId?: string
}

interface AuthContextType {
  user: null | AuthUser
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: null | { message: string } }>
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
        if (payload.sub && payload.email) {
          // Set basic user info immediately
          setUser({
            email: payload.email,
            id: payload.sub
          })

          // Fetch full user profile from backend
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
          const resp = await fetch(`${backendUrl}/api/user/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })

          if (resp.ok) {
            const userData = await resp.json()
            setUser({
              email: userData.email,
              id: userData.id || userData.user_id,
              created_at: userData.created_at,
              role: userData.role,
              hasCompany: userData.hasCompany ?? false,
              companyId: userData.companyId || null
            })
            
            // STRICT: If user has no company and is not admin, deny access
            if (!userData.hasCompany && userData.role !== 'admin') {
              console.error('Access denied: User has no company profile')
              localStorage.removeItem('token')
              setUser(null)
              // Redirect will be handled by dashboard guard
            }
          } else if (resp.status === 401 || resp.status === 403) {
            // Token invalid or access denied, remove it
            localStorage.removeItem('token')
            setUser(null)
          }
        }
      } catch (e) {
        // Invalid token, remove it
        console.error('Error loading user profile:', e)
        localStorage.removeItem('token')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    loadUserProfile()
  }, [])

  const signUp = async (email: string, password: string, company_name: string, company_email: string, hr_email: string) => {
    try {
      setLoading(true)
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
      const resp = await fetch(`${backendUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, company_name, company_email, hr_email })
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) {
        return { error: { message: data?.error || data?.details || 'Sign up failed' } }
      }
      if (data?.token) {
        localStorage.setItem('token', data.token)
        setUser({ 
          email: email.toLowerCase(),
          id: data?.user?.id || data?.user?.user_id, // Support both formats
          created_at: data?.user?.created_at,
          role: data?.user?.role,
          hasCompany: data?.company ? true : (data?.user?.hasCompany ?? true), // Signup creates company, so should be true
          companyId: data?.company?.company_id || data?.user?.companyId || null
        })
      }
      return { error: null }
    } catch (err) {
      // Network error or other fetch errors
      const errorMessage = err instanceof Error ? err.message : 'Network error'
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        return { error: { message: 'Cannot connect to server. Please ensure the backend is running on port 3001.' } }
      }
      return { error: { message: errorMessage } }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
      const resp = await fetch(`${backendUrl}/auth/signin`, {
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
          email: email.toLowerCase(),
          id: data?.user?.id || data?.user?.user_id, // Support both formats
          created_at: data?.user?.created_at,
          role: data?.user?.role,
          hasCompany: data?.user?.hasCompany ?? false,
          companyId: data?.user?.companyId || null
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
        return { error: { message: 'Cannot connect to server. Please ensure the backend is running on port 3001.' } }
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
