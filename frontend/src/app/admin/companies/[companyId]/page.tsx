'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Building2, Briefcase, FileText } from 'lucide-react'

interface CompanyDetails {
  company: {
    company_id: string
    company_name: string
    company_email: string
    hr_email: string
    hiring_manager_email: string
    company_domain: string
    settings: any
    created_at: string
  }
  stats: {
    job_postings: number
    applications: number
  }
}

export default function CompanyDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const companyId = params.companyId as string
  const [data, setData] = useState<CompanyDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // STRICT: Only admin can access
    if (user && user.role !== 'admin') {
      router.push('/admin') // Redirect to admin dashboard, not HR dashboard
      return
    }
    if (!user) {
      router.push('/auth/signin')
      return
    }
    if (companyId) {
      loadCompanyDetails()
    }
  }, [companyId, user, router])

  const loadCompanyDetails = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/companies/${companyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status === 401 || response.status === 403) {
        router.push('/auth/signin')
        return
      }

      const data = await response.json()
      setData(data)
    } catch (error) {
      console.error('Error loading company details:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="p-6">
            <p className="text-white">Company not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/companies')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{data.company.company_name}</h1>
            <p className="text-gray-400">Company Details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-600/10 border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Job Postings</CardTitle>
              <Briefcase className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{data.stats.job_postings}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-900/20 to-orange-600/10 border-orange-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Applications</CardTitle>
              <FileText className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{data.stats.applications}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Company Name</label>
              <p className="text-white font-medium">{data.company.company_name}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Domain</label>
              <p className="text-white">{data.company.company_domain}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Company Email</label>
              <p className="text-white">{data.company.company_email || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">HR Email</label>
              <p className="text-white">{data.company.hr_email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Hiring Manager Email</label>
              <p className="text-white">{data.company.hiring_manager_email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Created</label>
              <p className="text-white">{new Date(data.company.created_at).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

