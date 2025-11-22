'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('Auth error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
        <div className="flex justify-center mb-4">
          <AlertCircle className="w-16 h-16 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2 font-figtree">
          Authentication Error
        </h2>
        <p className="text-gray-600 mb-6 font-figtree">
          {error.message || 'An error occurred during authentication'}
        </p>
        <div className="flex flex-col gap-3">
          <Button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 bg-black text-white hover:bg-gray-800 font-figtree"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="w-full flex items-center justify-center gap-2 font-figtree"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </Button>
        </div>
      </div>
    </div>
  )
}

