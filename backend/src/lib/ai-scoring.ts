import OpenAI from 'openai'

export interface ScoringResult {
  score: number // 0-100
  status: 'SHORTLIST' | 'FLAGGED' | 'REJECTED'
  reasoning: string
}

export interface ScoringInput {
  jobDescription: string
  requiredSkills: string[]
  candidateCVText: string
  extractedSkills?: string[]
}

export class AIScoringEngine {
  private openai: OpenAI | null = null

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY
    if (apiKey) {
      this.openai = new OpenAI({ apiKey })
    }
  }

  /**
   * Score a candidate using AI
   */
  async scoreCandidate(input: ScoringInput): Promise<ScoringResult> {
    const model = process.env.SCORING_MODEL || process.env.RESUME_PARSER_MODEL || 'gpt-4o'

    if (!this.openai) {
      // Fallback to rule-based scoring
      return this.fallbackScoring(input)
    }

    try {
      const prompt = this.buildScoringPrompt(input)
      
      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert HR recruiter. Analyze candidates and provide scores (0-100), status (SHORTLIST/FLAGGED/REJECTED), and detailed reasoning. Always return valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0]?.message?.content || '{}'
      const parsed = JSON.parse(content) as { score: number; status: string; reasoning: string }

      // Validate and normalize
      const score = Math.max(0, Math.min(100, Math.round(parsed.score)))
      let status: 'SHORTLIST' | 'FLAGGED' | 'REJECTED' = 'REJECTED'
      
      if (score >= 80) status = 'SHORTLIST'
      else if (score >= 50) status = 'FLAGGED'
      else status = 'REJECTED'

      return {
        score,
        status,
        reasoning: parsed.reasoning || 'No reasoning provided'
      }
    } catch (error) {
      console.error('AI scoring failed, using fallback:', error)
      return this.fallbackScoring(input)
    }
  }

  private buildScoringPrompt(input: ScoringInput): string {
    return `Analyze this candidate for the job position.

JOB DESCRIPTION:
${input.jobDescription}

REQUIRED SKILLS:
${input.requiredSkills.join(', ')}

CANDIDATE CV TEXT:
${input.candidateCVText.substring(0, 3000)}${input.candidateCVText.length > 3000 ? '...' : ''}

${input.extractedSkills && input.extractedSkills.length > 0 ? `
EXTRACTED SKILLS FROM CV:
${input.extractedSkills.join(', ')}
` : ''}

Evaluate the candidate and return JSON with:
{
  "score": <number 0-100>,
  "status": "SHORTLIST" | "FLAGGED" | "REJECTED",
  "reasoning": "<detailed explanation of why this score and status>"
}

Scoring guidelines:
- 80-100: SHORTLIST (strong match, meets most requirements)
- 50-79: FLAGGED (partial match, needs review)
- 0-49: REJECTED (poor match, doesn't meet requirements)

Consider: skill match, experience relevance, education, overall fit.`
  }

  private fallbackScoring(input: ScoringInput): ScoringResult {
    const cvText = input.candidateCVText.toLowerCase()
    const requiredSkills = input.requiredSkills.map(s => s.toLowerCase())
    
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

    // Determine status
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

