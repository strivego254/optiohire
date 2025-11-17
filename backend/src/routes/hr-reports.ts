import { Router } from 'express'
import { generateReport, getReport } from '../api/reportsController.js'

export const router = Router()

// Manual report generation (HR/admin only)
router.post('/generate', generateReport)

// Get report for a job
router.get('/:jobId', getReport)

