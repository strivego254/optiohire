import { query } from '../db/index.js'

export interface Company {
  company_id: string
  company_name: string
  company_email: string | null
  company_domain: string | null
  hr_email: string
  created_at: string
}

export class CompanyRepository {
  async findByEmail(email: string): Promise<Company | null> {
    const { rows } = await query<Company>(
      `SELECT company_id, company_name, company_email, company_domain, hr_email, created_at
       FROM companies
       WHERE company_email = $1 OR hr_email = $1
       LIMIT 1`,
      [email]
    )
    return rows[0] || null
  }

  async findByName(name: string): Promise<Company | null> {
    // Try exact match first
    const { rows: exactRows } = await query<Company>(
      `SELECT company_id, company_name, company_email, company_domain, hr_email, created_at
       FROM companies
       WHERE company_name = $1
       LIMIT 1`,
      [name]
    )
    if (exactRows[0]) return exactRows[0]

    // Try case-insensitive match
    const { rows: caseRows } = await query<Company>(
      `SELECT company_id, company_name, company_email, company_domain, hr_email, created_at
       FROM companies
       WHERE LOWER(company_name) = LOWER($1)
       LIMIT 1`,
      [name]
    )
    if (caseRows[0]) return caseRows[0]

    // Try partial match (contains)
    const { rows: partialRows } = await query<Company>(
      `SELECT company_id, company_name, company_email, company_domain, hr_email, created_at
       FROM companies
       WHERE LOWER(company_name) LIKE LOWER($1)
       LIMIT 1`,
      [`%${name}%`]
    )
    if (partialRows[0]) return partialRows[0]

    return null
  }

  async create(data: {
    company_name: string
    company_email: string
    hr_email: string
  }): Promise<Company> {
    const { rows } = await query<Company>(
      `INSERT INTO companies (company_name, company_email, hr_email)
       VALUES ($1, $2, $3)
       ON CONFLICT (company_name) DO UPDATE SET
         company_email = EXCLUDED.company_email,
         hr_email = EXCLUDED.hr_email
       RETURNING company_id, company_name, company_email, hr_email, created_at`,
      [data.company_name, data.company_email, data.hr_email]
    )
    return rows[0]
  }

  async findById(id: string): Promise<Company | null> {
    const { rows } = await query<Company>(
      `SELECT company_id, company_name, company_email, company_domain, hr_email, created_at
       FROM companies
       WHERE company_id = $1
       LIMIT 1`,
      [id]
    )
    return rows[0] || null
  }
}

