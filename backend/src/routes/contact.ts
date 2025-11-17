import { Router } from 'express'
import { createContact } from '../api/contactController.js'

export const router = Router()

router.post('/', createContact)


