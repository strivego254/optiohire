'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Activity, 
  Zap, 
  Database, 
  Globe, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3
} from 'lucide-react'
import { PerformanceMonitor } from '@/lib/performance-monitor'

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const loadMetrics = async () => {
    try {
      setIsLoading(true)
      const performanceData = PerformanceMonitor.getPerformanceSummary()
      const healthStatus = PerformanceMonitor.getHealthStatus()
      const webhookQueueStatus = { queueLength: 0, highPriority: 0, normalPriority: 0 }
      
      setMetrics({
        ...performanceData,
        health: healthStatus,
        webhookQueue: webhookQueueStatus
      })
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to load performance metrics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMetrics()
    
    // Refresh metrics every 30 seconds
    const interval = setInterval(loadMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading || !metrics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="animate-spin-smooth rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading performance metrics...</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />
      case 'warning': return <AlertTriangle className="w-4 h-4" />
      case 'error': return <AlertTriangle className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-figtree font-extralight mb-2 text-[#2D2DDD] dark:text-white">
              Performance Dashboard
            </h1>
            <p className="text-base md:text-lg font-figtree font-light text-gray-600 dark:text-gray-400">
              Real-time system performance metrics
            </p>
            <p className="text-sm text-muted-foreground font-figtree font-light">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <Button onClick={loadMetrics} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* System Health Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <Card className="bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl font-figtree font-semibold flex items-center gap-3">
              <Activity className="w-5 h-5 text-primary" />
              System Health Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 ${getStatusColor(metrics.health.status)}`}>
                  {getStatusIcon(metrics.health.status)}
                  <span className="font-semibold capitalize">{metrics.health.status}</span>
                </div>
                <Badge variant={metrics.health.status === 'healthy' ? 'success' : 'warning'}>
                  {metrics.health.issues.length} issues
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  Avg Response Time: {metrics.health.summary.avgResponseTime5min.toFixed(2)}ms
                </p>
                <p className="text-sm text-muted-foreground">
                  Success Rate: {metrics.health.summary.successRate5min.toFixed(1)}%
                </p>
              </div>
            </div>
            
            {metrics.health.issues.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">Issues Detected:</h4>
                <ul className="space-y-1">
                  {metrics.health.issues.map((issue: string, index: number) => (
                    <li key={index} className="text-sm text-yellow-700 flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Response Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{metrics.overview.avgResponseTime5min.toFixed(2)}ms</p>
                  <p className="text-xs text-muted-foreground">Last 5 minutes</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Success Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{metrics.overview.successRate5min.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Last 5 minutes</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total Operations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Operations</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{metrics.overview.totalOperations}</p>
                  <p className="text-xs text-muted-foreground">All time</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#2D2DDD]/10 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-[#2D2DDD]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Slow Operations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Slow Operations</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{metrics.overview.slowOperations}</p>
                  <p className="text-xs text-muted-foreground">&gt; 1 second</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Webhook Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-figtree font-semibold flex items-center gap-3">
              <Globe className="w-5 h-5 text-primary" />
              Webhook Performance
            </CardTitle>
            <CardDescription>
              Real-time webhook processing metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-3">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-figtree font-semibold mb-1">Total Sent</h3>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400 font-figtree">{metrics.webhook.totalSent}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-figtree font-semibold mb-1">Successful</h3>
                <p className="text-xl font-bold text-green-600 dark:text-green-400 font-figtree">{metrics.webhook.successful}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-figtree font-semibold mb-1">Failed</h3>
                <p className="text-xl font-bold text-red-600 dark:text-red-400 font-figtree">{metrics.webhook.failed}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#2D2DDD] to-[#2D2DDD]/80 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-figtree font-semibold mb-1">Avg Response</h3>
                <p className="text-xl font-bold text-[#2D2DDD] dark:text-[#2D2DDD] font-figtree">{metrics.webhook.averageResponseTime.toFixed(0)}ms</p>
              </div>
            </div>
            
            {/* Queue Status */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Queue Status</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Queue Length: {metrics.webhookQueue.queueLength}</span>
                <span className="text-sm text-muted-foreground">
                  High Priority: {metrics.webhookQueue.highPriority}
                </span>
                <span className="text-sm text-muted-foreground">
                  Normal Priority: {metrics.webhookQueue.normalPriority}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Database Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-figtree font-semibold flex items-center gap-3">
              <Database className="w-5 h-5 text-primary" />
              Database Performance
            </CardTitle>
            <CardDescription>
              Database query and caching metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-5 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-3">
                  <Database className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-figtree font-semibold mb-1">Total Queries</h3>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400 font-figtree">{metrics.database.totalQueries}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-figtree font-semibold mb-1">Cache Hits</h3>
                <p className="text-xl font-bold text-green-600 dark:text-green-400 font-figtree">{metrics.database.cacheHits}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center mx-auto mb-3">
                  <TrendingDown className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-figtree font-semibold mb-1">Cache Misses</h3>
                <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400 font-figtree">{metrics.database.cacheMisses}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#2D2DDD] to-[#2D2DDD]/80 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-figtree font-semibold mb-1">Avg Query Time</h3>
                <p className="text-xl font-bold text-[#2D2DDD] dark:text-[#2D2DDD] font-figtree">{metrics.database.averageQueryTime.toFixed(0)}ms</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-figtree font-semibold mb-1">Slow Queries</h3>
                <p className="text-xl font-bold text-red-600 dark:text-red-400 font-figtree">{metrics.database.slowQueries}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Operations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-figtree font-semibold flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-primary" />
              Recent Operations
            </CardTitle>
            <CardDescription>
              Latest system operations and their performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.recentOperations.map((op: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${op.success ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="font-medium">{op.operation}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{op.duration.toFixed(2)}ms</span>
                    <span>{new Date(op.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
