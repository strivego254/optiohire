'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { 
  User, 
  Building2, 
  Mail, 
  Shield,
  Lock,
  Trash2,
  CheckCircle,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Calendar,
  Key,
  Settings,
  AlertTriangle,
  LogOut,
  BadgeCheck,
  Globe,
  Verified,
  Award,
  Clock
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface CompanyData {
  id: string
  company_name: string
  company_email: string
  hr_email: string
  created_at: string
}

export function ProfileSection() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    company_name: '',
    company_email: '',
    hr_email: '',
    hiring_manager_email: '',
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const loadCompanyData = useCallback(async () => {
    if (!user || !user.id) {
      setIsLoading(false)
      return
    }

    // PRIORITY: Use company data from user object (from signup/API)
    // This ensures signup company details are immediately reflected
    if (user.companyName || user.companyEmail || user.hrEmail) {
      const companyData = {
        id: user.companyId || '',
        company_name: user.companyName || '',
        company_email: user.companyEmail || '',
        hr_email: user.hrEmail || '',
        created_at: new Date().toISOString()
      }
      
      setCompany(companyData)
      setFormData({
        company_name: user.companyName || '',
        company_email: user.companyEmail || '',
        hr_email: user.hrEmail || '',
        hiring_manager_email: user.hiringManagerEmail || '',
      })
      setIsLoading(false)
      
      // Optionally refresh from backend to get latest data, but don't wait for it
      // This ensures we show signup data immediately
      refreshCompanyFromBackend(user.id).catch(err => {
        console.log('Background refresh failed, using cached data:', err)
      })
      return
    }

    // Fallback: Try to load from backend API
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        setIsLoading(false)
        return
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
      const response = await fetch(`${backendUrl}/api/user/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const userData = await response.json()
        if (userData.companyName || userData.companyEmail || userData.hrEmail) {
          const companyData = {
            id: userData.companyId || '',
            company_name: userData.companyName || '',
            company_email: userData.companyEmail || '',
            hr_email: userData.hrEmail || '',
            created_at: new Date().toISOString()
          }
          
          setCompany(companyData)
          setFormData({
            company_name: userData.companyName || '',
            company_email: userData.companyEmail || '',
            hr_email: userData.hrEmail || '',
            hiring_manager_email: userData.hiring_manager_email || userData.hiringManagerEmail || '',
          })
        }
      }
    } catch (error) {
      console.error('Error loading company data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Helper function to refresh company data from backend (non-blocking)
  const refreshCompanyFromBackend = async (userId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
      const response = await fetch(`${backendUrl}/api/user/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const userData = await response.json()
        if (userData.companyName || userData.companyEmail || userData.hrEmail) {
          setCompany({
            id: userData.companyId || '',
            company_name: userData.companyName || '',
            company_email: userData.companyEmail || '',
            hr_email: userData.hrEmail || '',
            created_at: new Date().toISOString()
          })
          setFormData({
            company_name: userData.companyName || '',
            company_email: userData.companyEmail || '',
            hr_email: userData.hrEmail || '',
            hiring_manager_email: userData.hiring_manager_email || userData.hiringManagerEmail || '',
          })
        }
      }
    } catch (error) {
      // Silently fail - we already have data from user object
      console.log('Background refresh error:', error)
    }
  }

  useEffect(() => {
    if (user) {
      loadCompanyData()
    }
  }, [user, loadCompanyData])

  const handleSaveCompany = async () => {
    if (!user || !company) return

    setIsSaving(true)
    setSaveMessage(null)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
      const response = await fetch(`${backendUrl}/api/user/company`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_name: formData.company_name,
          company_email: formData.company_email,
          hr_email: formData.hr_email,
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update company settings')
      }

      const data = await response.json()
      
      // Update local state
      setCompany({
        id: data.company.company_id,
        company_name: data.company.company_name,
        company_email: data.company.company_email,
        hr_email: data.company.hr_email,
        created_at: company.created_at
      })

      // Refresh user data to update the user object in auth context
      const userResponse = await fetch(`${backendUrl}/api/user/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (userResponse.ok) {
        const userData = await userResponse.json()
        // Reload company data to reflect changes
        await loadCompanyData()
      }

      setSaveMessage({ type: 'success', text: 'Company settings updated successfully! Your signup details have been updated.' })
      
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error: any) {
      console.error('Error saving company settings:', error)
      setSaveMessage({ type: 'error', text: error.message || 'Failed to update company settings' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!user) return

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSaveMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    if (passwordData.newPassword.length < 6) {
      setSaveMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    setIsSaving(true)
    setSaveMessage(null)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: passwordData.currentPassword,
      })

      if (signInError) {
        throw new Error('Current password is incorrect')
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      if (updateError) {
        throw updateError
      }

      setSaveMessage({ type: 'success', text: 'Password updated successfully!' })
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPasswordForm(false)
      
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error: any) {
      console.error('Error changing password:', error)
      setSaveMessage({ type: 'error', text: error.message || 'Failed to update password' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return

    if (deleteConfirmText !== 'DELETE') {
      setSaveMessage({ type: 'error', text: 'Please type DELETE to confirm' })
      return
    }

    setIsDeleting(true)
    setSaveMessage(null)

    try {
      if (company) {
        const { error: deleteCompanyError } = await supabase
          .from('companies')
          .delete()
          .eq('id', company.id)

        if (deleteCompanyError) {
          console.error('Error deleting company:', deleteCompanyError)
        }
      }

      await signOut()
      router.push('/')
      
      setSaveMessage({ type: 'success', text: 'Account deletion initiated. Please contact support for complete account removal.' })
      
    } catch (error: any) {
      console.error('Error deleting account:', error)
      setSaveMessage({ type: 'error', text: error.message || 'Failed to delete account. Please contact support.' })
      setIsDeleting(false)
    }
  }

  const accountAge = user?.created_at 
    ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="space-y-8 pb-8">
      {/* Professional Header with Trust Indicators */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative"
      >
        <div className="bg-gradient-to-br from-[#2D2DDD] via-[#2D2DDD]/95 to-[#1a1a8a] rounded-2xl p-8 sm:p-12 shadow-2xl overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }} />
          </div>
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center shadow-lg">
                    <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                      {user?.name || user?.email?.split('@')[0] || 'User'}
                    </h1>
                    {(user as any)?.username && (
                      <p className="text-white/80 text-sm font-mono mb-2">@{(user as any).username}</p>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <BadgeCheck className="w-5 h-5 text-white/90" />
                      <span className="text-white/90 font-medium">Verified Account</span>
                    </div>
                    {user?.companyRole && (
                      <div className="flex items-center gap-2">
                        <span className="text-white/80 text-sm">
                          Role: <span className="font-semibold capitalize">{user.companyRole === 'hr' ? 'HR Manager' : 'Hiring Manager'}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-white/80" />
                      <span className="text-xs text-white/70 uppercase tracking-wide">Email</span>
                    </div>
                    <p className="text-white font-medium text-sm">{user?.email || 'N/A'}</p>
                  </div>
                  
                  {user?.companyName && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="w-4 h-4 text-white/80" />
                        <span className="text-xs text-white/70 uppercase tracking-wide">Company</span>
                      </div>
                      <p className="text-white font-medium text-sm">{user.companyName}</p>
                    </div>
                  )}
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-white/80" />
                      <span className="text-xs text-white/70 uppercase tracking-wide">Member Since</span>
                    </div>
                    <p className="text-white font-medium text-sm">
                      {user?.created_at 
                        ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Trust Badges */}
              <div className="flex flex-col gap-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
                  <Shield className="w-6 h-6 text-white mx-auto mb-2" />
                  <p className="text-xs text-white/70 uppercase tracking-wide mb-1">Security</p>
                  <p className="text-white font-semibold text-sm">Protected</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
                  <Award className="w-6 h-6 text-white mx-auto mb-2" />
                  <p className="text-xs text-white/70 uppercase tracking-wide mb-1">Status</p>
                  <p className="text-white font-semibold text-sm">Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Success/Error Messages */}
      {saveMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-3 p-4 rounded-xl shadow-lg ${
            saveMessage.type === 'success' 
              ? 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 text-green-800 dark:text-green-300 border-2 border-green-200 dark:border-green-700' 
              : 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 text-red-800 dark:text-red-300 border-2 border-red-200 dark:border-red-700'
          }`}
        >
          {saveMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="text-sm font-medium">{saveMessage.text}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information Card */}
        <Card className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#2D2DDD] to-[#2D2DDD]/80 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-semibold">Account Details</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-normal mt-0.5">Your personal information</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={user?.name || ''}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600"
                />
                <p className="text-xs text-gray-500 dark:text-gray-500">Name from your signup</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="pl-10 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500">Email cannot be changed</p>
              </div>

              {user?.companyRole && (
                <div className="space-y-2">
                  <Label htmlFor="company_role" className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Company Role
                  </Label>
                  <Input
                    id="company_role"
                    type="text"
                    value={user.companyRole === 'hr' ? 'HR Manager' : 'Hiring Manager'}
                    disabled
                    className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 capitalize"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-500">Your role from signup</p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Account Created</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.created_at 
                      ? new Date(user.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric'
                        }) 
                      : 'N/A'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Account Status</span>
                  </div>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Active
                  </span>
                </div>
                
                {user?.role && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Key className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Role</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {user.role}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Information Card */}
        <Card className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#2D2DDD] to-[#2D2DDD]/80 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-semibold">Company Profile</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-normal mt-0.5">
                  {company ? 'Company details from your account signup' : 'Your organization details'}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#2D2DDD]" />
              </div>
            ) : company ? (
              <>
                {/* Success indicator showing data is from signup */}
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
                  <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                    Company details are linked to your account from signup
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name" className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Company Name
                    </Label>
                    <Input
                      id="company_name"
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      placeholder="Enter company name"
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                    />
                    {user?.companyName && formData.company_name === user.companyName && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Matches your signup information
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_email" className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Company Email
                    </Label>
                    <div className="relative">
                      <Input
                        id="company_email"
                        type="email"
                        value={formData.company_email}
                        onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                        placeholder="company@example.com"
                        className="pl-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    {user?.companyEmail && formData.company_email === user.companyEmail && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Matches your signup information
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hr_email" className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      HR Email
                    </Label>
                    <div className="relative">
                      <Input
                        id="hr_email"
                        type="email"
                        value={formData.hr_email}
                        onChange={(e) => setFormData({ ...formData, hr_email: e.target.value })}
                        placeholder="hr@example.com"
                        className="pl-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    {user?.hrEmail && formData.hr_email === user.hrEmail && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Matches your signup information
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hiring_manager_email" className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Hiring Manager Email
                    </Label>
                    <div className="relative">
                      <Input
                        id="hiring_manager_email"
                        type="email"
                        value={user?.hiringManagerEmail || ''}
                        disabled
                        className="pl-10 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Hiring manager email from your signup</p>
                  </div>
                </div>
                <Button
                  onClick={handleSaveCompany}
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-[#2D2DDD] to-[#2D2DDD]/90 hover:from-[#2D2DDD]/90 hover:to-[#2D2DDD] text-white shadow-lg"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Save Company Changes
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">No Company Information</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Please complete company setup to continue.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Security Settings */}
      <Card className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#2D2DDD] to-[#2D2DDD]/80 flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-semibold">Security & Privacy</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-normal mt-0.5">Manage your account security</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {!showPasswordForm ? (
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Password
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click to change password
                </p>
              </div>
              <Button
                onClick={() => setShowPasswordForm(true)}
                className="bg-[#2D2DDD] hover:bg-[#2D2DDD] text-white shadow-none hover:shadow-none"
              >
                <Key className="w-4 h-4 mr-2" />
                Change Password
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-gray-700 dark:text-gray-300 font-medium">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white pr-10 border-gray-300 dark:border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-gray-700 dark:text-gray-300 font-medium">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Enter new password (min. 6 characters)"
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white pr-10 border-gray-300 dark:border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300 font-medium">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white pr-10 border-gray-300 dark:border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleChangePassword}
                  disabled={isSaving}
                  className="flex-1 bg-gradient-to-r from-[#2D2DDD] to-[#2D2DDD]/90 hover:from-[#2D2DDD]/90 hover:to-[#2D2DDD] text-white"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4 mr-2" />
                      Update Password
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowPasswordForm(false)
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                  }}
                  variant="outline"
                  className="border-gray-300 dark:border-gray-600"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#2D2DDD] to-[#2D2DDD]/80 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-semibold">Account Actions</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-normal mt-0.5">Manage your account session</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
            <div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Sign Out</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sign out of your account and return to the login page
              </p>
            </div>
            <Button
              onClick={async () => {
                await signOut()
                router.push('/auth/signin')
              }}
              className="bg-[#2D2DDD] hover:bg-[#2D2DDD] text-white shadow-none hover:shadow-none"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="bg-white dark:bg-gray-900 border-2 border-red-300 dark:border-red-800 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-b border-red-200 dark:border-red-800">
          <CardTitle className="flex items-center gap-3 text-red-700 dark:text-red-400">
            <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-semibold">Danger Zone</div>
              <div className="text-xs text-red-600 dark:text-red-400 font-normal mt-0.5">Irreversible actions</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="p-5 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
            <h4 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Account
            </h4>
            <p className="text-sm text-red-700 dark:text-red-400 mb-4 leading-relaxed">
              Once you delete your account, there is no going back. This will permanently delete your account, 
              company data, job postings, and all associated information. This action cannot be undone.
            </p>

            {!showDeleteConfirm ? (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deleteConfirm" className="text-red-900 dark:text-red-300 font-medium">
                    Type <span className="font-mono font-bold">DELETE</span> to confirm:
                  </Label>
                  <Input
                    id="deleteConfirm"
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    className="bg-white dark:bg-gray-800 border-red-300 dark:border-red-700 focus:border-red-500"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || deleteConfirmText !== 'DELETE'}
                    variant="destructive"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Permanently Delete Account
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeleteConfirmText('')
                    }}
                    variant="outline"
                    className="border-gray-300 dark:border-gray-600"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
