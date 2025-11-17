type ParsedResume = {
  skills?: string[]
  experience?: Array<{ company?: string; role?: string; summary?: string }>
}

type JobRequirements = {
  jobTitle: string
  description: string
  responsibilities: string
  skills: string[]
}

export async function scoreCandidate(parsed: ParsedResume, job: JobRequirements): Promise<{ score: number; status: 'SHORTLIST' | 'FLAG' | 'REJECT'; reasoning: string }> {
  const resumeSkills = (parsed.skills || []).map((s) => s.toLowerCase())
  const required = (job.skills || []).map((s) => s.toLowerCase())
  let matches = 0

  for (const skill of required) {
    if (resumeSkills.includes(skill)) matches++
  }

  const skillCoverage = required.length ? (matches / required.length) : 0
  // Simple heuristic combining skill match with presence of experience
  const expWeight = (parsed.experience && parsed.experience.length > 0) ? 0.2 : 0
  const score = Math.round((skillCoverage * 0.8 + expWeight) * 100)

  let status: 'SHORTLIST' | 'FLAG' | 'REJECT'
  if (score >= 80) status = 'SHORTLIST'
  else if (score >= 50) status = 'FLAG'
  else status = 'REJECT'

  const reasoning = `Matched ${matches}/${required.length} required skills. Experience weight ${expWeight * 100}%.`
  return { score, status, reasoning }
}


