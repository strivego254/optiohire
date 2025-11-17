import { Router } from 'express'
import { scheduleInterview } from '../api/scheduleInterviewController.js'

export const router = Router()

router.post('/schedule-interview', scheduleInterview)

