import nodemailer from 'nodemailer'
import { readFileSync } from 'fs'
import { join } from 'path'
import { existsSync } from 'fs'

const host = process.env.SMTP_HOST || 'localhost'
const port = Number(process.env.SMTP_PORT || 1025)
const user = process.env.SMTP_USER || ''
const pass = process.env.SMTP_PASS || ''
const from = 'OptioHire <hirebitapplications@gmail.com>'

export const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: user ? { user, pass } : undefined,
})

function loadTemplate(name: string, format: 'html' | 'txt'): string {
  try {
    // Try multiple possible paths for Next.js
    const possiblePaths = [
      join(process.cwd(), 'templates', `${name}.${format}`),
      join(process.cwd(), 'frontend', 'templates', `${name}.${format}`),
      join(process.cwd(), 'src', 'templates', `${name}.${format}`),
    ]
    
    for (const templatePath of possiblePaths) {
      if (existsSync(templatePath)) {
        return readFileSync(templatePath, 'utf-8')
      }
    }
    
    console.warn(`Template ${name}.${format} not found in any expected location`)
    return ''
  } catch (error) {
    console.error(`Failed to load template ${name}.${format}:`, error)
    return ''
  }
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  let rendered = template
  for (const [key, value] of Object.entries(vars)) {
    rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value)
  }
  return rendered
}

export interface InterviewEmailParams {
  candidate: { name: string; email: string }
  hr: { name: string; email: string }
  job: { title: string; companyName: string }
  interviewTime: string
  meetingLink: string
}

export async function sendInterviewScheduledEmails(params: InterviewEmailParams) {
  const interviewDate = new Date(params.interviewTime)
  const formattedDate = interviewDate.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  // Candidate email
  const candidateHtmlTemplate = loadTemplate('interview-scheduled-candidate', 'html')
  const candidateTextTemplate = loadTemplate('interview-scheduled-candidate', 'txt')

  const candidateHtml = candidateHtmlTemplate
    ? renderTemplate(candidateHtmlTemplate, {
        candidateName: params.candidate.name,
        jobTitle: params.job.title,
        companyName: params.job.companyName,
        interviewDate: formattedDate,
        meetingLink: params.meetingLink,
      })
    : `Hi ${params.candidate.name},\n\nYou have been scheduled for an interview for ${params.job.title} at ${params.job.companyName}.\n\nDate: ${formattedDate}\nMeeting Link: ${params.meetingLink}\n\nBest regards,\n${params.job.companyName}`

  const candidateText = candidateTextTemplate
    ? renderTemplate(candidateTextTemplate, {
        candidateName: params.candidate.name,
        jobTitle: params.job.title,
        companyName: params.job.companyName,
        interviewDate: formattedDate,
        meetingLink: params.meetingLink,
      })
    : candidateHtml.replace(/<[^>]*>/g, '')

  await transporter.sendMail({
    from,
    to: params.candidate.email,
    subject: `Interview Scheduled: ${params.job.title} at ${params.job.companyName}`,
    text: candidateText,
    html: candidateHtml,
  })

  // HR email
  const hrHtmlTemplate = loadTemplate('interview-scheduled-hr', 'html')
  const hrTextTemplate = loadTemplate('interview-scheduled-hr', 'txt')

  const hrHtml = hrHtmlTemplate
    ? renderTemplate(hrHtmlTemplate, {
        hrName: params.hr.name,
        candidateName: params.candidate.name,
        candidateEmail: params.candidate.email,
        jobTitle: params.job.title,
        companyName: params.job.companyName,
        interviewDate: formattedDate,
        meetingLink: params.meetingLink,
        candidateScore: 'N/A', // Could be passed if available
      })
    : `Hi ${params.hr.name},\n\nAn interview has been scheduled:\n\nCandidate: ${params.candidate.name} (${params.candidate.email})\nJob: ${params.job.title}\nDate: ${formattedDate}\nMeeting Link: ${params.meetingLink}\n\nBest regards,\nOptioHire`

  const hrText = hrTextTemplate
    ? renderTemplate(hrTextTemplate, {
        hrName: params.hr.name,
        candidateName: params.candidate.name,
        candidateEmail: params.candidate.email,
        jobTitle: params.job.title,
        companyName: params.job.companyName,
        interviewDate: formattedDate,
        meetingLink: params.meetingLink,
        candidateScore: 'N/A',
      })
    : hrHtml.replace(/<[^>]*>/g, '')

  await transporter.sendMail({
    from,
    to: params.hr.email,
    subject: `Interview Scheduled: ${params.candidate.name} for ${params.job.title}`,
    text: hrText,
    html: hrHtml,
  })
}

