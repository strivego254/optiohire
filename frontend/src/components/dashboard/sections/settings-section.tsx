'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { 
  Settings, 
  User, 
  Building2, 
  Mail, 
  Phone, 
  MapPin,
  CheckCircle,
  Loader2,
  AlertCircle,
  Bell,
  FileText,
  Calendar,
  BarChart3,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
// import { WebhookTest } from '../webhook-test' // Removed - file not found
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface CompanyData {
  id: string
  company_name: string
  company_email: string
  hr_email: string
  created_at: string
}

interface UserPreferences {
  email_notifications: boolean
  report_notifications: boolean
  application_notifications: boolean
  interview_reminders: boolean
  weekly_summary: boolean
  auto_generate_reports: boolean
  notification_frequency: 'realtime' | 'hourly' | 'daily' | 'weekly'
}

export function SettingsSection() {
  const { user } = useAuth()
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences>({
    email_notifications: true,
    report_notifications: true,
    application_notifications: true,
    interview_reminders: true,
    weekly_summary: true,
    auto_generate_reports: true,
    notification_frequency: 'realtime'
  })
  const [formData, setFormData] = useState({
    company_name: '',
    company_email: '',
    hr_email: '',
  })

  const loadCompanyData = useCallback(async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('companies')
        .select('id, company_name, company_email, hr_email, created_at')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error loading company:', error)
        return
      }

      if (data) {
        setCompany(data)
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

  const loadUserPreferences = useCallback(async () => {
    if (!user || !user.id) return

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.warn('No token found for loading preferences')
        return
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
      const resp = await fetch(`${backendUrl}/api/user/preferences`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (resp.ok) {
        const data = await resp.json()
        if (data) {
          setPreferences({
            email_notifications: data.email_notifications ?? true,
            report_notifications: data.report_notifications ?? true,
            application_notifications: data.application_notifications ?? true,
            interview_reminders: data.interview_reminders ?? true,
            weekly_summary: data.weekly_summary ?? true,
            auto_generate_reports: data.auto_generate_reports ?? true,
            notification_frequency: data.notification_frequency || 'realtime'
          })
        }
      } else if (resp.status === 401) {
        console.warn('Unauthorized - token may be invalid')
      } else {
        console.warn('Failed to load preferences:', resp.status)
      }
    } catch (error) {
      console.error('Error loading user preferences:', error)
      // Don't show error to user, just use defaults
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadCompanyData()
      loadUserPreferences()
    } else {
      setIsLoading(false)
    }
  }, [user, loadCompanyData, loadUserPreferences])

  const handleSave = async () => {
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
        .eq('id', company.id)

      if (error) {
        throw error
      }

      setSaveMessage({ type: 'success', text: 'Company settings updated successfully!' })
      await loadCompanyData()
      
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error: any) {
      console.error('Error saving company settings:', error)
      setSaveMessage({ type: 'error', text: error.message || 'Failed to update company settings' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    if (!user || !user.id) {
      setSaveMessage({ type: 'error', text: 'You must be logged in to save preferences' })
      return
    }

    setIsSavingPreferences(true)
    setSaveMessage(null)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Not authenticated. Please sign in again.')
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
      const resp = await fetch(`${backendUrl}/api/user/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      })

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}))
        if (resp.status === 401) {
          throw new Error('Session expired. Please sign in again.')
        }
        throw new Error(data.error || data.message || 'Failed to update preferences')
      }

      const result = await resp.json()
      setSaveMessage({ 
        type: 'success', 
        text: result.message || 'Notification preferences updated successfully!' 
      })
      setTimeout(() => setSaveMessage(null), 5000)
    } catch (error: any) {
      console.error('Error saving preferences:', error)
      setSaveMessage({ 
        type: 'error', 
        text: error.message || 'Failed to update preferences. Please try again.' 
      })
      setTimeout(() => setSaveMessage(null), 5000)
    } finally {
      setIsSavingPreferences(false)
    }
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'tween', duration: 0.4, ease: 'easeOut' }}
        className="gpu-accelerated"
      >
        <h1 className="text-2xl md:text-3xl font-figtree font-extralight mb-2 text-[#2D2DDD] dark:text-white">
          Settings
        </h1>
        <p className="text-base md:text-lg font-figtree font-light text-gray-600 dark:text-gray-400">
          Manage your account and company preferences
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Information */}
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
              <User className="w-5 h-5 text-[#2D2DDD]" />
              Account Information
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Your account details and login information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Account created: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </p>
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
                {saveMessage && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg ${
                    saveMessage.type === 'success' 
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                      : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                  }`}>
                    {saveMessage.type === 'success' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <p className="text-sm">{saveMessage.text}</p>
                  </div>
                )}
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full bg-[#2D2DDD] hover:bg-[#2D2DDD] text-white shadow-none hover:shadow-none"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
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

      {/* Notification Preferences */}
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
            <Bell className="w-5 h-5 text-[#2D2DDD]" />
            Notification Preferences
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Control how and when you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-500" />
                <div>
                  <Label className="text-gray-900 dark:text-white font-medium">Email Notifications</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receive email notifications for important events</p>
                </div>
              </div>
              <Switch
                checked={preferences.email_notifications}
                onCheckedChange={(checked) => setPreferences({ ...preferences, email_notifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-500" />
                <div>
                  <Label className="text-gray-900 dark:text-white font-medium">Report Notifications</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Get notified when reports are generated</p>
                </div>
              </div>
              <Switch
                checked={preferences.report_notifications}
                onCheckedChange={(checked) => setPreferences({ ...preferences, report_notifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-500" />
                <div>
                  <Label className="text-gray-900 dark:text-white font-medium">Application Notifications</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Notify when new applications are received</p>
                </div>
              </div>
              <Switch
                checked={preferences.application_notifications}
                onCheckedChange={(checked) => setPreferences({ ...preferences, application_notifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <Label className="text-gray-900 dark:text-white font-medium">Interview Reminders</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receive reminders for scheduled interviews</p>
                </div>
              </div>
              <Switch
                checked={preferences.interview_reminders}
                onCheckedChange={(checked) => setPreferences({ ...preferences, interview_reminders: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-4 h-4 text-gray-500" />
                <div>
                  <Label className="text-gray-900 dark:text-white font-medium">Weekly Summary</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receive weekly summary of activities</p>
                </div>
              </div>
              <Switch
                checked={preferences.weekly_summary}
                onCheckedChange={(checked) => setPreferences({ ...preferences, weekly_summary: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4 text-gray-500" />
                <div>
                  <Label className="text-gray-900 dark:text-white font-medium">Auto-Generate Reports</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Automatically generate reports after deadlines</p>
                </div>
              </div>
              <Switch
                checked={preferences.auto_generate_reports}
                onCheckedChange={(checked) => setPreferences({ ...preferences, auto_generate_reports: checked })}
              />
            </div>

            <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Label className="text-gray-900 dark:text-white font-medium">Notification Frequency</Label>
              <Select
                value={preferences.notification_frequency}
                onValueChange={(value: 'realtime' | 'hourly' | 'daily' | 'weekly') => 
                  setPreferences({ ...preferences, notification_frequency: value })
                }
              >
                <SelectTrigger className="bg-white dark:bg-gray-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                How often to receive batched notifications
              </p>
            </div>
          </div>

          <Button
            onClick={handleSavePreferences}
            disabled={isSavingPreferences}
            className="w-full bg-[#2D2DDD] hover:bg-[#2D2DDD] text-white shadow-none hover:shadow-none"
          >
            {isSavingPreferences ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Notification Preferences'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Webhook Configuration */}
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
            <Settings className="w-5 h-5 text-[#2D2DDD]" />
            Webhook Integration
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Test and configure your N8N webhook connection
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* <WebhookTest /> */}
        </CardContent>
      </Card>
    </div>
  )
}