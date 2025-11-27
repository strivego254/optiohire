import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Cleans candidate name by removing quotes and email address
 * Example: '"fidelochieng ogola" <fidelochiengogola@gmail.com>' -> 'fidelochieng ogola'
 */
export function cleanCandidateName(name: string | null | undefined): string {
  if (!name) return 'Unknown'
  
  // Remove email part if present (everything after <)
  let cleaned = name.split('<')[0].trim()
  
  // Remove quotes from beginning and end
  cleaned = cleaned.replace(/^["']|["']$/g, '').trim()
  
  return cleaned || 'Unknown'
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'Not set'
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return 'Invalid date'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj)
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return 'Not set'
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return 'Invalid date'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj)
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
