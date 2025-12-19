import { logger } from '../utils/logger.js'
import fs from 'fs/promises'
import path from 'path'

/**
 * SendGrid Email Service
 * Uses SendGrid API (HTTPS) instead of SMTP - no firewall issues!
 */
export class SendGridService {
  private apiKey: string
  private fromEmail: string
  private fromName: string
  private logFile: string

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || ''
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.MAIL_USER || 'noreply@optiohire.com'
    this.fromName = process.env.SENDGRID_FROM_NAME || 'OptioHire'

    if (!this.apiKey) {
      logger.warn('SendGrid API key not configured. Set SENDGRID_API_KEY in .env')
      logger.warn('Get your API key from: https://app.sendgrid.com/settings/api_keys')
    }

    // Setup email log file
    this.logFile = path.join(process.cwd(), 'logs', 'email.log')
    this.ensureLogDirectory()
  }

  private async ensureLogDirectory() {
    try {
      await fs.mkdir(path.dirname(this.logFile), { recursive: true })
    } catch (error) {
      // Directory might already exist
    }
  }

  private async logEmail(to: string, subject: string, status: 'sent' | 'failed', error?: string) {
    try {
      const timestamp = new Date().toISOString()
      const logEntry = `[${timestamp}] ${status.toUpperCase()} | To: ${to} | Subject: ${subject}${error ? ` | Error: ${error}` : ''}\n`
      await fs.appendFile(this.logFile, logEntry)
    } catch (error) {
      logger.error('Failed to write email log:', error)
    }
  }

  /**
   * Send email using SendGrid API
   */
  async sendEmail(data: {
    to: string
    subject: string
    html: string
    text: string
    from?: string
    fromName?: string
  }): Promise<void> {
    if (!this.apiKey) {
      throw new Error('SendGrid API key not configured. Set SENDGRID_API_KEY in .env')
    }

    try {
      const fromEmail = data.from || this.fromEmail
      const fromName = data.fromName || this.fromName

      // SendGrid API endpoint
      const url = 'https://api.sendgrid.com/v3/mail/send'

      // Prepare email payload
      const payload = {
        personalizations: [
          {
            to: [{ email: data.to }],
            subject: data.subject
          }
        ],
        from: {
          email: fromEmail,
          name: fromName
        },
        content: [
          {
            type: 'text/plain',
            value: data.text
          },
          {
            type: 'text/html',
            value: data.html
          }
        ]
      }

      // Send via SendGrid API
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `SendGrid API error: ${response.status} ${response.statusText}`
        
        try {
          const errorJson = JSON.parse(errorText)
          if (errorJson.errors && errorJson.errors.length > 0) {
            errorMessage = errorJson.errors.map((e: any) => e.message).join('; ')
          }
        } catch {
          errorMessage += ` - ${errorText}`
        }

        throw new Error(errorMessage)
      }

      logger.info(`Email sent via SendGrid to ${data.to}: ${data.subject}`)
      await this.logEmail(data.to, data.subject, 'sent')
    } catch (error: any) {
      const errorMsg = error?.message || String(error)
      logger.error(`Failed to send email via SendGrid to ${data.to}:`, error)
      await this.logEmail(data.to, data.subject, 'failed', errorMsg)
      throw error
    }
  }

  /**
   * Verify SendGrid API key
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.apiKey) {
      logger.error('SendGrid API key not configured')
      return false
    }

    try {
      // Test API key by checking API key permissions
      const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      if (response.ok) {
        logger.info('SendGrid API key verified successfully')
        return true
      } else {
        logger.error(`SendGrid API key verification failed: ${response.status} ${response.statusText}`)
        return false
      }
    } catch (error: any) {
      logger.error('SendGrid API connection test failed:', error.message)
      return false
    }
  }
}

