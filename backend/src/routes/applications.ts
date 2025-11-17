import { Router } from 'express'
import { parseEmailApplications, scoreApplication } from '../api/applicationsController.js'

export const router = Router()

router.post('/parse-email', parseEmailApplications)
router.post('/score', scoreApplication)


