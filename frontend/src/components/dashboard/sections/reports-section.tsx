'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Loader2, UserCheck, UserPlus, UserX, AlertTriangle, FileText, ExternalLink } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { JobPosting } from '@/types'
import { ApplicantReportModal } from '../applicant-report-modal'

interface JobReportItem {
  job: JobPosting
  totals: {
    total: number
    shortlisted: number
    flagged: number
    rejected: number
  }
  processingStatus?: 'processing' | 'in_progress' | 'finished'
  aiAnalysis?: string | null
}

export function ReportsSection() {
  const { user } = useAuth()
  const [items, setItems] = useState<JobReportItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedJobPosting, setSelectedJobPosting] = useState<JobPosting | null>(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  useEffect(() => {
    const loadReports = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }
      
      try {
        setIsLoading(true)
        setError(null)
        
        const token = localStorage.getItem('token')
        if (!token) {
          setIsLoading(false)
          return
        }

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
        const response = await fetch(`${backendUrl}/api/job-postings`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          setItems([])
          setIsLoading(false)
          return
        }

        const data = await response.json()
        const jobs = data.jobs || []
        
        const reportItems: JobReportItem[] = jobs.map((job: any) => ({
          job: {
            id: job.job_posting_id || job.id,
            job_title: job.job_title,
            status: job.status || 'active',
            created_at: job.created_at
          },
          totals: {
            total: job.applicant_count || 0,
            shortlisted: job.shortlisted_count || 0,
            flagged: job.flagged_count || 0,
            rejected: job.rejected_count || 0
          }
        }))
        
        setItems(reportItems)
      } catch (err) {
        console.error('Error loading reports:', err)
        setError('Failed to load reports')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadReports()
  }, [user])

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-2 text-gray-900 dark:text-white">Reports & Analytics</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Comprehensive reports and insights for your job postings</p>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
        >
          {error}
        </motion.div>
      )}

      {isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="animate-spin-smooth rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading jobs...</p>
          </div>
        </motion.div>
      )}

      {!isLoading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-figtree font-semibold flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#2D2DDD]" />
                Job Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground font-figtree font-light">No job posts yet.</div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <motion.div key={item.job.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.05 }}>
                      <Card className="hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold font-figtree truncate">{item.job.job_title}</h3>
                                {item.processingStatus && (
                                  <Badge variant={item.processingStatus === 'finished' ? 'success' : 'warning'}>
                                    {item.processingStatus}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-6 text-sm text-muted-foreground font-figtree font-light mb-3">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(item.job.created_at).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                  <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                      <UserPlus className="w-4 h-4 text-blue-600" />
                                      <span className="text-xs font-medium text-gray-600">Total</span>
                                    </div>
                                    <p className="text-lg font-bold text-blue-600">{item.totals.total}</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                      <UserCheck className="w-4 h-4 text-green-600" />
                                      <span className="text-xs font-medium text-gray-600">Shortlisted</span>
                                    </div>
                                    <p className="text-lg font-bold text-green-600">{item.totals.shortlisted}</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                      <span className="text-xs font-medium text-gray-600">Flagged</span>
                                    </div>
                                    <p className="text-lg font-bold text-yellow-600">{item.totals.flagged}</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                      <UserX className="w-4 h-4 text-red-600" />
                                      <span className="text-xs font-medium text-gray-600">Rejected</span>
                                    </div>
                                    <p className="text-lg font-bold text-red-600">{item.totals.rejected}</p>
                                  </div>
                                </div>
                              </div>
                              {item.aiAnalysis && (
                                <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                                  <strong>AI Analysis:</strong> {item.aiAnalysis.substring(0, 140)}...
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0 mt-4 sm:mt-0">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-2 bg-[#2D2DDD] text-white border-[#2D2DDD] hover:bg-[#2D2DDD]/90 hover:border-[#2D2DDD]/90 dark:bg-[#2D2DDD] dark:text-white dark:border-[#2D2DDD] dark:hover:bg-[#2D2DDD]/90 w-full sm:w-auto"
                                onClick={() => {
                                  setSelectedJobPosting(item.job)
                                  setIsReportModalOpen(true)
                                }}
                              >
                                <ExternalLink className="w-4 h-4" />
                                View Report
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Applicant Report Modal */}
      <ApplicantReportModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false)
          setSelectedJobPosting(null)
        }}
        jobPosting={selectedJobPosting}
      />
    </div>
  )
}
