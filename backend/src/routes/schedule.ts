import { Router } from 'express'
import { scheduleInterview } from '../api/scheduleInterviewController.js'
import { getScheduledInterviews } from '../api/interviewsController.js'
import { authenticate } from '../middleware/auth.js'

export const router = Router()

router.post('/schedule-interview', authenticate, scheduleInterview)
router.get('/interviews', authenticate, getScheduledInterviews)

