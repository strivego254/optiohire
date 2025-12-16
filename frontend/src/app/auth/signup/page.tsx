'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/use-auth'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'

const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  company_role: z.enum(['hr', 'hiring_manager'], {
    errorMap: () => ({ message: 'Please select your role in the company' })
  }),
  organization_name: z.string().min(2, 'Organization name must be at least 2 characters').max(255, 'Organization name is too long'),
  company_email: z.string().email('Please enter a valid company email address'),
  hiring_manager_email: z.string().email('Please enter a valid hiring manager email address'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignUpFormData = z.infer<typeof signUpSchema>

export default function SignUpPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  })

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await signUp(
        data.name,
        data.email, 
        data.password, 
        data.company_role,
        data.organization_name, 
        data.company_email, 
        data.hiring_manager_email
      )
      
      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }
      
      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Redirect to dashboard directly (company is already created)
      router.push('/dashboard')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.'
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 flex items-start justify-center p-4 py-8">
      <div className="w-full max-w-4xl flex items-start gap-4">
        {/* Left Aligned Button */}
        <div className="flex-shrink-0 pt-2">
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
          className="flex-1 max-w-md bg-white rounded-3xl shadow-2xl border border-gray-200 relative z-10 max-h-[calc(100vh-4rem)] overflow-y-auto"
        >
          {/* Create Account Form Card */}
          <div className="p-8 flex flex-col">
            <div className="mb-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extralight font-figtree leading-[1.05] tracking-tight text-gray-900 mb-2">Create an Account</h1>
            <p className="text-gray-600 font-figtree">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700 font-medium">
                Log in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2 font-figtree">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                placeholder="Enter your full name"
                {...register('name')}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-figtree bg-white text-gray-900 placeholder-gray-500 text-sm"
                required
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1 font-figtree">{errors.name.message}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 font-figtree">
                Email Address <span className="text-red-500">*</span>
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
              <p className="text-xs text-gray-500 mt-1 font-figtree">
                Password must contain: uppercase, lowercase, number, special character, and be at least 8 characters
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2 font-figtree">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  placeholder="Confirm Password"
                  {...register('confirmPassword')}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-figtree bg-white text-gray-900 placeholder-gray-500 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-500" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500 mt-1 font-figtree">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Company Information Section */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 font-figtree">Company Information</h3>
              
              {/* Company Role Field */}
              <div className="mb-4">
                <label htmlFor="company_role" className="block text-sm font-medium text-gray-700 mb-2 font-figtree">
                  Your Role in Company <span className="text-red-500">*</span>
                </label>
                <select
                  id="company_role"
                  {...register('company_role')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-figtree bg-white text-gray-900 text-sm"
                  required
                >
                  <option value="">Select your role</option>
                  <option value="hr">HR Manager</option>
                  <option value="hiring_manager">Hiring Manager</option>
                </select>
                {errors.company_role && (
                  <p className="text-sm text-red-500 mt-1 font-figtree">{errors.company_role.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1 font-figtree">
                  Select your role in the company
                </p>
              </div>
              
              {/* Organization Name Field */}
              <div className="mb-4">
                <label htmlFor="organization_name" className="block text-sm font-medium text-gray-700 mb-2 font-figtree">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="organization_name"
                  placeholder="Enter your organization name"
                  {...register('organization_name')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-figtree bg-white text-gray-900 placeholder-gray-500 text-sm"
                  required
                />
                {errors.organization_name && (
                  <p className="text-sm text-red-500 mt-1 font-figtree">{errors.organization_name.message}</p>
                )}
              </div>

              {/* Company Email Field */}
              <div className="mb-4">
                <label htmlFor="company_email" className="block text-sm font-medium text-gray-700 mb-2 font-figtree">
                  Company Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="company_email"
                  placeholder="company@example.com"
                  {...register('company_email')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-figtree bg-white text-gray-900 placeholder-gray-500 text-sm"
                  required
                />
                {errors.company_email && (
                  <p className="text-sm text-red-500 mt-1 font-figtree">{errors.company_email.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1 font-figtree">
                  This will be used for company communications and job postings
                </p>
              </div>

              {/* Hiring Manager Email Field */}
              <div>
                <label htmlFor="hiring_manager_email" className="block text-sm font-medium text-gray-700 mb-2 font-figtree">
                  Hiring Manager Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="hiring_manager_email"
                  placeholder="hiring.manager@example.com"
                  {...register('hiring_manager_email')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-figtree bg-white text-gray-900 placeholder-gray-500 text-sm"
                  required
                />
                {errors.hiring_manager_email && (
                  <p className="text-sm text-red-500 mt-1 font-figtree">{errors.hiring_manager_email.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1 font-figtree">
                  Email address of the hiring manager
                </p>
              </div>
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
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </motion.div>
      </div>
    </div>
  )
}
