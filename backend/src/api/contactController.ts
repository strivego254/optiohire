import type { Request, Response } from 'express'
import { query } from '../db/index.js'

export async function createContact(req: Request, res: Response) {
  try {
    const { fullName, email, company, role, topic, message } = req.body || {}
    if (!fullName || !email || !company || !role || !topic || !message) {
      return res.status(422).json({ message: 'Invalid contact submission.' })
    }
    await query(
      `insert into audit_logs (action, metadata)
       values ('CONTACT_REQUEST', $1::jsonb)`,
      [JSON.stringify({ fullName, email, company, role, topic, message })]
    )
    return res.status(201).json({ message: 'Contact request received.' })
  } catch (err) {
    return res.status(500).json({ message: 'Unexpected server error.' })
  }
}


