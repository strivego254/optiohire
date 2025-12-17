import type { Metadata } from 'next'
import { Figtree } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/hooks/use-auth'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { ConditionalLayout } from '@/components/layout/conditional-layout'
import { CookieConsent } from '@/components/ui/cookie-consent'
import { CookieProvider } from '@/components/providers/cookie-provider'
import { ErrorBoundary } from '@/components/ui/error-boundary'

const figtree = Figtree({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-figtree',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
  fallback: ['system-ui', 'arial'],
})

// Get metadata base URL - prioritize NEXT_PUBLIC_APP_URL, then VERCEL_URL, fallback to localhost
const getMetadataBase = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return new URL(process.env.NEXT_PUBLIC_APP_URL)
  }
  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`)
  }
  return new URL('http://localhost:3000')
}

const baseMetadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: 'AI-Powered Recruitment Platform | OptioHire',
  description: 'Transform your hiring process with AI-powered recruitment platform. Hire 5x faster with 95% accuracy using intelligent automation, advanced analytics, and bias-free candidate screening.',
  keywords: ['AI recruitment', 'automated hiring', 'candidate screening', 'HR technology', 'recruitment software', 'hiring automation', 'talent acquisition', 'AI-powered HR'],
  authors: [{ name: 'OptioHire Team' }],
  icons: {
    icon: '/assets/logo/white-logo.png',
    shortcut: '/assets/logo/white-logo.png',
    apple: '/assets/logo/white-logo.png',
  },
  openGraph: {
    title: 'AI-Powered Recruitment Platform | OptioHire',
    description: 'Transform your hiring process with AI-powered recruitment platform. Hire 5x faster with 95% accuracy using intelligent automation and advanced analytics.',
    type: 'website',
    siteName: 'OptioHire',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI-Powered Recruitment Platform',
    description: 'Transform your hiring process with AI-powered recruitment platform. Hire 5x faster with 95% accuracy.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export function generateMetadata(): Metadata {
  return baseMetadata
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2D2DDD',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={figtree.variable} suppressHydrationWarning>
      <head>
        {/* Favicon */}
<link rel="icon" href="/assets/logo/white-logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/assets/logo/white-logo.png" />

        {/* Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        {/* Prefetch critical routes */}
        <link rel="prefetch" href="/auth/signin" />
        <link rel="prefetch" href="/auth/signup" />
        {/* Preload critical assets */}
        <link rel="preload" href="/assets/logo/white-logo.png" as="image" type="image/png" />
        {/* Performance hints */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className={`${figtree.className} antialiased bg-background text-foreground`} suppressHydrationWarning>
        <ThemeProvider>
          <CookieProvider>
            <AuthProvider>
              <ErrorBoundary>
                <div className="min-h-screen bg-background">
                  <ConditionalLayout>{children}</ConditionalLayout>
                  <CookieConsent />
                </div>
              </ErrorBoundary>
            </AuthProvider>
          </CookieProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
