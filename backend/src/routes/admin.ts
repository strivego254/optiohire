import { Router } from 'express'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import {
  getAllUsers,
  getUserById,
  getUserStats,
  updateUser,
  deleteUser,
  getAllCompanies,
  getCompanyDetails,
  updateCompany,
  deleteCompany,
  getAllJobPostings,
  deleteJobPosting,
  getAllApplications,
  deleteApplication,
  getSystemStats
} from '../api/adminController.js'

export const router = Router()

// All admin routes require authentication and admin role
router.use(authenticate)
router.use(requireAdmin)

// System Statistics
router.get('/stats', getSystemStats)

// Users Management
router.get('/users', getAllUsers)
router.get('/users/:userId', getUserById)
router.get('/users/:userId/stats', getUserStats)
router.patch('/users/:userId', updateUser)
router.delete('/users/:userId', deleteUser)

// Companies Management
router.get('/companies', getAllCompanies)
router.get('/companies/:companyId', getCompanyDetails)
router.patch('/companies/:companyId', updateCompany)
router.delete('/companies/:companyId', deleteCompany)

// Job Postings Management
router.get('/job-postings', getAllJobPostings)
router.delete('/job-postings/:jobId', deleteJobPosting)

// Applications Management
router.get('/applications', getAllApplications)
router.delete('/applications/:applicationId', deleteApplication)

