'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Dribbble,
  Globe,
} from 'lucide-react'
import { FooterBackgroundGradient } from '@/components/ui/hover-footer'

export function Footer() {
  
  // Footer link data - Production ready links
  const footerLinks = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "/features" },
        { label: "How It Works", href: "/#how-it-works" },
        { label: "Dashboard", href: "/dashboard" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "/about" },
        { label: "Contact", href: "/contact" },
        { label: "Support", href: "/contact#support" },
        {
          label: "Get Started",
          href: "/auth/signup",
          pulse: true,
        },
      ],
    },
  ]

  // Contact info data
  const contactInfo = [
    {
      icon: <Mail size={18} className="text-[#3ca2fa]" />,
      text: "hirebitapplications@gmail.com",
      href: "mailto:hirebitapplications@gmail.com",
    },
    {
      icon: <Phone size={18} className="text-[#3ca2fa]" />,
      text: "+254701601126",
      href: "tel:+254701601126",
    },
    {
      icon: <MapPin size={18} className="text-[#3ca2fa]" />,
      text: "Nairobi, Kenya",
    },
  ]

  // Social media icons
  const socialLinks = [
    { icon: <Facebook size={20} />, label: "Facebook", href: "#" },
    { icon: <Instagram size={20} />, label: "Instagram", href: "#" },
    { icon: <Twitter size={20} />, label: "Twitter", href: "#" },
    { icon: <Dribbble size={20} />, label: "Dribbble", href: "#" },
    { icon: <Globe size={20} />, label: "Globe", href: "#" },
  ]

  return (
    <footer className="bg-black relative h-fit overflow-hidden pt-20 sm:pt-0 md:pt-24">
      {/* Mobile and tablet white separator line above footer */}
      <div className="block lg:hidden w-full h-px bg-white/20 mb-8 md:mb-16"></div>
      
      <FooterBackgroundGradient />
      
      <div className="max-w-7xl mx-auto p-8 sm:p-12 md:p-14 z-40 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-12 md:gap-8 lg:gap-16 pb-12">
          {/* Brand section */}
          <div className="flex flex-col space-y-4 md:col-span-3 lg:col-span-1">
            <div className="flex items-center space-x-3">
              <Image
                src="/assets/logo/ChatGPT%20Image%20Nov%208,%202025,%2010_47_18%20PM.png"
                alt="Hirebit logo"
                width={120}
                height={120}
                className="h-12 w-12 md:h-14 md:w-14 object-contain"
                priority
              />
              <span className="text-white text-2xl sm:text-3xl font-figtree font-extralight">Hirebit</span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-gray-300 font-figtree font-light">
              The future of recruitment is here. Our AI-powered platform helps you find, screen, and hire the best talent faster than ever before.
            </p>
            {/* Social icons in brand section */}
            <div className="flex space-x-6 text-gray-400 pt-2">
              {socialLinks.map(({ icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="hover:text-[#3ca2fa] transition-colors"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Footer link sections - Side by side on mobile */}
          <div className="grid grid-cols-2 md:contents gap-6 md:gap-0">
            {footerLinks.map((section) => (
              <div key={section.title}>
                <h4 className="text-white text-[13px] sm:text-[15px] font-semibold mb-6 font-figtree">
                  {section.title}
                </h4>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label} className="relative">
                      <Link
                        href={link.href}
                        className="text-xs sm:text-sm text-gray-300 hover:text-[#3ca2fa] transition-colors font-figtree font-light"
                      >
                        {link.label}
                      </Link>
                      {link.pulse && (
                        <span className="absolute top-0 right-[-10px] w-2 h-2 rounded-full bg-[#3ca2fa] animate-pulse"></span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Contact section */}
          <div className="md:col-span-1 lg:col-span-1">
            <h4 className="text-white text-[13px] sm:text-[15px] font-semibold mb-6 font-figtree">
              Contact Us
            </h4>
            <ul className="space-y-4">
              {contactInfo.map((item, i) => (
                <li key={i} className="flex items-center space-x-3">
                  {item.icon}
                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-xs sm:text-sm text-gray-300 hover:text-[#3ca2fa] transition-colors font-figtree font-light"
                    >
                      {item.text}
                    </a>
                  ) : (
                    <span className="text-xs sm:text-sm text-gray-300 hover:text-[#3ca2fa] transition-colors font-figtree font-light">
                      {item.text}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <hr className="border-t border-gray-700 mt-8 mb-12" />

        {/* Footer bottom */}
        <div className="flex flex-col md:flex-row justify-end items-center text-xs sm:text-sm pb-4">
          {/* Copyright */}
          <p className="text-center md:text-left text-gray-400 font-figtree font-light">
            &copy; {new Date().getFullYear()} HR AI Agent. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
