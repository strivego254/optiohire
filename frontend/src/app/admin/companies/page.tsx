'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2, Search, ArrowLeft, Trash2, Eye } from 'lucide-react'

interface Company {
  company_id: string
  company_name: string
  company_email: string
  hr_email: string
  hiring_manager_email: string
  company_domain: string
  created_at: string
}

export default function AdminCompaniesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

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
    loadCompanies()
  }, [page, search, user, router])

  const loadCompanies = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search })
      })

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/companies?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status === 401 || response.status === 403) {
        router.push('/auth/signin')
        return
      }

      const data = await response.json()
      setCompanies(data.companies || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error('Error loading companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteCompany = async (companyId: string) => {
    if (!confirm('Are you sure you want to delete this company? This will delete all associated jobs and applications.')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/companies/${companyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        loadCompanies()
      }
    } catch (error) {
      console.error('Error deleting company:', error)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Manage Companies</h1>
            <p className="text-gray-400">View and manage all companies</p>
          </div>
        </div>

        <Card className="bg-neutral-900 border-neutral-800 mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search companies..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="pl-10 bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader>
                <CardTitle>Companies ({total})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {companies.map((company) => (
                    <div
                      key={company.company_id}
                      className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg hover:bg-neutral-750"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Building2 className="h-5 w-5 text-blue-400" />
                          <span className="font-semibold text-lg">{company.company_name}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                          <div>
                            <span className="text-gray-500">Domain:</span> {company.company_domain}
                          </div>
                          <div>
                            <span className="text-gray-500">Email:</span> {company.company_email || 'N/A'}
                          </div>
                          <div>
                            <span className="text-gray-500">HR Email:</span> {company.hr_email}
                          </div>
                          <div>
                            <span className="text-gray-500">Created:</span> {new Date(company.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/admin/companies/${company.company_id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteCompany(company.company_id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {companies.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    No companies found
                  </div>
                )}

                {total > 20 && (
                  <div className="flex justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-4 text-gray-400">
                      Page {page} of {Math.ceil(total / 20)}
                    </span>
                    <Button
                      variant="outline"
                      disabled={page >= Math.ceil(total / 20)}
                      onClick={() => setPage(p => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

