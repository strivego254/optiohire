import { Router } from 'express'
import { receiveInboundApplication } from '../api/inboundApplicationsController.js'

export const router = Router()

router.post('/:jobId', receiveInboundApplication)


