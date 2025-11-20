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
  AlertTriangle
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

    try {
      setIsLoading(true)
      // Try Supabase first - use company_id as primary key
      const { data, error } = await supabase
        .from('companies')
        .select('company_id, id, company_name, company_email, hr_email, created_at')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading company:', error)
        // Fallback to backend API if Supabase fails
        try {
          const token = localStorage.getItem('token')
          if (token) {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
            const resp = await fetch(`${backendUrl}/api/companies?user_id=${user.id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })
            if (resp.ok) {
              const companyData = await resp.json()
              if (companyData && companyData.length > 0) {
                const comp = companyData[0]
                setCompany({
                  id: comp.company_id || comp.id,
                  company_name: comp.company_name || '',
                  company_email: comp.company_email || '',
                  hr_email: comp.hr_email || '',
                  created_at: comp.created_at || new Date().toISOString()
                })
                setFormData({
                  company_name: comp.company_name || '',
                  company_email: comp.company_email || '',
                  hr_email: comp.hr_email || '',
                })
              }
            }
          }
        } catch (apiError) {
          console.error('Error loading company from API:', apiError)
        }
        return
      }

      if (data) {
        setCompany({
          id: data.company_id || data.id,
          company_name: data.company_name || '',
          company_email: data.company_email || '',
          hr_email: data.hr_email || '',
          created_at: data.created_at || new Date().toISOString()
        })
        setFormData({
          company_name: data.company_name || '',
          company_email: data.company_email || '',
          hr_email: data.hr_email || '',
        })
      }
    } catch (error) {
      console.error('Error loading company data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

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
      const { error } = await supabase
        .from('companies')
        .update({
          company_name: formData.company_name,
          company_email: formData.company_email,
          hr_email: formData.hr_email,
        })
        .eq('company_id', company.id)

      if (error) {
        throw error
      }

      setSaveMessage({ type: 'success', text: 'Company settings updated successfully!' })
      await loadCompanyData()
      
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
      // First, verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: passwordData.currentPassword,
      })

      if (signInError) {
        throw new Error('Current password is incorrect')
      }

      // Update password
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
      // Delete all user data from companies table (cascade will handle related data)
      if (company) {
        const { error: deleteCompanyError } = await supabase
          .from('companies')
          .delete()
          .eq('id', company.id)

        if (deleteCompanyError) {
          console.error('Error deleting company:', deleteCompanyError)
        }
      }

      // Delete the user account
      // Note: This requires admin privileges or a server-side function
      // For now, we'll sign out and redirect - actual deletion should be done via API
      await signOut()
      
      // Redirect to home page
      router.push('/')
      
      // Show success message (though user won't see it after redirect)
      setSaveMessage({ type: 'success', text: 'Account deletion initiated. Please contact support for complete account removal.' })
      
    } catch (error: any) {
      console.error('Error deleting account:', error)
      setSaveMessage({ type: 'error', text: error.message || 'Failed to delete account. Please contact support.' })
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-2xl md:text-3xl font-figtree font-extralight mb-2 text-[#2D2DDD] dark:text-white">
          Profile & Settings
        </h1>
        <p className="text-base md:text-lg font-figtree font-light text-gray-600 dark:text-gray-400">
          Manage your profile, account settings, and preferences
        </p>
      </motion.div>

      {/* Success/Error Messages */}
      {saveMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 p-4 rounded-lg ${
            saveMessage.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}
        >
          {saveMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <p className="text-sm font-figtree font-medium">{saveMessage.text}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
              <User className="w-5 h-5 text-[#2D2DDD]" />
              Profile Information
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Your personal account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#2D2DDD] to-[#2D2DDD]/80 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-figtree font-semibold text-gray-900 dark:text-white">
                  {user?.email?.split('@')[0] || 'User'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-figtree font-light">
                  {user?.email || 'No email'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="pl-10 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="userId" className="text-gray-700 dark:text-gray-300">User ID</Label>
              <Input
                id="userId"
                type="text"
                value={user?.id || ''}
                disabled
                className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-mono text-xs"
              />
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>
                  Account created: {user?.created_at 
                    ? new Date(user.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) 
                    : 'Loading...'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Shield className="w-4 h-4" />
                <span>
                  Account status: <span className="text-green-600 dark:text-green-400 font-medium">Active</span>
                </span>
              </div>
              {user?.role && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Key className="w-4 h-4" />
                  <span>Role: <span className="font-medium capitalize">{user.role}</span></span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Company Information */}
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
              <Building2 className="w-5 h-5 text-[#2D2DDD]" />
              Company Information
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Update your company details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#2D2DDD]" />
              </div>
            ) : company ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="company_name" className="text-gray-700 dark:text-gray-300">Company Name</Label>
                  <Input
                    id="company_name"
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Enter company name"
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_email" className="text-gray-700 dark:text-gray-300">Company Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="company_email"
                      type="email"
                      value={formData.company_email}
                      onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                      placeholder="company@example.com"
                      className="pl-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hr_email" className="text-gray-700 dark:text-gray-300">HR Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="hr_email"
                      type="email"
                      value={formData.hr_email}
                      onChange={(e) => setFormData({ ...formData, hr_email: e.target.value })}
                      placeholder="hr@example.com"
                      className="pl-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSaveCompany}
                  disabled={isSaving}
                  className="w-full bg-[#2D2DDD] hover:bg-[#2D2DDD]/90 text-white"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Company Changes'
                  )}
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 font-figtree font-light">
                  No company information found. Please complete company setup first.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Security Settings */}
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
            <Lock className="w-5 h-5 text-[#2D2DDD]" />
            Security Settings
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Manage your password and security preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showPasswordForm ? (
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-figtree font-extralight text-gray-900 dark:text-white mb-1">Password</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-figtree font-light">
                  Last changed: {user?.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'Never'}
                </p>
              </div>
              <Button
                onClick={() => setShowPasswordForm(true)}
                variant="outline"
                className="border-[#2D2DDD] text-[#2D2DDD] hover:bg-[#2D2DDD] hover:text-white"
              >
                <Key className="w-4 h-4 mr-2" />
                Change Password
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-gray-700 dark:text-gray-300">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white pr-10"
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
                <Label htmlFor="newPassword" className="text-gray-700 dark:text-gray-300">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Enter new password (min. 6 characters)"
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white pr-10"
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
                <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white pr-10"
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

              <div className="flex gap-3">
                <Button
                  onClick={handleChangePassword}
                  disabled={isSaving}
                  className="flex-1 bg-[#2D2DDD] hover:bg-[#2D2DDD]/90 text-white"
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

      {/* Webhook Integration removed */}

      {/* Danger Zone */}
      <Card className="bg-white dark:bg-gray-900 border-2 border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h4 className="text-lg font-figtree font-extralight text-red-900 dark:text-red-300 mb-2">Delete Account</h4>
            <p className="text-sm text-red-700 dark:text-red-400 font-figtree font-light mb-4">
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
                  <Label htmlFor="deleteConfirm" className="text-red-900 dark:text-red-300">
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
