import {
  combineApplicantMetrics,
  deriveMetricsFromApplicantStatuses,
  extractApplicantMetrics,
  hasApplicantMetricsData,
} from '@/utils/analytics'

describe('extractApplicantMetrics', () => {
  it('normalizes analytics with v2 column names', () => {
    const result = extractApplicantMetrics({
      total_applicants: 10,
      total_applicants_shortlisted: 4,
      total_applicants_rejected: 3,
      total_applicants_flagged_to_hr: 2,
    })

    expect(result).toEqual({
      totalApplicants: 10,
      shortlistedApplicants: 4,
      rejectedApplicants: 3,
      flaggedApplicants: 2,
    })
  })

  it('falls back to legacy column names when v2 fields are missing', () => {
    const result = extractApplicantMetrics({
      total_applicants: 7,
      total_shortlisted: 2,
      total_rejected: 1,
      total_flagged: 3,
    })

    expect(result).toEqual({
      totalApplicants: 7,
      shortlistedApplicants: 2,
      rejectedApplicants: 1,
      flaggedApplicants: 3,
    })
  })

  it('returns zeroed metrics when row is undefined', () => {
    expect(extractApplicantMetrics(undefined)).toEqual({
      totalApplicants: 0,
      shortlistedApplicants: 0,
      rejectedApplicants: 0,
      flaggedApplicants: 0,
    })
  })
})

describe('deriveMetricsFromApplicantStatuses', () => {
  it('aggregates counts by status', () => {
    const metrics = deriveMetricsFromApplicantStatuses([
      { status: 'shortlisted' },
      { status: 'rejected' },
      { status: 'flagged' },
      { status: 'pending' },
      { status: null },
    ])

    expect(metrics).toEqual({
      totalApplicants: 5,
      shortlistedApplicants: 1,
      rejectedApplicants: 1,
      flaggedApplicants: 1,
    })
  })
})

describe('combineApplicantMetrics', () => {
  it('sums fields across metric slices', () => {
    const combined = combineApplicantMetrics(
      { totalApplicants: 2, shortlistedApplicants: 1, flaggedApplicants: 0, rejectedApplicants: 0 },
      { totalApplicants: 3, shortlistedApplicants: 0, flaggedApplicants: 2, rejectedApplicants: 1 }
    )

    expect(combined).toEqual({
      totalApplicants: 5,
      shortlistedApplicants: 1,
      flaggedApplicants: 2,
      rejectedApplicants: 1,
    })
  })
})

describe('hasApplicantMetricsData', () => {
  it('returns true when any metric value is non-zero', () => {
    expect(hasApplicantMetricsData({
      totalApplicants: 0,
      shortlistedApplicants: 0,
      flaggedApplicants: 0,
      rejectedApplicants: 1,
    })).toBe(true)
  })

  it('returns false for empty metrics', () => {
    expect(hasApplicantMetricsData({
      totalApplicants: 0,
      shortlistedApplicants: 0,
      flaggedApplicants: 0,
      rejectedApplicants: 0,
    })).toBe(false)
  })
})

