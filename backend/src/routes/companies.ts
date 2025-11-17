import { Router } from 'express'
import { createCompany, getCompanyReport } from '../api/companiesController.js'

export const router = Router()

router.post('/', createCompany)
router.get('/:id/report', getCompanyReport)


