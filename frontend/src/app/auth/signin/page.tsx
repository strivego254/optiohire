'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/use-auth'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import AnimatedShaderBackground from '@/components/ui/animated-shader-background'

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type SignInFormData = z.infer<typeof signInSchema>

export default function SignInPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  })

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await signIn(data.email, data.password)
      
      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full min-h-screen bg-black flex items-start justify-center p-4 pt-14 pb-8 relative">
      <AnimatedShaderBackground />
      <div className="relative w-full max-w-5xl mt-6">
        {/* Top Center Button - Positioned above border line */}
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-30">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-white rounded-full flex items-center gap-2 hover:bg-gray-100 transition-all text-gray-900 font-figtree text-sm shadow-lg border border-gray-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Return Back
          </button>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row w-full min-h-[600px] max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden border border-white relative z-10"
        >
          {/* Left Panel */}
          <div className="flex-1 relative overflow-hidden hidden md:block">
            <div className="absolute inset-0">
            <Image
              src="/assets/images/modern logo image (2).png"
              alt="HR Recruitment"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>

          {/* Right Panel */}
          <div className="flex-1 p-8 flex flex-col justify-center relative overflow-y-auto backdrop-blur-xl bg-white/80 border-l border-white/20">
            {/* Glassmorphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/30 to-white/20 pointer-events-none rounded-r-3xl" />

            <div className="relative z-10">
          <div className="mb-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extralight font-figtree leading-[1.05] tracking-tight text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600 font-figtree">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                Create one
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 font-figtree">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                placeholder="Email Address"
                {...register('email')}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-figtree bg-white text-gray-900 placeholder-gray-500 text-sm"
                required
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1 font-figtree">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 font-figtree">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="Password"
                  {...register('password')}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-figtree bg-white text-gray-900 placeholder-gray-500 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-500" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500 mt-1 font-figtree">{errors.password.message}</p>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 font-figtree">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white py-3 px-4 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-figtree"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
          </div>
        </div>
      </motion.div>
      </div>
    </div>
  )
}
