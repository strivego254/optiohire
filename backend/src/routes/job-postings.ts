import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { createJobPosting, getJobPostings } from '../api/jobPostingsController.js'

export const router = Router()

router.get('/', authenticate, getJobPostings)
router.post('/', authenticate, createJobPosting)


