import { Router } from 'express'
import { createJob, getApplicantsByJob } from '../api/jobsController.js'

export const router = Router()

router.post('/', createJob)
router.get('/:id/applicants', getApplicantsByJob)


