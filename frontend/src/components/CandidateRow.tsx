'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, cleanCandidateName } from '@/lib/utils'

export interface Candidate {
  id: string
  candidate_name: string
  email: string
  score: number | null
  status: string
  interview_time: string | null
  interview_link: string | null
  interview_status?: string | null
}

interface CandidateRowProps {
  candidate: Candidate
  onScheduleClick: (candidate: Candidate) => void
  onRowClick: (candidate: Candidate) => void
}

export function CandidateRow({ candidate, onScheduleClick, onRowClick }: CandidateRowProps) {
  const getStatusVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SHORTLIST':
      case 'SHORTLISTED':
        return 'shortlisted'
      case 'FLAG':
      case 'FLAGGED':
        return 'flagged'
      case 'REJECT':
      case 'REJECTED':
        return 'rejected'
      default:
        return 'info'
    }
  }

  const isShortlisted = candidate.status.toUpperCase() === 'SHORTLIST' || candidate.status.toUpperCase() === 'SHORTLISTED'

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer',
        'grid grid-cols-12 gap-4'
      )}
      onClick={() => onRowClick(candidate)}
    >
      <div className="col-span-4">
        <div className="font-semibold text-gray-900 dark:text-white">
          {cleanCandidateName(candidate.candidate_name)}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {candidate.email}
        </div>
      </div>

      <div className="col-span-2 text-center">
        {candidate.score !== null ? (
          <div className="text-2xl font-bold text-primary">
            {Math.round(candidate.score)}
          </div>
        ) : (
          <div className="text-sm text-gray-400">N/A</div>
        )}
      </div>

      <div className="col-span-3">
        <Badge variant={getStatusVariant(candidate.status)}>
          {candidate.status}
        </Badge>
      </div>

      <div className="col-span-3 text-right">
        {isShortlisted && (
          <Button
            onClick={(e) => {
              e.stopPropagation()
              onScheduleClick(candidate)
            }}
            size="sm"
          >
            Schedule
          </Button>
        )}
      </div>
    </div>
  )
}

