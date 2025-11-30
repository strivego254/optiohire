import { contactSchema } from '@/lib/schemas/contact'

// Note: POST handler is disabled in frontend - contact API uses backend directly
// Tests for POST handler are skipped as the route is not implemented in frontend

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

// POST handler tests are skipped - contact route is disabled in frontend
// Contact form uses backend API directly via NEXT_PUBLIC_BACKEND_URL
describe.skip('POST /api/contact', () => {
  it('skipped - contact route disabled in frontend', () => {
    // Contact API is handled by backend
  })
})

