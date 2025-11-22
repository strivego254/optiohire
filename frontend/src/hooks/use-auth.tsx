'use client'

import { createContext, useContext, useState, useEffect } from 'react'

interface AuthUser {
  email: string
  id?: string
  created_at?: string
  role?: string
  username?: string | null
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
  signUp: (username: string, name: string, email: string, password: string, company_role: string, organization_name: string, company_email: string, hr_email: string, hiring_manager_email: string) => Promise<{ error: null | { message: string } }>
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
              username: userData.username || null,
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

  const signUp = async (username: string, name: string, email: string, password: string, company_role: string, organization_name: string, company_email: string, hr_email: string, hiring_manager_email: string) => {
    try {
      setLoading(true)
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
      const resp = await fetch(`${backendUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          name, 
          email, 
          password, 
          company_role, 
          company_name: organization_name, 
          company_email, 
          hr_email, 
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
          username: data?.user?.username || username,
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
          hrEmail: data?.company?.hr_email || data?.user?.hrEmail || hr_email,
          hiringManagerEmail: data?.company?.hiring_manager_email || data?.user?.hiringManagerEmail || hiring_manager_email
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
          companyId: data?.user?.companyId || null,
          companyName: data?.user?.companyName || null,
          companyEmail: data?.user?.companyEmail || null,
          hrEmail: data?.user?.hrEmail || null
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
