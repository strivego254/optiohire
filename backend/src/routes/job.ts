import { Router } from 'express'
import { createJob } from '../api/jobController.js'

export const router = Router()

router.post('/create', createJob)

