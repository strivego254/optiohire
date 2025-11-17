import PDFDocument from 'pdfkit'
import type { ApplicantData, JobData, CompanyData, ReportAnalysis } from '../ai/reportGenerator.js'

export interface ReportData {
  job: JobData
  company: CompanyData
  applicants: ApplicantData[]
  analysis: ReportAnalysis
  statistics: {
    total: number
    shortlisted: number
    flagged: number
    rejected: number
    averageScore: number
  }
}

export async function generateReportPDF(data: ReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // Header
    doc.fontSize(24).font('Helvetica-Bold')
      .text('Final Hiring Report', { align: 'center' })
    doc.moveDown(0.5)

    doc.fontSize(14).font('Helvetica')
      .text(`${data.job.job_title}`, { align: 'center' })
      .text(`${data.company.company_name}`, { align: 'center' })
    
    if (data.job.application_deadline) {
      const deadline = new Date(data.job.application_deadline).toLocaleDateString()
      doc.text(`Application Deadline: ${deadline}`, { align: 'center' })
    }
    
    doc.moveDown(1)

    // Executive Summary
    doc.fontSize(16).font('Helvetica-Bold')
      .text('Executive Summary', { underline: true })
    doc.moveDown(0.3)
    doc.fontSize(11).font('Helvetica')
      .text(data.analysis.executiveSummary, { align: 'justify' })
    doc.moveDown(1)

    // Summary Statistics
    doc.fontSize(16).font('Helvetica-Bold')
      .text('Summary Statistics', { underline: true })
    doc.moveDown(0.3)
    doc.fontSize(11).font('Helvetica')
      .text(`Total Applicants: ${data.statistics.total}`)
      .text(`Shortlisted: ${data.statistics.shortlisted}`)
      .text(`Flagged (Needs Review): ${data.statistics.flagged}`)
      .text(`Rejected: ${data.statistics.rejected}`)
      .text(`Average Score: ${data.statistics.averageScore.toFixed(1)}/100`)
    doc.moveDown(1)

    // Top 3 Candidates
    if (data.analysis.top3Candidates.length > 0) {
      doc.fontSize(16).font('Helvetica-Bold')
        .text('Top 3 Candidates', { underline: true })
      doc.moveDown(0.3)
      
      data.analysis.top3Candidates.forEach((candidate, idx) => {
        doc.fontSize(12).font('Helvetica-Bold')
          .text(`${idx + 1}. ${candidate.name}`, { continued: false })
        doc.fontSize(10).font('Helvetica')
          .text(`   Email: ${candidate.email}`)
          .text(`   Score: ${candidate.score}/100`)
        
        if (candidate.keyStrengths.length > 0) {
          doc.text(`   Key Strengths: ${candidate.keyStrengths.join(', ')}`)
        }
        
        doc.text(`   Reasoning: ${candidate.reasoning}`, { align: 'justify' })
        doc.moveDown(0.5)
      })
      doc.moveDown(1)
    }

    // Shortlisted Candidates Section
    const shortlisted = data.applicants.filter(a => a.ai_status === 'SHORTLIST')
    if (shortlisted.length > 0) {
      doc.addPage()
      doc.fontSize(16).font('Helvetica-Bold')
        .text('Shortlisted Candidates', { underline: true })
      doc.moveDown(0.3)

      shortlisted.forEach((applicant, idx) => {
        if (idx > 0 && idx % 5 === 0) {
          doc.addPage()
        }

        doc.fontSize(12).font('Helvetica-Bold')
          .text(`${applicant.candidate_name || 'Unknown'}`, { continued: false })
        doc.fontSize(10).font('Helvetica')
          .text(`Email: ${applicant.email}`)
          .text(`Score: ${applicant.ai_score || 'N/A'}/100`)
        
        const skills = extractSkills(applicant.parsed_resume_json)
        if (skills.length > 0) {
          doc.text(`Skills: ${skills.slice(0, 10).join(', ')}`)
        }

        const links = extractLinks(applicant)
        if (links.length > 0) {
          doc.text(`Links: ${links.slice(0, 3).join(', ')}`)
        }

        if (applicant.reasoning) {
          doc.text(`Reasoning: ${applicant.reasoning.substring(0, 200)}${applicant.reasoning.length > 200 ? '...' : ''}`, { align: 'justify' })
        }

        doc.moveDown(0.5)
      })
      doc.moveDown(1)
    }

    // Flagged Candidates Section
    const flagged = data.applicants.filter(a => a.ai_status === 'FLAG')
    if (flagged.length > 0) {
      doc.addPage()
      doc.fontSize(16).font('Helvetica-Bold')
        .text('Flagged Candidates (NEEDS REVIEW)', { underline: true, color: 'orange' })
      doc.moveDown(0.3)

      flagged.forEach((applicant, idx) => {
        if (idx > 0 && idx % 5 === 0) {
          doc.addPage()
        }

        doc.fontSize(12).font('Helvetica-Bold')
          .text(`${applicant.candidate_name || 'Unknown'}`, { continued: false })
        doc.fontSize(10).font('Helvetica')
          .text(`Email: ${applicant.email}`)
          .text(`Score: ${applicant.ai_score || 'N/A'}/100`)
        
        if (applicant.reasoning) {
          doc.text(`Reasoning: ${applicant.reasoning.substring(0, 200)}${applicant.reasoning.length > 200 ? '...' : ''}`, { align: 'justify' })
        }

        doc.moveDown(0.5)
      })
      doc.moveDown(1)
    }

    // Rejected Candidates Summary
    const rejected = data.applicants.filter(a => a.ai_status === 'REJECT')
    if (rejected.length > 0) {
      doc.addPage()
      doc.fontSize(16).font('Helvetica-Bold')
        .text('Rejected Candidates', { underline: true })
      doc.moveDown(0.3)
      doc.fontSize(11).font('Helvetica')
        .text(`Total Rejected: ${rejected.length}`)
      doc.moveDown(0.5)

      // Show first 20 rejected with brief info
      rejected.slice(0, 20).forEach((applicant) => {
        doc.fontSize(10).font('Helvetica')
          .text(`${applicant.candidate_name || 'Unknown'} (${applicant.email}) - Score: ${applicant.ai_score || 'N/A'}`, { continued: false })
        if (applicant.reasoning) {
          doc.text(`  ${applicant.reasoning.substring(0, 150)}${applicant.reasoning.length > 150 ? '...' : ''}`, { align: 'justify' })
        }
        doc.moveDown(0.3)
      })

      if (rejected.length > 20) {
        doc.moveDown(0.5)
        doc.fontSize(10).font('Helvetica-Italic')
          .text(`... and ${rejected.length - 20} more rejected candidates`)
      }
      doc.moveDown(1)
    }

    // Recommendations
    if (data.analysis.recommendations.length > 0) {
      doc.addPage()
      doc.fontSize(16).font('Helvetica-Bold')
        .text('Recommendations', { underline: true })
      doc.moveDown(0.3)
      doc.fontSize(11).font('Helvetica')

      data.analysis.recommendations.forEach((rec, idx) => {
        doc.text(`${idx + 1}. ${rec}`, { align: 'justify' })
        doc.moveDown(0.3)
      })
      doc.moveDown(1)
    }

    // Role Fit Analysis
    if (data.analysis.roleFitAnalysis) {
      doc.fontSize(14).font('Helvetica-Bold')
        .text('Role Fit Analysis', { underline: true })
      doc.moveDown(0.3)
      doc.fontSize(11).font('Helvetica')
        .text(data.analysis.roleFitAnalysis, { align: 'justify' })
      doc.moveDown(1)
    }

    // Gaps in Pool
    if (data.analysis.gapsInPool) {
      doc.fontSize(14).font('Helvetica-Bold')
        .text('Gaps in Applicant Pool', { underline: true })
      doc.moveDown(0.3)
      doc.fontSize(11).font('Helvetica')
        .text(data.analysis.gapsInPool, { align: 'justify' })
    }

    // Footer
    doc.fontSize(8).font('Helvetica')
      .text(`Generated on ${new Date().toLocaleString()} by HireBit`, { align: 'center' })

    doc.end()
  })
}

function extractSkills(parsedResume: any): string[] {
  if (!parsedResume) return []
  if (Array.isArray(parsedResume.skills)) return parsedResume.skills
  if (typeof parsedResume.skills === 'object') {
    return Object.keys(parsedResume.skills)
  }
  return []
}

function extractLinks(applicant: ApplicantData): string[] {
  const links: string[] = []
  if (applicant.links && Array.isArray(applicant.links)) {
    links.push(...applicant.links)
  }
  if (applicant.parsed_resume_json?.links) {
    const resumeLinks = applicant.parsed_resume_json.links
    if (resumeLinks.github) links.push(`GitHub: ${resumeLinks.github}`)
    if (resumeLinks.linkedin) links.push(`LinkedIn: ${resumeLinks.linkedin}`)
    if (Array.isArray(resumeLinks.portfolio)) {
      links.push(...resumeLinks.portfolio.map((p: string) => `Portfolio: ${p}`))
    }
  }
  return links
}

