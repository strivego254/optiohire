import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { router as companiesRouter } from './routes/companies.js'
import { router as jobsRouter } from './routes/jobs.js'
import { router as jobRouter } from './routes/job.js'
import { router as jobPostingsRouter } from './routes/job-postings.js'
import { router as inboundApplicationsRouter } from './routes/inbound-applications.js'
import { router as applicationsRouter } from './routes/applications.js'
import { router as reportsRouter } from './routes/reports.js'
import { router as contactRouter } from './routes/contact.js'
import { router as authRouter } from './routes/auth.js'
import { router as hrReportsRouter } from './routes/hr-reports.js'
import { router as scheduleRouter } from './routes/schedule.js'
import { ensureStorageDir } from './utils/storage.js'
import { logger } from './utils/logger.js'
import './cron/reportScheduler.js'
import './server/email-reader.js'

const app = express()
const port = Number(process.env.PORT || 3001)

app.use(cors())
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

// Health
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.use('/companies', companiesRouter)
app.use('/jobs', jobsRouter)
app.use('/api/job', jobRouter) // POST /api/job/create
app.use('/api/job-postings', jobPostingsRouter)
app.use('/inbound/applications', inboundApplicationsRouter)
app.use('/applications', applicationsRouter)
app.use('/companies', reportsRouter) // GET /companies/:id/report
app.use('/api/hr/reports', hrReportsRouter) // HR report endpoints
app.use('/api/system/reports', reportsRouter) // System/cron endpoints
app.use('/api', scheduleRouter) // POST /api/schedule-interview
app.use('/contact', contactRouter)
app.use('/auth', authRouter)

// Start
async function start() {
  await ensureStorageDir()
  app.listen(port, () => {
    logger.info(`Backend listening on http://localhost:${port}`)
  })
}

start().catch((err) => {
  logger.error('Failed to start server', { err })
  process.exit(1)
})


