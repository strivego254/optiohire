import { Router } from 'express'
import { signup, signin } from '../api/authController.js'

export const router = Router()

router.post('/signup', signup)
router.post('/signin', signin)
router.get('/health', (_req, res) => res.json({ ok: true }))


