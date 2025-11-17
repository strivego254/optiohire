import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import fs from 'fs/promises'
import path from 'path'

export interface ParsedCV {
  textContent: string
  linkedin: string | null
  github: string | null
  embeddedEmails: string[]
}

const LINKEDIN_REGEX = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub|profile)\/[\w-]+\/?/gi
const GITHUB_REGEX = /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+\/?/gi
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
const URL_REGEX = /https?:\/\/[^\s)]+/gi

export class CVParser {
  /**
   * Parse CV file and extract text content and links
   */
  async parseCV(filePath: string): Promise<ParsedCV> {
    const ext = path.extname(filePath).toLowerCase()
    let textContent = ''

    try {
      if (ext === '.pdf') {
        const buffer = await fs.readFile(filePath)
        const pdfData = await pdfParse(buffer)
        textContent = pdfData.text
      } else if (ext === '.docx' || ext === '.doc') {
        const buffer = await fs.readFile(filePath)
        const result = await mammoth.extractRawText({ buffer })
        textContent = result.value
      } else {
        // Try to read as plain text
        textContent = await fs.readFile(filePath, 'utf-8')
      }
    } catch (error) {
      throw new Error(`Failed to parse CV file: ${error}`)
    }

    return this.extractLinks(textContent)
  }

  /**
   * Parse CV from buffer
   */
  async parseCVBuffer(buffer: Buffer, mimeType: string): Promise<ParsedCV> {
    let textContent = ''

    try {
      if (mimeType === 'application/pdf') {
        const pdfData = await pdfParse(buffer)
        textContent = pdfData.text
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                 mimeType === 'application/msword') {
        const result = await mammoth.extractRawText({ buffer })
        textContent = result.value
      } else if (mimeType.startsWith('text/')) {
        textContent = buffer.toString('utf-8')
      } else {
        // Try PDF as fallback
        try {
          const pdfData = await pdfParse(buffer)
          textContent = pdfData.text
        } catch {
          textContent = buffer.toString('utf-8')
        }
      }
    } catch (error) {
      throw new Error(`Failed to parse CV buffer: ${error}`)
    }

    return this.extractLinks(textContent)
  }

  /**
   * Extract and classify links from text content
   */
  private extractLinks(textContent: string): ParsedCV {
    // Extract all URLs
    const allUrls = textContent.match(URL_REGEX) || []
    
    // Extract LinkedIn links
    const linkedinMatches = textContent.match(LINKEDIN_REGEX) || []
    const linkedin = linkedinMatches.length > 0 
      ? linkedinMatches[0].replace(/\/$/, '') // Remove trailing slash
      : null

    // Extract GitHub links
    const githubMatches = textContent.match(GITHUB_REGEX) || []
    const github = githubMatches.length > 0
      ? githubMatches[0].replace(/\/$/, '') // Remove trailing slash
      : null

    // Extract email addresses
    const emailMatches = textContent.match(EMAIL_REGEX) || []
    const embeddedEmails = [...new Set(emailMatches)] // Remove duplicates

    return {
      textContent: textContent.trim(),
      linkedin,
      github,
      embeddedEmails
    }
  }

  /**
   * Extract skills from text content (basic keyword matching)
   */
  extractSkills(textContent: string, requiredSkills: string[]): string[] {
    const foundSkills: string[] = []
    const lowerText = textContent.toLowerCase()

    for (const skill of requiredSkills) {
      const skillLower = skill.toLowerCase()
      // Check for exact match or word boundary match
      const regex = new RegExp(`\\b${skillLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
      if (regex.test(lowerText)) {
        foundSkills.push(skill)
      }
    }

    return foundSkills
  }
}

