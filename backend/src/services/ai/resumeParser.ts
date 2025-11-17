import OpenAI from 'openai'

type ParsedResume = {
  personal?: { name?: string; email?: string; phone?: string }
  education?: Array<{ school?: string; degree?: string; year?: string }>
  experience?: Array<{ company?: string; role?: string; start?: string; end?: string; summary?: string }>
  skills?: string[]
  links?: { github?: string; linkedin?: string; portfolio?: string[] }
  awards?: string[]
  projects?: Array<{ name?: string; description?: string; link?: string }>
}

export async function parseResumeText(text: string): Promise<ParsedResume> {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase()
  if (provider !== 'openai') {
    // Extend here for Anthropic if needed
  }
  const apiKey = process.env.OPENAI_API_KEY
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

  const openai = new OpenAI({ apiKey })
  const sys = `You are a resume parsing engine. Extract JSON with keys:
personal{name,email,phone}, education[{school,degree,year}], experience[{company,role,start,end,summary}],
skills[string[]], links{github,linkedin,portfolio[string[]]}, awards[string[]], projects[{name,description,link}].
Return ONLY strict JSON.`

  const prompt = `Resume Text:\n${text}\n---\nExtract the structured JSON now.`

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2
  })

  const content = resp.choices[0]?.message?.content || '{}'
  try {
    return JSON.parse(content) as ParsedResume
  } catch {
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


