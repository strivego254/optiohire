import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import { JobPostingRepository } from '../repositories/jobPostingRepository.js'
import { CompanyRepository } from '../repositories/companyRepository.js'
import { CandidateRepository } from '../repositories/candidateRepository.js'
import { CVParser } from '../lib/cv-parser.js'
import { AIScoringEngine } from '../lib/ai-scoring.js'
import { saveFile } from '../utils/storage.js'
import { EmailService } from '../services/emailService.js'
import { logger } from '../utils/logger.js'

export class EmailReader {
  private client: ImapFlow | null = null
  private isRunning = false
  private jobPostingRepo: JobPostingRepository
  private companyRepo: CompanyRepository
  private candidateRepo: CandidateRepository
  private cvParser: CVParser
  private aiScoring: AIScoringEngine
  private emailService: EmailService

  constructor() {
    this.jobPostingRepo = new JobPostingRepository()
    this.companyRepo = new CompanyRepository()
    this.candidateRepo = new CandidateRepository()
    this.cvParser = new CVParser()
    this.aiScoring = new AIScoringEngine()
    this.emailService = new EmailService()
  }

  async start() {
    if (this.isRunning) {
      logger.warn('Email reader is already running')
      return
    }

    const imapHost = process.env.IMAP_HOST
    const imapUser = process.env.IMAP_USER
    const imapPass = process.env.IMAP_PASS

    if (!imapHost || !imapUser || !imapPass) {
      logger.warn('IMAP credentials not configured, email reader disabled')
      return
    }

    try {
      this.client = new ImapFlow({
        host: imapHost,
        port: 993,
        secure: true,
        auth: {
          user: imapUser,
          pass: imapPass
        }
      })

      await this.client.connect()
      logger.info('IMAP email reader connected')

      this.isRunning = true

      // Start monitoring inbox
      await this.monitorInbox()
    } catch (error) {
      logger.error('Failed to start email reader:', error)
      this.isRunning = false
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

  private async monitorInbox() {
    if (!this.client) return

    const checkInterval = parseInt(process.env.IMAP_POLL_MS || '30000', 10) // Default 30 seconds

    while (this.isRunning) {
      try {
        await this.processNewEmails()
      } catch (error) {
        logger.error('Error processing emails:', error)
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval))
    }
  }

  private async processNewEmails() {
    if (!this.client) return

    try {
      const lock = await this.client.getMailboxLock('INBOX')
      try {
        // Search for unseen emails
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
              await this.processEmail(message.source, message.envelope)
            }

            // Mark as seen
            await this.client.messageFlagsAdd(seq, ['\\Seen'])
          } catch (error) {
            logger.error(`Error processing email ${seq}:`, error)
          }
        }
      } finally {
        lock.release()
      }
    } catch (error) {
      logger.error('Error accessing inbox:', error)
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

      // Create candidate record
      const candidate = await this.candidateRepo.create({
        job_posting_id: job.job_posting_id,
        company_id: company.company_id,
        candidate_name: senderName,
        email: senderEmail,
        cv_url: cvUrl
      })

      // Process CV if available
      if (cvBuffer && cvMimeType) {
        await this.processCandidateCV(candidate.id, cvBuffer, cvMimeType, job)
      } else {
        logger.warn(`No CV attachment found for candidate ${candidate.id}`)
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
    candidateId: string,
    cvBuffer: Buffer,
    mimeType: string,
    job: any
  ) {
    try {
      // Parse CV
      const parsed = await this.cvParser.parseCVBuffer(cvBuffer, mimeType)

      // Update candidate with parsed links
      await this.candidateRepo.updateLinks({
        id: candidateId,
        parsedlinkedin: parsed.linkedin,
        parsedgithub: parsed.github,
        parsedemail: parsed.embeddedEmails.length > 0 ? parsed.embeddedEmails[0] : null
      })

      // Extract skills
      const extractedSkills = this.cvParser.extractSkills(parsed.textContent, job.required_skills)

      // Score candidate
      const scoringResult = await this.aiScoring.scoreCandidate({
        jobDescription: job.job_description,
        requiredSkills: job.required_skills,
        candidateCVText: parsed.textContent,
        extractedSkills
      })

      // Update candidate with score
      await this.candidateRepo.updateScoring({
        id: candidateId,
        score: scoringResult.score,
        status: scoringResult.status,
        reasoning: scoringResult.reasoning
      })

      // Send appropriate email to candidate
      const candidate = await this.candidateRepo.findById(candidateId)
      if (candidate) {
        if (scoringResult.status === 'SHORTLIST') {
          await this.emailService.sendShortlistEmail({
            candidateEmail: candidate.email,
            candidateName: candidate.candidate_name || 'Candidate',
            jobTitle: job.job_title,
            companyName: '', // Will be fetched if needed
            interviewLink: job.meeting_link
          })
        } else if (scoringResult.status === 'REJECTED') {
          await this.emailService.sendRejectionEmail({
            candidateEmail: candidate.email,
            candidateName: candidate.candidate_name || 'Candidate',
            jobTitle: job.job_title,
            companyName: ''
          })
        }
      }

      logger.info(`Processed CV for candidate ${candidateId}, score: ${scoringResult.score}, status: ${scoringResult.status}`)
    } catch (error) {
      logger.error(`Error processing CV for candidate ${candidateId}:`, error)
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

