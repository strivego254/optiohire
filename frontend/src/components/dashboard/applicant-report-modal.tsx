'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Applicant, JobPosting } from '@/types'
import { cleanCandidateName } from '@/lib/utils'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ApplicantReportModalProps {
  isOpen: boolean
  onClose: () => void
  jobPosting: JobPosting | null
}

export function ApplicantReportModal({ isOpen, onClose, jobPosting }: ApplicantReportModalProps) {
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const loadApplicants = useCallback(async () => {
    if (!jobPosting) return
    
    setIsLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const resp = await fetch(`/api/hr/candidates?jobId=${jobPosting.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}))
        throw new Error(errorData?.error || 'Failed to load applicants')
      }

      const candidates = await resp.json()
      
      // Map candidates to applicants format
      const mappedApplicants = candidates.map((candidate: any) => ({
        id: candidate.id,
        name: cleanCandidateName(candidate.candidate_name),
        email: candidate.email,
        matching_score: candidate.score,
        ai_reasoning: candidate.reasoning || null,
        status: candidate.status || 'PENDING'
      }))
      
      setApplicants(mappedApplicants)
    } catch (err: any) {
      console.error('Error loading applicants:', err)
      setError(err.message || 'Failed to load applicants')
    } finally {
      setIsLoading(false)
    }
  }, [jobPosting])

  useEffect(() => {
    if (isOpen && jobPosting) {
      loadApplicants()
    } else {
      setApplicants([])
      setError(null)
    }
  }, [isOpen, jobPosting, loadApplicants])

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'shortlisted':
      case 'shortlist':
        return 'shortlisted'
      case 'flagged':
      case 'flag':
        return 'flagged'
      case 'rejected':
      case 'reject':
        return 'rejected'
      default:
        return 'outline'
    }
  }

  const downloadPDF = async () => {
    if (!jobPosting || applicants.length === 0) return

    setIsDownloading(true)

    try {
      const doc = new jsPDF()
      
      // Add title
      doc.setFontSize(18)
      doc.setTextColor(45, 45, 221) // #2D2DDD
      doc.text('Applicant Report', 14, 20)
      
      // Add job title
      doc.setFontSize(14)
      doc.setTextColor(0, 0, 0)
      doc.text(`Job: ${jobPosting.job_title}`, 14, 30)
      
      // Add date
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 36)
      
      // Prepare table data
      const tableData = applicants.map(applicant => [
        applicant.name || 'N/A',
        applicant.email || 'N/A',
        applicant.matching_score !== null ? `${applicant.matching_score}%` : 'N/A',
        applicant.ai_reasoning || 'N/A',
        applicant.status.toUpperCase()
      ])

      // Add table
      autoTable(doc, {
        head: [['APPLICANT NAME', 'APPLICANT EMAIL', 'MATCH SCORE', 'REASONING', 'STATUS']],
        body: tableData,
        startY: 42,
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [45, 45, 221], // #2D2DDD
          textColor: 255,
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 50 },
          2: { cellWidth: 25 },
          3: { cellWidth: 60 },
          4: { cellWidth: 25 },
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: 42 },
      })

      // Save PDF
      const fileName = `Applicant_Report_${jobPosting.job_title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)
    } catch (err: any) {
      console.error('Error generating PDF:', err)
      setError('Failed to generate PDF')
    } finally {
      setIsDownloading(false)
    }
  }

  if (!jobPosting) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden"
          >
            <Card className="bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800">
              <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl font-figtree font-extralight text-[#2D2DDD] dark:text-white mb-1">
                      Applicant Report
                    </CardTitle>
                    <p className="text-sm font-figtree font-light text-gray-600 dark:text-gray-400 truncate">
                      {jobPosting.job_title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      onClick={downloadPDF}
                      disabled={isDownloading || applicants.length === 0}
                      className="bg-[#2D2DDD] hover:bg-[#2D2DDD] text-white shadow-none hover:shadow-none"
                      size="sm"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-[#2D2DDD] mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400 font-figtree font-light">
                        Loading applicants...
                      </p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="p-6 text-center">
                    <p className="text-red-600 dark:text-red-400 font-figtree font-medium">{error}</p>
                    <Button
                      onClick={loadApplicants}
                      variant="outline"
                      className="mt-4 bg-white text-[#2D2DDD] border-[#2D2DDD] hover:bg-[#2D2DDD] hover:text-white shadow-none hover:shadow-none"
                      size="sm"
                    >
                      Retry
                    </Button>
                  </div>
                ) : applicants.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-gray-600 dark:text-gray-400 font-figtree font-light">
                      No applicants found for this job posting.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[calc(90vh-200px)]">
                    <table className="w-full border-collapse min-w-[800px]">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                          <th className="px-4 py-3 text-left text-xs font-semibold font-figtree text-gray-900 dark:text-white uppercase tracking-wider">
                            APPLICANT NAME
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold font-figtree text-gray-900 dark:text-white uppercase tracking-wider">
                            APPLICANT EMAIL
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold font-figtree text-gray-900 dark:text-white uppercase tracking-wider">
                            MATCH SCORE
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold font-figtree text-gray-900 dark:text-white uppercase tracking-wider">
                            REASONING
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold font-figtree text-gray-900 dark:text-white uppercase tracking-wider">
                            STATUS
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {applicants.map((applicant, index) => (
                          <motion.tr
                            key={applicant.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          >
                            <td className="px-4 py-3 text-sm font-figtree font-medium text-gray-900 dark:text-white">
                              {applicant.name || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm font-figtree font-light text-gray-700 dark:text-gray-300">
                              {applicant.email}
                            </td>
                            <td className="px-4 py-3 text-sm font-figtree font-medium">
                              {applicant.matching_score !== null ? (
                                <span className={`${
                                  applicant.matching_score >= 80 ? 'text-green-600 dark:text-green-400' :
                                  applicant.matching_score >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                                  'text-red-600 dark:text-red-400'
                                }`}>
                                  {applicant.matching_score}%
                                </span>
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm font-figtree font-light text-gray-700 dark:text-gray-300 max-w-md">
                              <div className="truncate" title={applicant.ai_reasoning || 'N/A'}>
                                {applicant.ai_reasoning || 'N/A'}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <Badge
                                variant={getStatusBadgeVariant(applicant.status) as any}
                                className="font-figtree font-medium"
                              >
                                {applicant.status.toUpperCase()}
                              </Badge>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

