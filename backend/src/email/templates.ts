import { sendEmail } from './mailer.js'

export async function sendDecisionEmail(opts: { to: string; candidateName: string; status: 'SHORTLIST' | 'FLAG' | 'REJECT'; interviewLink: string | null }) {
  if (opts.status === 'REJECT') {
    await sendEmail({
      to: opts.to,
      subject: 'Application Update',
      text: `Hi ${opts.candidateName},\n\nThank you for applying. After review, we will not be moving forward at this time.\n\nBest regards,\nHirebit`
    })
  } else if (opts.status === 'FLAG') {
    // Notify candidate softly or skip; here we send acknowledgement without decision
    await sendEmail({
      to: opts.to,
      subject: 'Application Received',
      text: `Hi ${opts.candidateName},\n\nThanks for applying. Your application is under review.\n\nBest,\nHirebit`
    })
  } else {
    await sendEmail({
      to: opts.to,
      subject: 'You are shortlisted',
      text: `Hi ${opts.candidateName},\n\nGreat news! You've been shortlisted.\n${opts.interviewLink ? `Please join: ${opts.interviewLink}\n` : ''}\nBest,\nHirebit`
    })
  }
}


