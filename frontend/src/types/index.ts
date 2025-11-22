export interface Company {
  id: string
  created_at: string
  company_name: string
  company_email: string
  hr_email: string
  user_id: string
}

export interface JobPosting {
  id: string
  created_at: string
  company_id: string
  company_name: string
  company_email: string
  hr_email: string
  job_title: string
  job_description: string
  required_skills: string[]
  interview_meeting_link: string | null
  interview_start_time: string | null
  application_deadline: string | null
  status: 'active' | 'paused' | 'closed'
  n8n_webhook_sent: boolean
  google_calendar_link?: string | null
}

export interface Applicant {
  id: string
  created_at: string
  job_posting_id: string
  email: string
  name: string | null
  cv_url: string | null
  matching_score: number | null
  status: 'pending' | 'shortlisted' | 'rejected' | 'flagged'
  ai_reasoning: string | null
  processed_at: string | null
}

export interface RecruitmentAnalytics {
  id: string
  created_at: string
  job_posting_id: string
  total_applicants: number
  total_shortlisted: number
  total_rejected: number
  total_flagged: number
  ai_overall_analysis: string | null
  processing_status: 'in_progress' | 'finished' | 'processing'
  last_updated: string
}

export interface JobPostingFormData {
  company_name: string
  company_email: string
  hr_email: string
  job_title: string
  job_description: string
  required_skills: string[]
  interview_meeting_link?: string
  application_deadline?: string
}

export interface WebhookPayload {
  job_posting_id: string
  company_id: string
  company_name: string
  company_email: string
  hr_email: string
  job_title: string
  job_description: string
  required_skills: string[]
  interview_meeting_link?: string
  application_deadline?: string
}

// Real candidate data structure from n8n workflow
export interface N8NCandidateData {
  candidate_name: string
  email: string
  score: number
  status: 'SHORTLIST' | 'REJECT' | 'FLAG TO HR'
  interview_meeting_link?: string
  calendar_link?: string
  company_name: string
  company_email_address: string
  reasoning: string
}

export interface N8NResponsePayload {
  job_posting_id: string
  total_applicants: number
  total_shortlisted: number
  total_rejected: number
  total_flagged: number
  ai_overall_analysis: string
  processing_status: 'in_progress' | 'finished' | 'processing'
  applicants: Array<{
    email: string
    name?: string
    matching_score: number
    status: 'shortlisted' | 'rejected' | 'flagged'
    ai_reasoning: string
  }>
  // Real candidate data from n8n workflow
  candidates?: N8NCandidateData[]
}
