import { GoogleGenerativeAI } from '@google/generative-ai'
import { logger } from '../../utils/logger.js'

export interface ApplicantData {
  id: string
  candidate_name: string | null
  email: string
  ai_score: number | null
  ai_status: 'SHORTLIST' | 'FLAG' | 'REJECT' | null
  reasoning: string | null
  parsed_resume_json: any
  links?: string[]
}

export interface JobData {
  job_posting_id: string
  job_title: string
  job_description: string
  responsibilities: string
  skills_required: string[]
  application_deadline: string | null
}

export interface CompanyData {
  company_id: string
  company_name: string
  company_email: string | null
  company_domain: string | null
  hr_email: string
}

export interface ReportAnalysis {
  executiveSummary: string
  top3Candidates: Array<{
    name: string
    email: string
    score: number
    keyStrengths: string[]
    reasoning: string
  }>
  roleFitAnalysis: string
  gapsInPool: string
  recommendations: string[]
}

/**
 * Get Gemini API key
 */
function getGeminiApiKey(): string | null {
  return process.env.GEMINI_API_KEY || null
}

export async function generateReportAnalysis(
  job: JobData,
  company: CompanyData,
  applicants: ApplicantData[]
): Promise<ReportAnalysis> {
  const model = process.env.REPORT_AI_MODEL || 'gemini-2.0-flash'
  const geminiKey = getGeminiApiKey()

  const shortlisted = applicants.filter(a => a.ai_status === 'SHORTLIST')
  const flagged = applicants.filter(a => a.ai_status === 'FLAG')
  const rejected = applicants.filter(a => a.ai_status === 'REJECT')

  const prompt = `You are an expert HR analyst. Generate a comprehensive hiring report analysis.

JOB DETAILS:
Title: ${job.job_title}
Description: ${job.job_description}
Responsibilities: ${job.responsibilities}
Required Skills: ${job.skills_required.join(', ')}

APPLICANT POOL:
Total: ${applicants.length}
Shortlisted: ${shortlisted.length}
Flagged: ${flagged.length}
Rejected: ${rejected.length}

SHORTLISTED CANDIDATES:
${shortlisted.map((a, i) => `
${i + 1}. ${a.candidate_name || 'Unknown'} (${a.email})
   Score: ${a.ai_score || 'N/A'}
   Reasoning: ${a.reasoning || 'No reasoning provided'}
   Skills: ${extractSkills(a.parsed_resume_json).join(', ')}
   Links: ${extractLinks(a).join(', ')}
`).join('\n')}

FLAGGED CANDIDATES (Need Review):
${flagged.map((a, i) => `
${i + 1}. ${a.candidate_name || 'Unknown'} (${a.email})
   Score: ${a.ai_score || 'N/A'}
   Reasoning: ${a.reasoning || 'No reasoning provided'}
`).join('\n')}

REJECTED CANDIDATES:
${rejected.slice(0, 10).map((a, i) => `
${i + 1}. ${a.candidate_name || 'Unknown'} - ${a.reasoning || 'No reasoning'}
`).join('\n')}

Generate a JSON response with this exact structure:
{
  "executiveSummary": "2-3 sentence overview of the hiring process and outcomes",
  "top3Candidates": [
    {
      "name": "candidate name",
      "email": "email",
      "score": number,
      "keyStrengths": ["strength1", "strength2", "strength3"],
      "reasoning": "why they're top candidates"
    }
  ],
  "roleFitAnalysis": "Analysis of how well candidates match the role requirements",
  "gapsInPool": "What skills or qualities are missing from the applicant pool",
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
}

Return ONLY valid JSON, no markdown formatting.`

  // Use Gemini for report generation
  if (geminiKey) {
    try {
      logger.info(`Using Gemini model: ${model} for report generation`)
      const genAI = new GoogleGenerativeAI(geminiKey)
      
      const systemInstruction = 'You are an expert HR analyst. Always return valid JSON only, no markdown or code blocks.'
      
      const geminiModel = genAI.getGenerativeModel({ 
        model: model,
        systemInstruction: systemInstruction
      })
      
      const result = await geminiModel.generateContent(prompt)
      const response = await result.response
      let content = response.text() || '{}'
      
      // Extract JSON from response (handle markdown code blocks if present)
      content = content.trim()
      if (content.startsWith('```json')) {
        content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (content.startsWith('```')) {
        content = content.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      const parsed = JSON.parse(content) as ReportAnalysis
      
      // Ensure top3Candidates is limited to 3
      if (parsed.top3Candidates && parsed.top3Candidates.length > 3) {
        parsed.top3Candidates = parsed.top3Candidates.slice(0, 3)
      }

      logger.info('Gemini report generation successful')
      return parsed
    } catch (error: any) {
      logger.error(`Gemini report generation failed: ${error.message}, using fallback`)
      return generateBasicAnalysis(job, applicants)
    }
  }

  // Fallback to basic analysis without AI
  logger.warn('No Gemini API key available, using basic analysis')
  return generateBasicAnalysis(job, applicants)
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

function generateBasicAnalysis(job: JobData, applicants: ApplicantData[]): ReportAnalysis {
  const shortlisted = applicants.filter(a => a.ai_status === 'SHORTLIST')
  const avgScore = applicants
    .filter(a => a.ai_score !== null)
    .reduce((sum, a) => sum + (a.ai_score || 0), 0) / applicants.length || 0

  return {
    executiveSummary: `Received ${applicants.length} applications for ${job.job_title}. ${shortlisted.length} candidates were shortlisted based on AI scoring.`,
    top3Candidates: shortlisted
      .sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0))
      .slice(0, 3)
      .map(a => ({
        name: a.candidate_name || 'Unknown',
        email: a.email,
        score: a.ai_score || 0,
        keyStrengths: extractSkills(a.parsed_resume_json).slice(0, 3),
        reasoning: a.reasoning || 'No reasoning provided'
      })),
    roleFitAnalysis: `Average score: ${avgScore.toFixed(1)}/100. ${shortlisted.length} candidates meet the minimum requirements.`,
    gapsInPool: 'AI analysis not available. Manual review recommended.',
    recommendations: [
      'Review shortlisted candidates for final interview selection',
      'Consider flagged candidates for alternative roles',
      'Schedule interviews with top candidates'
    ]
  }
}

