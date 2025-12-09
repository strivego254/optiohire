/**
 * Cleans job title by removing common prefixes and suffixes
 * Examples:
 * - "Application For Software Development Role At METRO" -> "Software Development"
 * - "Software Development Role at METRO" -> "Software Development"
 */
export function cleanJobTitle(jobTitle: string): string {
  if (!jobTitle) return jobTitle

  let cleaned = jobTitle.trim()

  // Remove "Application For" prefix (case-insensitive)
  cleaned = cleaned.replace(/^Application\s+For\s+/i, '')

  // Remove "Role at [COMPANY]" or "Role At [COMPANY]" suffix (matches any text after "Role at/At")
  cleaned = cleaned.replace(/\s+Role\s+[Aa]t\s+.+$/i, '')

  // Remove "At [COMPANY]" suffix (case-insensitive, matches any text after "At")
  cleaned = cleaned.replace(/\s+[Aa]t\s+.+$/i, '')

  return cleaned.trim()
}
