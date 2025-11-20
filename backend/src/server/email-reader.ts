import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import { JobPostingRepository } from '../repositories/jobPostingRepository.js'
import { CompanyRepository } from '../repositories/companyRepository.js'
import { ApplicationRepository } from '../repositories/applicationRepository.js'
import { CVParser } from '../lib/cv-parser.js'
import { AIScoringEngine } from '../lib/ai-scoring.js'
import { EmailClassifier } from '../lib/email-classifier.js'
import { saveFile } from '../utils/storage.js'
import { EmailService } from '../services/emailService.js'
import { logger } from '../utils/logger.js'

export class EmailReader {
  private client: ImapFlow | null = null
  private isRunning = false
  private jobPostingRepo: JobPostingRepository
  private companyRepo: CompanyRepository
  private applicationRepo: ApplicationRepository
  private cvParser: CVParser
  private aiScoring: AIScoringEngine
  private emailClassifier: EmailClassifier
  private emailService: EmailService

  constructor() {
    this.jobPostingRepo = new JobPostingRepository()
    this.companyRepo = new CompanyRepository()
    this.applicationRepo = new ApplicationRepository()
    this.cvParser = new CVParser()
    this.aiScoring = new AIScoringEngine()
    this.emailClassifier = new EmailClassifier()
    this.emailService = new EmailService()
  }

  async start() {
    if (this.isRunning) {
      logger.warn('Email reader is already running')
      return
    }

    // IMAP config from .env
    const imapHost = process.env.IMAP_HOST
    const imapPort = parseInt(process.env.IMAP_PORT || '993', 10)
    const imapUser = process.env.IMAP_USER
    const imapPass = process.env.IMAP_PASS
    const imapSecure = process.env.IMAP_SECURE !== 'false' // Default to true
    const imapPollMs = parseInt(process.env.IMAP_POLL_MS || '10000', 10) // Default 10 seconds

    if (!imapHost || !imapUser || !imapPass) {
      logger.warn('IMAP credentials not configured, email reader disabled')
      return
    }

    try {
      this.client = new ImapFlow({
        host: imapHost,
        port: imapPort,
        secure: imapSecure,
        auth: {
          user: imapUser,
          pass: imapPass
        }
      })

      await this.client.connect()
      logger.info(`IMAP email reader connected to ${imapHost}:${imapPort}`)

      // Ensure folders exist
      await this.ensureFolders()

      this.isRunning = true

      // Start monitoring inbox
      await this.monitorInbox(imapPollMs)
    } catch (error) {
      logger.error('Failed to start email reader:', error)
      this.isRunning = false
    }
  }

  /**
   * Ensure Processed and Failed folders exist
   */
  private async ensureFolders() {
    if (!this.client) return

    try {
      const folders = ['Processed', 'Failed']
      for (const folderName of folders) {
        try {
          await this.client.mailboxOpen(folderName)
        } catch {
          // Folder doesn't exist, create it
          await this.client.mailboxCreate(folderName)
          logger.info(`Created IMAP folder: ${folderName}`)
        }
      }
    } catch (error) {
      logger.warn('Could not ensure folders exist:', error)
    }
  }

  async stop() {
    this.isRunning = false
    if (this.client) {
      await this.client.logout()
      this.client = null
    }
    logger.info('Email reader stopped')
  }

  private async monitorInbox(pollInterval: number) {
    if (!this.client) return

    while (this.isRunning) {
      try {
        await this.processNewEmails()
      } catch (error) {
        logger.error('Error processing emails:', error)
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }
  }

  private async processNewEmails() {
    if (!this.client) return

    try {
      const lock = await this.client.getMailboxLock('INBOX')
      try {
        // Search for unseen emails with subject starting with "Application for"
        const messages = await this.client.search({
          seen: false
        })

        for (const seq of messages) {
          try {
            const message = await this.client.fetchOne(seq, {
              source: true,
              envelope: true
            })

            if (message.source && message.envelope) {
              const subject = message.envelope.subject || ''
              
              // Only process emails with subject starting with "Application for"
              if (subject.toLowerCase().startsWith('application for')) {
                try {
                  await this.processEmail(message.source, message.envelope)
                  
                  // Mark as seen
                  await this.client.messageFlagsAdd(seq, ['\\Seen'])
                  
                  // Move to Processed folder
                  await this.moveToFolder(seq, 'Processed')
                  
                  logger.info(`Successfully processed email: ${subject}`)
                } catch (error) {
                  logger.error(`Error processing email ${seq}:`, error)
                  
                  // Mark as seen
                  await this.client.messageFlagsAdd(seq, ['\\Seen'])
                  
                  // Move to Failed folder if parser fails
                  await this.moveToFolder(seq, 'Failed')
                }
              } else {
                logger.debug(`Skipping email (subject doesn't match): ${subject}`)
              }
            }
          } catch (error) {
            logger.error(`Error processing email ${seq}:`, error)
            // Try to move to Failed folder
            try {
              await this.client.messageFlagsAdd(seq, ['\\Seen'])
              await this.moveToFolder(seq, 'Failed')
            } catch (moveError) {
              logger.error(`Failed to move email ${seq} to Failed folder:`, moveError)
            }
          }
        }
      } finally {
        lock.release()
      }
    } catch (error) {
      logger.error('Error accessing inbox:', error)
    }
  }

  /**
   * Move email to a different folder
   */
  private async moveToFolder(seq: number, folderName: string) {
    if (!this.client) return

    try {
      await this.client.messageMove(seq, folderName)
      logger.debug(`Moved email ${seq} to ${folderName}`)
    } catch (error) {
      logger.warn(`Could not move email ${seq} to ${folderName}:`, error)
    }
  }

  private async processEmail(source: Buffer, envelope: any) {
    try {
      const parsed = await simpleParser(source)
      
      const senderName = parsed.from?.text || envelope.from[0]?.name || 'Unknown'
      const senderEmail = parsed.from?.value[0]?.address || envelope.from[0]?.address || ''
      const subject = parsed.subject || envelope.subject || ''

      logger.info(`Processing email from ${senderEmail}: ${subject}`)

      // Detect job from subject
      const jobMatch = this.detectJobFromSubject(subject)
      if (!jobMatch) {
        logger.warn(`Could not detect job from subject: ${subject}`)
        return
      }

      // Find job posting
      const company = await this.companyRepo.findByName(jobMatch.companyName)
      if (!company) {
        logger.warn(`Company not found: ${jobMatch.companyName}`)
        return
      }

      const jobs = await this.jobPostingRepo.findByCompany(company.company_id)
      const job = jobs.find(j => 
        j.job_title.toLowerCase().includes(jobMatch.jobTitle.toLowerCase())
      )

      if (!job) {
        logger.warn(`Job not found: ${jobMatch.jobTitle} for ${jobMatch.companyName}`)
        return
      }

      // Extract attachments (CV)
      let cvUrl: string | null = null
      let cvBuffer: Buffer | null = null
      let cvMimeType: string | null = null

      if (parsed.attachments && parsed.attachments.length > 0) {
        for (const attachment of parsed.attachments) {
          const filename = attachment.filename || 'attachment'
          const ext = filename.toLowerCase()
          
          if (ext.endsWith('.pdf') || ext.endsWith('.docx') || ext.endsWith('.doc')) {
            cvBuffer = attachment.content as Buffer
            cvMimeType = attachment.contentType || 'application/pdf'
            
            // Save CV file
            const savedPath = await saveFile(`cvs/${job.job_posting_id}_${Date.now()}_${filename}`, cvBuffer)
            cvUrl = savedPath
            break
          }
        }
      }

      // Create application record
      const application = await this.applicationRepo.create({
        job_posting_id: job.job_posting_id,
        company_id: company.company_id,
        candidate_name: senderName,
        email: senderEmail,
        resume_url: cvUrl
      })

      // Process CV if available
      if (cvBuffer && cvMimeType) {
        await this.processCandidateCV(application.application_id, cvBuffer, cvMimeType, job, company)
      } else {
        logger.warn(`No CV attachment found for application ${application.application_id}`)
      }

      // Send HR notification
      await this.emailService.sendHRNotification({
        hrEmail: company.hr_email,
        candidateName: senderName,
        candidateEmail: senderEmail,
        jobTitle: job.job_title,
        companyName: company.company_name
      })

      logger.info(`Successfully processed application from ${senderEmail} for job ${job.job_posting_id}`)
    } catch (error) {
      logger.error('Error processing email:', error)
    }
  }

  private detectJobFromSubject(subject: string): { jobTitle: string; companyName: string } | null {
    // Pattern: "Application for {Job Title} at {Company Name}"
    const patterns = [
      /application\s+for\s+(.+?)\s+at\s+(.+)/i,
      /apply\s+for\s+(.+?)\s+at\s+(.+)/i,
      /(.+?)\s+-\s+(.+?)\s+application/i
    ]

    for (const pattern of patterns) {
      const match = subject.match(pattern)
      if (match) {
        return {
          jobTitle: match[1].trim(),
          companyName: match[2].trim()
        }
      }
    }

    // Fallback: try to extract from common formats
    const parts = subject.split(/[-\|]/).map(s => s.trim())
    if (parts.length >= 2) {
      return {
        jobTitle: parts[0],
        companyName: parts[parts.length - 1]
      }
    }

    return null
  }

  private async processCandidateCV(
    applicationId: string,
    cvBuffer: Buffer,
    mimeType: string,
    job: any,
    company: any
  ) {
    try {
      // Parse CV
      const parsed = await this.cvParser.parseCVBuffer(cvBuffer, mimeType)

      // Build parsed resume JSON with links (aligned with CV parser output)
      const parsedResumeJson = {
        textContent: parsed.textContent,
        linkedin: parsed.linkedin,
        github: parsed.github,
        emails: parsed.emails,
        other_links: parsed.other_links
      }

      // Update application with parsed resume
      await this.applicationRepo.updateParsedResume({
        application_id: applicationId,
        parsed_resume_json: parsedResumeJson
      })

      // Extract skills
      const extractedSkills = this.cvParser.extractSkills(parsed.textContent, job.required_skills || [])

      // Score candidate (aligned with new input format)
      const scoringResult = await this.aiScoring.scoreCandidate({
        job: {
          title: job.job_title,
          description: job.job_description,
          required_skills: job.required_skills || []
        },
        cvText: parsed.textContent
      })

      // Map status: FLAGGED -> FLAG, REJECTED -> REJECT (to match database enum)
      const dbStatus = scoringResult.status === 'FLAGGED' ? 'FLAG' : 
                       scoringResult.status === 'REJECTED' ? 'REJECT' : 
                       scoringResult.status
      
      // Update application with score
      await this.applicationRepo.updateScoring({
        application_id: applicationId,
        ai_score: scoringResult.score,
        ai_status: dbStatus as 'SHORTLIST' | 'FLAG' | 'REJECT',
        reasoning: scoringResult.reasoning,
        parsed_resume_json: parsedResumeJson
      })

      // Send appropriate email to candidate
      const application = await this.applicationRepo.findById(applicationId)
      if (application) {
        // Fetch fresh company data to ensure we have company_domain
        const companyData = await this.companyRepo.findById(company.company_id)
        
        // Check status (use original status, not mapped)
        if (scoringResult.status === 'SHORTLIST') {
          await this.emailService.sendShortlistEmail({
            candidateEmail: application.email,
            candidateName: application.candidate_name || 'Candidate',
            jobTitle: job.job_title,
            companyName: companyData?.company_name || company.company_name,
            companyEmail: companyData?.company_email || company.company_email,
            companyDomain: companyData?.company_domain || company.company_domain,
            interviewLink: job.meeting_link
          })
        } else if (scoringResult.status === 'REJECTED') {
          await this.emailService.sendRejectionEmail({
            candidateEmail: application.email,
            candidateName: application.candidate_name || 'Candidate',
            jobTitle: job.job_title,
            companyName: companyData?.company_name || company.company_name,
            companyEmail: companyData?.company_email || company.company_email,
            companyDomain: companyData?.company_domain || company.company_domain
          })
        }
      }

      logger.info(`Processed CV for application ${applicationId}, score: ${scoringResult.score}, status: ${scoringResult.status}`)
    } catch (error) {
      logger.error(`Error processing CV for application ${applicationId}:`, error)
    }
  }
}

// Start email reader if enabled
if (process.env.ENABLE_EMAIL_READER !== 'false') {
  const emailReader = new EmailReader()
  emailReader.start().catch(err => {
    logger.error('Failed to start email reader:', err)
  })
}

