import { GoogleGenerativeAI } from '@google/generative-ai'

type ParsedResume = {
  personal?: { name?: string; email?: string; phone?: string }
  education?: Array<{ school?: string; degree?: string; year?: string }>
  experience?: Array<{ company?: string; role?: string; start?: string; end?: string; summary?: string }>
  skills?: string[]
  links?: { github?: string; linkedin?: string; portfolio?: string[] }
  awards?: string[]
  projects?: Array<{ name?: string; description?: string; link?: string }>
}

/**
 * Get Gemini API key
 */
function getGeminiApiKey(): string | null {
  return process.env.GEMINI_API_KEY || null
}

export async function parseResumeText(text: string): Promise<ParsedResume> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    // Fallback minimal heuristic parse
    return {
      personal: {},
      skills: [],
      links: {},
      education: [],
      experience: [],
      awards: [],
      projects: []
    }
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = process.env.RESUME_PARSER_MODEL || 'gemini-2.0-flash'
    
    const systemInstruction = `You are a resume parsing engine. Extract JSON with keys:
personal{name,email,phone}, education[{school,degree,year}], experience[{company,role,start,end,summary}],
skills[string[]], links{github,linkedin,portfolio[string[]]}, awards[string[]], projects[{name,description,link}].
Return ONLY strict JSON, no markdown formatting.`

    const prompt = `Resume Text:\n${text}\n---\nExtract the structured JSON now.`

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
    
    return JSON.parse(content) as ParsedResume
  } catch (error) {
    console.error('Gemini resume parsing failed:', error)
    return {
      personal: {},
      skills: [],
      links: {},
      education: [],
      experience: [],
      awards: [],
      projects: []
    }
  }
}


