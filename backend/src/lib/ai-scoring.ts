import { GoogleGenerativeAI } from '@google/generative-ai'
import { logger } from '../utils/logger.js'

export interface ScoringResult {
  score: number // 0-100
  status: 'SHORTLIST' | 'FLAGGED' | 'REJECTED'
  reasoning: string // transparent explanation
}

export interface ScoringInput {
  job: {
    title: string
    description: string
    required_skills: string[]
  }
  company: {
    company_name: string
    company_domain?: string | null
    company_email?: string | null
    hr_email?: string | null
    hiring_manager_email?: string | null
    settings?: any // jsonb settings
  }
  cvText: string
}

export class AIScoringEngine {
  private geminiClient: GoogleGenerativeAI | null = null
  private useGemini: boolean = false

  constructor() {
    // Initialize Gemini
    const geminiKey = this.getGeminiApiKey()
    if (geminiKey) {
      this.geminiClient = new GoogleGenerativeAI(geminiKey)
      this.useGemini = true
      logger.info('Gemini API initialized successfully for AI scoring')
    } else {
      this.useGemini = false
      logger.warn('No Gemini API key found, will use fallback rule-based scoring')
    }
  }

  /**
   * Get Gemini API key
   */
  private getGeminiApiKey(): string | null {
    return process.env.GEMINI_API_KEY || null
  }

  /**
   * Build comprehensive system instruction with company context
   * Based on production AI recruitment assistant framework with 35+ years domain knowledge
   */
  private buildSystemInstruction(input: ScoringInput): string {
    const company = input.company
    const companyContext = company.company_name 
      ? `You are an expert AI recruitment assistant with 35+ years of domain knowledge in candidate evaluation, talent acquisition, and fair hiring practices. You are working for ${company.company_name}${company.company_domain ? ` (${company.company_domain})` : ''}. `
      : 'You are an expert AI recruitment assistant with 35+ years of domain knowledge in candidate evaluation, talent acquisition, and fair hiring practices. '
    
    return `${companyContext}Your role is to provide objective, comprehensive candidate assessments that support data-driven hiring decisions while ensuring fairness, consistency, and compliance.

COMPANY CONTEXT:
- Company Name: ${company.company_name || 'Not specified'}
${company.company_domain ? `- Company Domain: ${company.company_domain}` : ''}
${company.company_email ? `- Company Email: ${company.company_email}` : ''}

PRIMARY OBJECTIVES:
1. Evaluate each candidate's qualifications against specific job requirements (description, title, required skills)
2. Provide actionable recommendations (SHORTLIST, FLAGGED, REJECTED) with clear reasoning
3. Identify both obvious matches and hidden potential through transferable skills analysis
4. Flag edge cases for human review rather than making uncertain rejections
5. Maintain fairness by focusing solely on job-relevant qualifications

SCORING FRAMEWORK (0-100 Points):
- MUST-HAVE REQUIREMENTS (~60 points): Core technical skills, experience level, education/certifications
- NICE-TO-HAVE REQUIREMENTS (~25 points): Preferred skills, bonus certifications, industry experience
- OVERALL FIT (~15 points): Career trajectory, cultural alignment, communication quality

CATEGORIZATION:
- SHORTLIST (80-100): Meets 100% of must-haves, ≥50% nice-to-haves, clear progression, strong communication
- FLAGGED (50-79): Meets ≥79% of must-haves with compensating strengths, transferable skills, addressable gaps, borderline scores
- REJECTED (0-49): Missing multiple critical must-haves, significant misalignment, lacks foundational skills, irrelevant application

FAIRNESS & BIAS MITIGATION:
- Focus exclusively on job-relevant qualifications (ignore name, age indicators, education prestige, location, pictures)
- Value diverse paths: career changers, self-taught developers, bootcamp graduates, alternative credentials
- Don't penalize employment gaps <12 months or those explained by caregiving, education, health, layoffs
- Consider skills-based equivalents: 5 years hands-on experience may equal a formal degree
- Recognize cultural differences in resume formats and communication styles

MODERN HIRING REALITIES (2025):
- Remote work normalization: Geographic location often irrelevant; focus on skills
- AI-assisted applications: Distinguish between AI enhancement (good) vs. generic AI generation (red flag)
- Skills-based hiring: Prioritize demonstrable skills over credentials where appropriate
- Continuous learning: Value recent upskilling more than outdated degrees
- Portfolio over pedigree: Strong GitHub/portfolio may outweigh prestigious education

RED FLAGS (Auto-flag for human review):
- Employment gaps >12 months without explanation
- 3+ jobs in 24 months without clear progression (unless contract work)
- Declining responsibility over time
- Inconsistent timelines or conflicting information
- Generic, unmodified template applications
- Exaggerated claims unsupported by context
- AI-generated content with zero personalization
- Overqualification by 5+ years for role level
- Missing critical information (no contact details, vague dates)

QUALITY INDICATORS (Enhance scores):
- Specific, quantifiable achievements with metrics (%, $, scale)
- Clear career progression with strategic moves
- Continuous learning (certifications, courses, self-study)
- Personalized application showing company/role research
- Relevant side projects, open-source contributions, portfolio
- Leadership examples and initiative-taking
- Problem-solving demonstrations with context and outcome

SPECIAL CASES:
- Career Changers: Focus on transferable skills, recent training, project work, motivation
- Recent Graduates (<2 years): Weight coursework, internships, academic projects, GPA if >3.5
- Senior/Executive: Prioritize strategic thinking, business impact, leadership scope
- Overqualified: Auto-flag if experience exceeds role by 5+ years; assess motivation and retention risk

CORE PRINCIPLES:
- When uncertain, flag for review - false negatives (rejecting good candidates) are worse than false positives
- Default to generosity - if candidate is 60/40 good fit, round up and flag for review
- Be thorough but concise - reasoning should be 3-4 sentences (50-100 words), hitting key points
- Output valid JSON only - no additional text outside JSON structure
- Objectivity above all - consistent, accurate, concise, unbiased analysis

Remember: You are evaluating candidates for ${company.company_name || 'this company'}. Your goal is to identify talent fairly and accurately while ensuring no strong candidate slips through due to rigid criteria.`
  }

  /**
   * Score a candidate using AI
   * Input: { job: { title, description, required_skills }, company: { company_name, ... }, cvText }
   * Output: { score: 0-100, status: "SHORTLIST" | "FLAGGED" | "REJECTED", reasoning: string }
   */
  async scoreCandidate(input: ScoringInput): Promise<ScoringResult> {
    const geminiModelName = process.env.SCORING_MODEL || 'gemini-2.0-flash'

    // Use Gemini for scoring
    if (this.useGemini && this.geminiClient) {
      try {
        logger.info(`Using Gemini model ${geminiModelName} for scoring`)
        const prompt = this.buildScoringPrompt(input)
        const systemInstruction = this.buildSystemInstruction(input)
        
        const model = this.geminiClient.getGenerativeModel({ 
          model: geminiModelName,
          systemInstruction: systemInstruction
        })
        
        const result = await model.generateContent(prompt)
        const response = await result.response
        const content = response.text() || '{}'
        
        // Extract JSON from response (handle markdown code blocks if present)
        let jsonContent = content.trim()
        if (jsonContent.startsWith('```json')) {
          jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        } else if (jsonContent.startsWith('```')) {
          jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
        }
        
        const parsed = JSON.parse(jsonContent) as { score: number; status: string; reasoning: string }

        // Validate and normalize
        const score = Math.max(0, Math.min(100, Math.round(parsed.score)))
        let status: 'SHORTLIST' | 'FLAGGED' | 'REJECTED' = 'REJECTED'
        
        // Mandatory scoring rules
        if (score >= 80) status = 'SHORTLIST'
        else if (score >= 50) status = 'FLAGGED'
        else status = 'REJECTED'

        logger.info(`Scoring successful with Gemini ${geminiModelName}, score: ${score}, status: ${status}`)
        return {
          score,
          status,
          reasoning: parsed.reasoning || 'No reasoning provided'
        }
      } catch (error: any) {
        logger.error(`Gemini scoring failed: ${error?.message || String(error)}, falling back to rule-based scoring`)
      }
    }

    // Fallback to rule-based scoring
    logger.warn('Gemini API not available, using rule-based fallback scoring')
    return this.fallbackScoring(input)
  }

  private buildScoringPrompt(input: ScoringInput): string {
    // Extract FULL CV text - Gemini models support large context windows
    // Using 50,000 characters as a safe limit (approximately 12,500 tokens) to leave room for prompt
    const maxCvLength = 50000
    const cvText = input.cvText.length > maxCvLength 
      ? input.cvText.substring(0, maxCvLength) 
      : input.cvText
    const isTruncated = input.cvText.length > maxCvLength
    
    const company = input.company
    
    return `Evaluate this candidate for ${company.company_name || 'the company'} using the comprehensive framework provided.

JOB DETAILS:
- Job Title: ${input.job.title}
- Job Description: ${input.job.description}
- Required Skills: ${input.job.required_skills.join(', ')}

CANDIDATE CV TEXT (${isTruncated ? `First ${maxCvLength.toLocaleString()} characters - CV was truncated` : 'Complete CV'}):
${cvText}${isTruncated ? `\n\n[Note: CV text was truncated at ${maxCvLength.toLocaleString()} characters. Analyze based on the content provided above.]` : ''}

EVALUATION METHODOLOGY:

STEP 1: INFORMATION EXTRACTION
Extract and structure from the CV:
- Full name, contact information (email, phone)
- Current role, company, employment dates
- Total years of relevant experience (calculate precisely from dates)
- Education (degrees, institutions, graduation years)
- Technical skills with proficiency indicators
- Certifications with issue/expiry dates
- Quantifiable achievements (metrics, impact, scope)
- Career progression pattern and trajectory

STEP 2: REQUIREMENT MATCHING
- Hard Skills: Match technical skills against required/preferred lists, assess proficiency levels, consider recency (skills unused 8+ years may be outdated)
- Experience: Calculate relevant experience (not just total years), assess complexity and scope of past roles, evaluate industry relevance and transferability
- Soft Skills: Infer from achievements (leadership, collaboration, problem-solving), assess communication through application quality, look for indicators in project descriptions

STEP 3: GAP ANALYSIS
Identify:
- Critical gaps: Missing must-have skills that cannot be easily trained
- Bridgeable gaps: Missing skills that are learnable or have transferable equivalents
- Overqualification risks: 5+ years of experience beyond role requirements
- Transferable strengths: Adjacent skills from different contexts
- Growth trajectory: Evidence of continuous learning and skill acquisition

STEP 4: SCORE CALCULATION (0-100)
Apply the scoring framework:
- MUST-HAVE REQUIREMENTS (~60 points): Core technical skills match, experience level alignment, education/certifications
- NICE-TO-HAVE REQUIREMENTS (~25 points): Preferred skills present, bonus certifications, industry experience
- OVERALL FIT (~15 points): Career trajectory, cultural alignment, communication quality

STEP 5: CATEGORIZATION
- SHORTLIST (80-100): Meets 100% of must-haves, ≥50% nice-to-haves, clear progression, strong communication
- FLAGGED (50-79): Meets ≥79% of must-haves with compensating strengths, transferable skills, addressable gaps, borderline scores
- REJECTED (0-49): Missing multiple critical must-haves, significant misalignment, lacks foundational skills, irrelevant application

REASONING GUIDELINES:
Your reasoning must be:
- SPECIFIC: Mention 2-3 strongest matches and 1-2 key gaps with concrete examples from the CV
- ACCURATE: Reference actual qualifications, skills, years of experience, projects, or achievements
- CONCISE: Keep to 3-4 sentences (50-100 words), straight to the point
- HUMAN-LIKE: Write as if explaining to a colleague, not a robot
- Avoid generic statements; use concrete examples from the CV

EXAMPLE OF GOOD REASONING:
"The candidate demonstrates strong alignment with 7 out of 9 required skills for ${company.company_name || 'this role'}, including JavaScript, React, Node.js, and PostgreSQL. They have 3 years of full-stack development experience at TechCorp, where they built a customer portal using React and Node.js - directly relevant to the role. Their Bachelor's in Computer Science aligns well. However, they lack experience with Docker and AWS, which are listed as required. Their GitHub portfolio shows 5 active projects, indicating strong initiative. Overall, this is a solid candidate who meets most requirements but would need training on containerization and cloud platforms."

EXAMPLE OF BAD REASONING (DO NOT DO THIS):
"Partial match with 7/9 required skills. May need additional review."

OUTPUT FORMAT:
Return ONLY valid JSON in this EXACT format (no markdown, no code blocks):
{
  "score": <number 0-100>,
  "status": "SHORTLIST" | "FLAGGED" | "REJECTED",
  "reasoning": "<Your concise, specific reasoning - 3-4 sentences (50-100 words), mention specific skills, experience, and examples from the CV>"
}

QUALITY ASSURANCE:
Before finalizing, verify:
- Score calculation is accurate based on the framework
- Status matches score range (80-100: SHORTLIST, 50-79: FLAGGED, 0-49: REJECTED)
- Reasoning cites specific qualifications from the candidate's CV
- All red flags identified are mentioned or accounted for
- JSON structure is valid and complete
- Any borderline cases (±5 points from threshold) are flagged for review

Remember: When uncertain, flag for review. Default to generosity - if a candidate is 60/40 good fit, round up and flag for review.`
  }


  private fallbackScoring(input: ScoringInput): ScoringResult {
    const cvText = input.cvText.toLowerCase()
    const requiredSkills = input.job.required_skills.map(s => s.toLowerCase())
    
    // Count skill matches
    let skillMatches = 0
    for (const skill of requiredSkills) {
      if (cvText.includes(skill)) {
        skillMatches++
      }
    }

    // Calculate score based on skill match percentage
    const skillMatchRatio = requiredSkills.length > 0 
      ? skillMatches / requiredSkills.length 
      : 0

    // Base score from skill matching (0-70 points)
    let score = Math.round(skillMatchRatio * 70)

    // Bonus points for experience indicators
    const experienceKeywords = ['experience', 'worked', 'years', 'developed', 'implemented', 'managed']
    const hasExperience = experienceKeywords.some(keyword => cvText.includes(keyword))
    if (hasExperience) score += 15

    // Bonus for education
    const educationKeywords = ['degree', 'bachelor', 'master', 'phd', 'university', 'college']
    const hasEducation = educationKeywords.some(keyword => cvText.includes(keyword))
    if (hasEducation) score += 10

    // Cap at 100
    score = Math.min(100, score)

    // Determine status (mandatory rules)
    let status: 'SHORTLIST' | 'FLAGGED' | 'REJECTED'
    let reasoning: string

    if (score >= 80) {
      status = 'SHORTLIST'
      reasoning = `Strong candidate with ${skillMatches}/${requiredSkills.length} required skills matched. Good experience and qualifications.`
    } else if (score >= 50) {
      status = 'FLAGGED'
      reasoning = `Partial match with ${skillMatches}/${requiredSkills.length} required skills. May need additional review.`
    } else {
      status = 'REJECTED'
      reasoning = `Weak match with only ${skillMatches}/${requiredSkills.length} required skills. Does not meet minimum requirements.`
    }

    return { score, status, reasoning }
  }
}

