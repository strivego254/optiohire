import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'figtree': ['var(--font-figtree)', 'Figtree'],
        'sans': ['var(--font-figtree)', 'Figtree'],
      },
      colors: {
        primary: {
          DEFAULT: '#2D2DDD',
          50: '#E8E8F5',
          100: '#D1D1EB',
          200: '#A3A3D7',
          300: '#7575C3',
          400: '#4747AF',
          500: '#2D2DDD',
          600: '#2525B0',
          700: '#1C1C83',
          800: '#131356',
          900: '#0A0A29',
        },
        secondary: {
          DEFAULT: '#00C2D4',
          50: '#F0FDFE',
          100: '#CCFAFE',
          200: '#99F4FD',
          300: '#66EEFB',
          400: '#33E8F9',
          500: '#00C2D4',
          600: '#00A8B8',
          700: '#008E9C',
          800: '#007480',
          900: '#005A64',
        },
        background: {
          DEFAULT: '#FFFFFF',
          dark: '#000000',
        },
        foreground: {
          DEFAULT: '#000000',
          dark: '#FFFFFF',
        },
        border: {
          DEFAULT: '#E5E7EB',
          dark: '#374151',
        },
        muted: {
          DEFAULT: '#F9FAFB',
          dark: '#1F2937',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-x': 'gradient-x 15s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-smooth': 'spin 1s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(45, 45, 221, 0.3)',
        'glow-secondary': '0 0 20px rgba(0, 194, 212, 0.3)',
        'inner-glow': 'inset 0 0 20px rgba(45, 45, 221, 0.1)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
