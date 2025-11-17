import { Router } from 'express'
import { createJobPosting } from '../api/jobPostingsController.js'

export const router = Router()

router.post('/', createJobPosting)


