import { Router } from 'express'
import { trackEvent } from '../api/analyticsController.js'

export const router = Router()

// Track analytics events
router.post('/track', trackEvent)

