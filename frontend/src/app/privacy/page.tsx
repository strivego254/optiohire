'use client'

import { motion } from 'framer-motion'
import { ShieldCheck, Lock, Eye, FileText, Mail } from 'lucide-react'
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="text-[#3ca2fa] hover:text-[#3ca2fa]/80 transition-colors font-figtree">
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Title Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#3ca2fa]/20 mb-6">
              <ShieldCheck className="w-8 h-8 text-[#3ca2fa]" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extralight font-figtree mb-4">
              Privacy Policy
            </h1>
            <p className="text-gray-400 font-figtree">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Content Sections */}
          <div className="space-y-8 font-figtree">
            {/* Introduction */}
            <section className="prose prose-invert max-w-none">
              <p className="text-gray-300 leading-relaxed">
                At OptioHire, we are committed to protecting your privacy and ensuring the security of your personal information. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
                AI-powered recruitment platform.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-[#3ca2fa]" />
                <h2 className="text-2xl font-light">Information We Collect</h2>
              </div>
              <div className="bg-white/5 rounded-lg p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Personal Information</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                    <li>Name, email address, phone number, and contact information</li>
                    <li>Company information and job titles</li>
                    <li>Resume, CV, and professional background information</li>
                    <li>Interview notes and assessment results</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Usage Data</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                    <li>IP address, browser type, and device information</li>
                    <li>Pages visited, features used, and time spent on the platform</li>
                    <li>Search queries and interaction patterns</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Information */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Eye className="w-6 h-6 text-[#3ca2fa]" />
                <h2 className="text-2xl font-light">How We Use Your Information</h2>
              </div>
              <div className="bg-white/5 rounded-lg p-6">
                <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                  <li>To provide and improve our AI-powered recruitment services</li>
                  <li>To match candidates with job opportunities</li>
                  <li>To communicate with you about your account and our services</li>
                  <li>To analyze usage patterns and enhance platform functionality</li>
                  <li>To comply with legal obligations and protect our rights</li>
                  <li>To send you updates, newsletters, and marketing communications (with your consent)</li>
                </ul>
              </div>
            </section>

            {/* Data Security */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-6 h-6 text-[#3ca2fa]" />
                <h2 className="text-2xl font-light">Data Security</h2>
              </div>
              <div className="bg-white/5 rounded-lg p-6">
                <p className="text-gray-300 leading-relaxed mb-4">
                  We implement industry-standard security measures to protect your personal information:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security audits and penetration testing</li>
                  <li>Access controls and authentication mechanisms</li>
                  <li>Secure data storage and backup procedures</li>
                  <li>GDPR-compliant data handling practices</li>
                </ul>
              </div>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-2xl font-light mb-4">Data Sharing and Disclosure</h2>
              <div className="bg-white/5 rounded-lg p-6">
                <p className="text-gray-300 leading-relaxed mb-4">
                  We do not sell your personal information. We may share your information only in the following circumstances:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                  <li>With employers and hiring managers for job matching purposes</li>
                  <li>With service providers who assist in platform operations (under strict confidentiality agreements)</li>
                  <li>When required by law or to protect our legal rights</li>
                  <li>With your explicit consent</li>
                </ul>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-light mb-4">Your Privacy Rights</h2>
              <div className="bg-white/5 rounded-lg p-6">
                <p className="text-gray-300 leading-relaxed mb-4">
                  You have the following rights regarding your personal information:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                  <li><strong>Portability:</strong> Receive your data in a portable format</li>
                  <li><strong>Objection:</strong> Object to certain processing activities</li>
                  <li><strong>Withdrawal:</strong> Withdraw consent for data processing</li>
                </ul>
              </div>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-light mb-4">Cookies and Tracking Technologies</h2>
              <div className="bg-white/5 rounded-lg p-6">
                <p className="text-gray-300 leading-relaxed">
                  We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, 
                  and improve our services. You can control cookie preferences through your browser settings.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-light mb-4">Contact Us</h2>
              <div className="bg-white/5 rounded-lg p-6">
                <p className="text-gray-300 leading-relaxed mb-4">
                  If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact us:
                </p>
                <div className="flex items-center gap-3 text-gray-300">
                  <Mail className="w-5 h-5 text-[#3ca2fa]" />
                  <a 
                    href="mailto:hirebitapplications@gmail.com" 
                    className="text-[#3ca2fa] hover:text-[#3ca2fa]/80 transition-colors"
                  >
                    hirebitapplications@gmail.com
                  </a>
                </div>
              </div>
            </section>

            {/* Updates */}
            <section>
              <h2 className="text-2xl font-light mb-4">Updates to This Policy</h2>
              <div className="bg-white/5 rounded-lg p-6">
                <p className="text-gray-300 leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by 
                  posting the new policy on this page and updating the "Last updated" date. Your continued use of our 
                  platform after such changes constitutes acceptance of the updated policy.
                </p>
              </div>
            </section>
          </div>

          {/* Footer Note */}
          <div className="mt-12 pt-8 border-t border-white/10 text-center">
            <p className="text-gray-400 text-sm font-figtree">
              This privacy policy is effective as of {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
