import type { Request, Response } from 'express'
import { query } from '../db/index.js'

interface AnalyticsEvent {
  event: string
  sessionId: string
  timestamp: number
  data?: Record<string, any>
  url?: string
  path?: string
  userId?: string
}

export async function trackEvent(req: Request, res: Response) {
  try {
    const event: AnalyticsEvent = req.body

    // Validate required fields
    if (!event.event || !event.sessionId || !event.timestamp) {
      return res.status(400).json({ error: 'Missing required fields: event, sessionId, timestamp' })
    }

    // Check if analytics is enabled for this user
    // This would be checked via cookies/headers in a real implementation
    // For now, we'll just log the event

    // Store analytics event in database (if analytics table exists)
    try {
      await query(
        `INSERT INTO analytics_events (
          event_type,
          session_id,
          user_id,
          event_data,
          url,
          path,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          event.event,
          event.sessionId,
          event.userId || null,
          event.data ? JSON.stringify(event.data) : null,
          event.url || null,
          event.path || null,
          new Date(event.timestamp).toISOString()
        ]
      )
    } catch (dbError: any) {
      // If analytics table doesn't exist, just log the event
      // This is fine - analytics should not break the app
      console.log('Analytics table not found, logging event:', event.event)
    }

    return res.json({ success: true, message: 'Event tracked successfully' })
  } catch (err) {
    console.error('Error tracking analytics event:', err)
    // Don't return error - analytics should not break the app
    return res.json({ success: true, message: 'Event logged' })
  }
}

