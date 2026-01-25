import { POST } from '@/app/api/contact/route'
import { contactSchema } from '@/lib/schemas/contact'
import { supabaseAdmin } from '@/lib/supabase'

jest.mock('@/lib/supabase', () => {
  const actual = jest.requireActual('@/lib/supabase')

  const mockClient = {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue({ error: null }),
  }

  return {
    ...actual,
    supabaseAdmin: mockClient,
  }
})

type MockSupabaseClient = {
  from: jest.MockedFunction<(table: string) => MockSupabaseClient>
  insert: jest.MockedFunction<(payload: unknown) => Promise<{ error: null | { message: string } }>>
}

const mockSupabaseAdmin = supabaseAdmin as unknown as MockSupabaseClient | null

describe('contactSchema', () => {
  it('accepts valid payload', () => {
    const payload = {
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      company: 'Acme Inc.',
      role: 'Head of Talent',
      topic: 'Enterprise onboarding',
      message: 'We would love to learn more about your AI hiring tools.',
    }

    const result = contactSchema.safeParse(payload)
    expect(result.success).toBe(true)
  })

  it('rejects invalid payload', () => {
    const payload = {
      fullName: 'J',
      email: 'invalid-email',
      company: 'A',
      role: 'H',
      topic: 'AI',
      message: 'Too short',
    }

    const result = contactSchema.safeParse(payload)
    expect(result.success).toBe(false)
  })
})

describe('POST /api/contact', () => {
  beforeEach(() => {
    if (!mockSupabaseAdmin) {
      throw new Error('supabaseAdmin mock not provided')
    }
    mockSupabaseAdmin.from.mockClear()
    mockSupabaseAdmin.insert.mockClear()
  })

  it('persists valid submission', async () => {
    const payload = {
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      company: 'Acme Inc.',
      role: 'Head of Talent',
      topic: 'Enterprise onboarding',
      message: 'We would love to learn more about your AI hiring tools.',
    }

    const request = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const response = await POST(request)

    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body).toEqual({ message: 'Contact request received.' })
    if (!mockSupabaseAdmin) {
      throw new Error('supabaseAdmin mock not provided')
    }
    expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('contact_requests')
    expect(mockSupabaseAdmin.insert).toHaveBeenCalledWith({
      full_name: payload.fullName,
      email: payload.email,
      company: payload.company,
      role: payload.role,
      topic: payload.topic,
      message: payload.message,
    })
  })

  it('returns validation error for invalid submission', async () => {
    const payload = {
      fullName: 'J',
      email: 'invalid',
      company: 'A',
      role: 'H',
      topic: 'AI',
      message: 'short',
    }

    const request = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const response = await POST(request)
    expect(response.status).toBe(422)
  })
})

