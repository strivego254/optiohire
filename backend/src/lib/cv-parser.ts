import mammoth from 'mammoth'
import fs from 'fs/promises'
import path from 'path'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'

// pdf-parse v2 uses a class-based API
// Use fileURLToPath for better compatibility with tsx
const __filename = fileURLToPath(import.meta.url)
const require = createRequire(__filename)
const { PDFParse } = require('pdf-parse')

export interface ParsedCV {
  textContent: string
  linkedin: string | null
  github: string | null
  emails: string[]
  other_links: string[]
}

// Regex for extracting all hyperlinks (including hidden in formatting)
const URL_REGEX = /https?:\/\/[^\s)]+/gi
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
const MAILTO_REGEX = /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi

export class CVParser {
  /**
   * Parse CV file and extract text content and links
   * Input: { filePath: string }
   */
  async parseCV(filePath: string): Promise<ParsedCV> {
    const ext = path.extname(filePath).toLowerCase()
    let textContent = ''

    try {
      if (ext === '.pdf') {
        const buffer = await fs.readFile(filePath)
        const parser = new PDFParse({ data: buffer })
        const pdfData = await parser.getText()
        textContent = pdfData.text
      } else if (ext === '.docx' || ext === '.doc') {
        const buffer = await fs.readFile(filePath)
        // Extract both raw text and HTML to catch hidden hyperlinks
        const textResult = await mammoth.extractRawText({ buffer })
        const htmlResult = await mammoth.convertToHtml({ buffer })
        textContent = textResult.value
        // Extract links from HTML as well (hidden in formatting)
        const htmlLinks = htmlResult.value.match(URL_REGEX) || []
        if (htmlLinks.length > 0) {
          textContent += '\n' + htmlLinks.join(' ')
        }
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
        const parser = new PDFParse({ data: buffer })
        const pdfData = await parser.getText()
        textContent = pdfData.text
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                 mimeType === 'application/msword') {
        // Extract both raw text and HTML to catch hidden hyperlinks
        const textResult = await mammoth.extractRawText({ buffer })
        const htmlResult = await mammoth.convertToHtml({ buffer })
        textContent = textResult.value
        // Extract links from HTML as well (hidden in formatting)
        const htmlLinks = htmlResult.value.match(URL_REGEX) || []
        if (htmlLinks.length > 0) {
          textContent += '\n' + htmlLinks.join(' ')
        }
      } else if (mimeType.startsWith('text/')) {
        textContent = buffer.toString('utf-8')
      } else {
        // Try PDF as fallback
        try {
          const parser = new PDFParse({ data: buffer })
          const pdfData = await parser.getText()
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
   * Categorizes: LinkedIn, GitHub, Emails (mailto:), Other links
   */
  private extractLinks(textContent: string): ParsedCV {
    // Clean text: remove excessive spacing and newlines
    const cleanedText = textContent
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n+/g, ' ') // Replace newlines with space
      .trim()

    // Extract all URLs using regex: /https?:\/\/[^\s)]+/gi
    const allUrls = [...new Set((cleanedText.match(URL_REGEX) || []).map(url => url.trim()))]
    
    // Extract emails from mailto: links
    const mailtoMatches = [...cleanedText.matchAll(MAILTO_REGEX)]
    const mailtoEmails = mailtoMatches.map(match => match[1])
    
    // Extract regular email addresses
    const emailMatches = [...new Set((cleanedText.match(EMAIL_REGEX) || []).map(email => email.trim()))]
    
    // Combine all emails (mailto + regular)
    const allEmails = [...new Set([...mailtoEmails, ...emailMatches])]

    // Categorize links
    let linkedin: string | null = null
    let github: string | null = null
    const otherLinks: string[] = []

    for (const url of allUrls) {
      const lowerUrl = url.toLowerCase()
      
      if (lowerUrl.includes('linkedin.com')) {
        if (!linkedin) {
          linkedin = url.replace(/\/$/, '') // Remove trailing slash, keep first match
        }
      } else if (lowerUrl.includes('github.com')) {
        if (!github) {
          github = url.replace(/\/$/, '') // Remove trailing slash, keep first match
        }
      } else {
        // Not LinkedIn or GitHub, add to other_links
        otherLinks.push(url)
      }
    }

    return {
      textContent: cleanedText,
      linkedin,
      github,
      emails: allEmails,
      other_links: otherLinks
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

