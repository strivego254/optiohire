'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  Loader2,
  UserCheck,
  UserPlus,
  UserX,
  AlertTriangle,
  FileText,
  ExternalLink,
} from 'lucide-react'
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

type TimeRange = '7d' | '30d' | 'all'

// Custom tick component for multi-line X-axis labels
const CustomXAxisTick = ({ x, y, payload, isDark }: any) => {
  const wrapText = (text: string, maxLength: number): string[] => {
    // Remove "Application for" prefix if present
    let cleaned = text.replace(/^Application\s+for\s+/i, '')
    
    // If text is short enough, return as single line
    if (cleaned.length <= maxLength) {
      return [cleaned]
    }
    
    // Try to split at common words
    const words = cleaned.split(/\s+/)
    if (words.length <= 2) {
      // If only 2 words, split in the middle
      const mid = Math.ceil(cleaned.length / 2)
      const spaceIndex = cleaned.indexOf(' ', mid)
      if (spaceIndex > 0) {
        return [
          cleaned.substring(0, spaceIndex),
          cleaned.substring(spaceIndex + 1)
        ]
      }
      return [cleaned]
    }
    
    // Find the best split point
    let firstLine = ''
    let secondLine = ''
    let currentLength = 0
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      const testLength = currentLength + (currentLength > 0 ? 1 : 0) + word.length
      
      if (testLength <= maxLength && i < words.length - 1) {
        firstLine += (firstLine ? ' ' : '') + word
        currentLength = testLength
      } else {
        secondLine = words.slice(i).join(' ')
        break
      }
    }
    
    return secondLine ? [firstLine, secondLine] : [firstLine || cleaned]
  }
  
  // Responsive max length based on screen size
  let maxLength = 20
  if (typeof window !== 'undefined') {
    const width = window.innerWidth
    if (width < 640) {
      maxLength = 15 // Mobile
    } else if (width < 1024) {
      maxLength = 20 // Tablet
    } else {
      maxLength = 25 // Desktop
    }
  }
  
  const lines = wrapText(payload.value, maxLength)
  const lineHeight = 12
  
  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, index) => (
        <text
          key={index}
          x={0}
          y={index * lineHeight + 3}
          textAnchor="middle"
          fill={isDark ? '#E5E7EB' : '#374151'}
          fontSize={11}
        >
          {line}
        </text>
      ))}
    </g>
  )
}

export function ReportsSection() {
  const { user } = useAuth()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [items, setItems] = useState<JobReportItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedJobPosting, setSelectedJobPosting] = useState<JobPosting | null>(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

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

        const response = await fetch('/api/job-postings', {
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

  const filteredItems = useMemo(() => {
    if (timeRange === 'all') {
      return items
    }

    const now = new Date()
    const days = timeRange === '7d' ? 7 : 30
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    return items.filter((item) => {
      const createdAt = item.job.created_at ? new Date(item.job.created_at) : null
      if (!createdAt || Number.isNaN(createdAt.getTime())) {
        return false
      }
      return createdAt >= cutoff
    })
  }, [items, timeRange])

  const chartData = useMemo(
    () =>
      filteredItems.map((item) => {
        const shortlisted = Math.max(0, item.totals.shortlisted || 0)
        const flagged = Math.max(0, item.totals.flagged || 0)
        const rejected = Math.max(0, item.totals.rejected || 0)
        const total = item.totals.total
        
        // Determine which segments exist for this bar
        const hasShortlisted = shortlisted > 0
        const hasFlagged = flagged > 0
        const hasRejected = rejected > 0
        const segmentCount = [hasShortlisted, hasFlagged, hasRejected].filter(Boolean).length
        
        return {
          jobTitle: item.job.job_title,
          total,
          shortlisted,
          flagged,
          rejected,
          hireRate:
            total > 0
              ? Number(((shortlisted / total) * 100).toFixed(1))
              : 0,
          // Add metadata to help with radius calculation
          _hasShortlisted: hasShortlisted,
          _hasFlagged: hasFlagged,
          _hasRejected: hasRejected,
          _segmentCount: segmentCount,
        }
      }),
    [filteredItems],
  )

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
        <>
          {/* Job performance chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
          >
            <Card className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 border border-gray-200 dark:border-[#2D2DDD]/30 shadow-xl">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg sm:text-xl font-figtree font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[#2D2DDD]" />
                    Job Performance Overview
                  </CardTitle>
                  <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-slate-300">
                    Horizontal stacked comparison of shortlisted, flagged, and rejected applicants per job.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-slate-900/60 border border-gray-300 dark:border-slate-700/70 p-1 shadow-sm dark:shadow-[0_0_0_1px_rgba(15,23,42,0.9)]">
                  {[
                    { id: '7d', label: 'Last 7 days' },
                    { id: '30d', label: 'Last 30 days' },
                    { id: 'all', label: 'All time' },
                  ].map((range) => (
                    <button
                      key={range.id}
                      type="button"
                      onClick={() => setTimeRange(range.id as TimeRange)}
                      className={`px-3 py-1.5 text-xs sm:text-sm rounded-full transition-all ${
                        timeRange === range.id
                          ? 'bg-[#2D2DDD] text-white shadow-[0_0_18px_rgba(45,45,221,0.65)]'
                          : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="h-[280px] sm:h-[320px] lg:h-[450px]">
                {chartData.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-gray-600 dark:text-slate-300 font-figtree">
                      No job posts in the selected time range.
                    </p>
                  </div>
                ) : (
                  <div className="h-full w-full rounded-xl bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800/80 p-3 sm:p-4 shadow-inner">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={chartData}
                        margin={{ top: 8, right: 40, bottom: 40, left: 16 }}
                        categoryGap={isDesktop ? '5%' : '20%'}
                        barCategoryGap="10%"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" vertical={false} />
                        <YAxis
                          yAxisId="left"
                          tick={{ fill: isDark ? '#9CA3AF' : '#6B7280', fontSize: 11 }}
                          axisLine={{ stroke: isDark ? '#1F2937' : '#D1D5DB' }}
                          tickLine={{ stroke: isDark ? '#1F2937' : '#D1D5DB' }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fill: isDark ? '#E5E7EB' : '#374151', fontSize: 10 }}
                          axisLine={{ stroke: isDark ? '#1F2937' : '#D1D5DB' }}
                          tickLine={{ stroke: isDark ? '#1F2937' : '#D1D5DB' }}
                          tickFormatter={(value) => `${value}%`}
                          domain={[0, 100]}
                        />
                        <XAxis
                          dataKey="jobTitle"
                          interval={0}
                          angle={0}
                          height={80}
                          axisLine={{ stroke: isDark ? '#1F2937' : '#D1D5DB' }}
                          tickLine={{ stroke: isDark ? '#1F2937' : '#D1D5DB' }}
                          tick={<CustomXAxisTick isDark={isDark} />}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#020617',
                            border: '1px solid rgba(148, 163, 184, 0.4)',
                            borderRadius: 12,
                            padding: '10px 12px',
                          }}
                          labelStyle={{ color: '#E5E7EB', fontSize: 12 }}
                          itemStyle={{ fontSize: 11 }}
                          cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                        />
                        <Legend
                          verticalAlign="top"
                          align="right"
                          wrapperStyle={{ paddingBottom: 12, color: '#E5E7EB', fontSize: 11 }}
                        />
                        <Bar
                          yAxisId="left"
                          dataKey="shortlisted"
                          stackId="a"
                          fill="#4CBB17"
                          name="Shortlisted"
                          maxBarSize={isDesktop ? 130 : 60}
                          isAnimationActive={false}
                          animationDuration={0}
                          shape={(props: any) => {
                            // In Recharts, props contains the data point directly or in payload
                            const data = props.payload || props
                            if (!data || !data.shortlisted || data.shortlisted === 0) return null
                            
                            // Shortlisted is always the bottom segment when it exists
                            const segmentCount = data._segmentCount || 
                              ([data.shortlisted > 0, data.flagged > 0, data.rejected > 0].filter(Boolean).length)
                            const isOnly = segmentCount === 1
                            const isBottom = segmentCount > 1
                            
                            const { x, y, width, height } = props
                            if (height === 0 || !height) return null
                            
                            const r = 6
                            
                            // Create path with rounded corners
                            // For bottom segment: round bottom corners only
                            // For single segment: round all corners
                            let path = ''
                            if (isOnly) {
                              // All corners rounded
                              path = `M ${x + r},${y} 
                                      L ${x + width - r},${y} 
                                      Q ${x + width},${y} ${x + width},${y + r}
                                      L ${x + width},${y + height - r}
                                      Q ${x + width},${y + height} ${x + width - r},${y + height}
                                      L ${x + r},${y + height}
                                      Q ${x},${y + height} ${x},${y + height - r}
                                      L ${x},${y + r}
                                      Q ${x},${y} ${x + r},${y} Z`
                            } else if (isBottom) {
                              // Bottom corners rounded only
                              path = `M ${x},${y} 
                                      L ${x + width},${y} 
                                      L ${x + width},${y + height - r}
                                      Q ${x + width},${y + height} ${x + width - r},${y + height}
                                      L ${x + r},${y + height}
                                      Q ${x},${y + height} ${x},${y + height - r}
                                      Z`
                            } else {
                              // No rounding
                              path = `M ${x},${y} L ${x + width},${y} L ${x + width},${y + height} L ${x},${y + height} Z`
                            }
                            
                            return <path d={path} fill={props.fill} />
                          }}
                        />
                        <Bar
                          yAxisId="left"
                          dataKey="flagged"
                          stackId="a"
                          fill="#F4BE0B"
                          name="Flagged"
                          maxBarSize={isDesktop ? 130 : 60}
                          isAnimationActive={false}
                          animationDuration={0}
                          shape={(props: any) => {
                            // In Recharts, props contains the data point directly or in payload
                            const data = props.payload || props
                            if (!data || !data.flagged || data.flagged === 0) return null
                            
                            // Flagged can be: only segment, top segment, or middle segment
                            const segmentCount = data._segmentCount || 
                              ([data.shortlisted > 0, data.flagged > 0, data.rejected > 0].filter(Boolean).length)
                            const hasRejected = data._hasRejected !== undefined ? data._hasRejected : (data.rejected > 0)
                            const isOnly = segmentCount === 1
                            const isTop = segmentCount === 2 && !hasRejected
                            const isMiddle = segmentCount === 3
                            
                            const { x, y, width, height } = props
                            if (height === 0 || !height) return null
                            
                            const r = 6
                            let path = ''
                            
                            if (isOnly) {
                              // All corners rounded
                              path = `M ${x + r},${y} 
                                      L ${x + width - r},${y} 
                                      Q ${x + width},${y} ${x + width},${y + r}
                                      L ${x + width},${y + height - r}
                                      Q ${x + width},${y + height} ${x + width - r},${y + height}
                                      L ${x + r},${y + height}
                                      Q ${x},${y + height} ${x},${y + height - r}
                                      L ${x},${y + r}
                                      Q ${x},${y} ${x + r},${y} Z`
                            } else if (isTop) {
                              // Top corners rounded only
                              path = `M ${x + r},${y} 
                                      Q ${x},${y} ${x},${y + r}
                                      L ${x},${y + height}
                                      L ${x + width},${y + height}
                                      L ${x + width},${y + r}
                                      Q ${x + width},${y} ${x + width - r},${y}
                                      Z`
                            } else {
                              // No rounding (middle segment)
                              path = `M ${x},${y} L ${x + width},${y} L ${x + width},${y + height} L ${x},${y + height} Z`
                            }
                            
                            return <path d={path} fill={props.fill} />
                          }}
                        />
                        <Bar
                          yAxisId="left"
                          dataKey="rejected"
                          stackId="a"
                          fill="#FF0000"
                          name="Rejected"
                          maxBarSize={isDesktop ? 130 : 60}
                          isAnimationActive={false}
                          animationDuration={0}
                          shape={(props: any) => {
                            // In Recharts, props contains the data point directly or in payload
                            const data = props.payload || props
                            if (!data || !data.rejected || data.rejected === 0) return null
                            
                            // Rejected is always the top segment when it exists
                            const segmentCount = data._segmentCount || 
                              ([data.shortlisted > 0, data.flagged > 0, data.rejected > 0].filter(Boolean).length)
                            const isOnly = segmentCount === 1
                            const isTop = segmentCount > 1
                            
                            const { x, y, width, height } = props
                            if (height === 0 || !height) return null
                            
                            const r = 6
                            let path = ''
                            
                            if (isOnly) {
                              // All corners rounded
                              path = `M ${x + r},${y} 
                                      L ${x + width - r},${y} 
                                      Q ${x + width},${y} ${x + width},${y + r}
                                      L ${x + width},${y + height - r}
                                      Q ${x + width},${y + height} ${x + width - r},${y + height}
                                      L ${x + r},${y + height}
                                      Q ${x},${y + height} ${x},${y + height - r}
                                      L ${x},${y + r}
                                      Q ${x},${y} ${x + r},${y} Z`
                            } else if (isTop) {
                              // Top corners rounded only
                              path = `M ${x + r},${y} 
                                      Q ${x},${y} ${x},${y + r}
                                      L ${x},${y + height}
                                      L ${x + width},${y + height}
                                      L ${x + width},${y + r}
                                      Q ${x + width},${y} ${x + width - r},${y}
                                      Z`
                            } else {
                              // No rounding (shouldn't happen for rejected)
                              path = `M ${x},${y} L ${x + width},${y} L ${x + width},${y + height} L ${x},${y + height} Z`
                            }
                            
                            return <path d={path} fill={props.fill} />
                          }}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="hireRate"
                          stroke="#2D2DDD"
                          strokeWidth={2}
                          dot={{ r: 3, stroke: '#E5E7EB', strokeWidth: 1, fill: '#2D2DDD' }}
                          activeDot={{ r: 5 }}
                          name="Hire rate (%)"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Job report cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
          >
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-figtree font-semibold flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#2D2DDD]" />
                Job Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground font-figtree font-light">
                    No job posts yet.
                  </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => (
                      <motion.div
                        key={item.job.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                      >
                      <Card className="hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-semibold font-figtree truncate">
                                    {item.job.job_title}
                                  </h3>
                                {item.processingStatus && (
                                    <Badge
                                      variant={
                                        item.processingStatus === 'finished' ? 'success' : 'warning'
                                      }
                                    >
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
                                        <span className="text-xs font-medium text-gray-600 dark:text-white">
                                          Total
                                        </span>
                                    </div>
                                      <p className="text-lg font-bold text-blue-600">
                                        {item.totals.total}
                                      </p>
                                  </div>
                                  <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                      <UserCheck className="w-4 h-4 text-green-600" />
                                        <span className="text-xs font-medium text-gray-600 dark:text-white">
                                          Shortlisted
                                        </span>
                                    </div>
                                      <p className="text-lg font-bold text-green-600">
                                        {item.totals.shortlisted}
                                      </p>
                                  </div>
                                  <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                        <span className="text-xs font-medium text-gray-600 dark:text-white">
                                          Flagged
                                        </span>
                                    </div>
                                      <p className="text-lg font-bold text-yellow-600">
                                        {item.totals.flagged}
                                      </p>
                                  </div>
                                  <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                      <UserX className="w-4 h-4 text-red-600" />
                                        <span className="text-xs font-medium text-gray-600 dark:text-white">
                                          Rejected
                                        </span>
                                    </div>
                                      <p className="text-lg font-bold text-red-600">
                                        {item.totals.rejected}
                                      </p>
                                  </div>
                                </div>
                              </div>
                              {item.aiAnalysis && (
                                <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                                    <strong>AI Analysis:</strong>{' '}
                                    {item.aiAnalysis.substring(0, 140)}...
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0 mt-4 sm:mt-0">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                  className="gap-2 bg-[#2D2DDD] text-white border-[#2D2DDD] hover:bg-[#2D2DDD] hover:border-[#2D2DDD] dark:bg-[#2D2DDD] dark:text-white dark:border-[#2D2DDD] dark:hover:bg-[#2D2DDD] w-full sm:w-auto shadow-none hover:shadow-none"
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
        </>
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
