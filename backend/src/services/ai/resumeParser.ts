import Groq from 'groq-sdk'

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
 * Get Groq API key
 */
function getGroqApiKey(): string | null {
  return process.env.GROQ_API_KEY || null
}

export async function parseResumeText(text: string): Promise<ParsedResume> {
  const apiKey = getGroqApiKey()
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
    const groq = new Groq({ apiKey })
    const model = process.env.RESUME_PARSER_MODEL || 'llama-3.3-70b-versatile'
    
    const systemMessage = `You are a resume parsing engine. Extract JSON with keys:
personal{name,email,phone}, education[{school,degree,year}], experience[{company,role,start,end,summary}],
skills[string[]], links{github,linkedin,portfolio[string[]]}, awards[string[]], projects[{name,description,link}].
Return ONLY strict JSON, no markdown formatting.`

    const prompt = `Resume Text:\n${text}\n---\nExtract the structured JSON now.`

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt }
      ],
      model: model,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
    
    const content = completion.choices[0]?.message?.content || '{}'
    return JSON.parse(content) as ParsedResume
  } catch (error) {
    console.error('Groq resume parsing failed:', error)
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


