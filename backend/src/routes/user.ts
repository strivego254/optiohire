import { Router } from 'express'
import { getCurrentUser, updateUserCompany } from '../api/userController.js'
import { authenticate } from '../middleware/auth.js'

export const router = Router()

router.get('/me', authenticate, getCurrentUser)
router.put('/company', authenticate, updateUserCompany)

