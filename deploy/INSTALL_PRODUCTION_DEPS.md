# Fast Production Dependency Installation

## Problem
Installing all dependencies (including Storybook, Jest, etc.) takes 1.5+ hours on the server because these are huge development tools not needed for production builds.

## Solution: Install Only Build-Time Dependencies

For production builds on the server, you only need:
- All production dependencies (dependencies)
- TypeScript, TailwindCSS, PostCSS, Autoprefixer (for building)
- ESLint (Next.js might need it)

You DON'T need:
- Storybook (huge, ~500MB+)
- Jest and testing libraries
- Prettier

## Quick Fix Commands

**If npm install is still running, cancel it (Ctrl+C) and run:**

```bash
cd ~/optiohire/frontend

# Remove everything
rm -rf node_modules package-lock.json

# Install with flags to speed up (skip optional deps, no audit)
npm install --no-optional --no-audit --no-fund --legacy-peer-deps

# Build
npm run build
```

## Optimized Installation (Skip Storybook & Jest)

If the above is still slow, use this approach that temporarily excludes heavy dev dependencies:

```bash
cd ~/optiohire/frontend

# Backup package.json
cp package.json package.json.backup

# Create temporary package.json without Storybook and Jest
cat > package.json.temp << 'EOF'
{
  "name": "hr-recruitment-ai-agent",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@gsap/react": "^2.1.2",
    "@hookform/resolvers": "^3.3.2",
    "@number-flow/react": "^0.5.10",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-popover": "^1.1.15",
    "@radix-ui/react-progress": "^1.0.3",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slider": "^1.3.6",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@react-three/drei": "^9.122.0",
    "@react-three/fiber": "^8.18.0",
    "@tanstack/react-query": "^5.8.4",
    "@tsparticles/react": "^3.0.0",
    "@tsparticles/slim": "^3.9.1",
    "@types/bcryptjs": "^2.4.6",
    "@types/three": "^0.180.0",
    "bcryptjs": "^3.0.3",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "date-fns": "^2.30.0",
    "date-fns-tz": "^2.0.1",
    "framer-motion": "^10.16.16",
    "gsap": "^3.13.0",
    "jsonwebtoken": "^9.0.2",
    "jspdf": "^3.0.3",
    "jspdf-autotable": "^5.0.2",
    "lenis": "^1.3.13",
    "lucide-react": "^0.294.0",
    "motion": "^12.23.24",
    "next": "14.0.3",
    "next-themes": "^0.4.6",
    "nodemailer": "^6.9.14",
    "pg": "^8.11.3",
    "react": "^18.2.0",
    "react-day-picker": "^9.11.1",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.48.2",
    "recharts": "^2.8.0",
    "tailwind-merge": "^2.0.0",
    "tailwindcss-animate": "^1.0.7",
    "three": "^0.181.0",
    "zod": "^3.22.4",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@types/jsonwebtoken": "^9.0.6",
    "@types/jspdf": "^1.3.3",
    "@types/node": "^20.9.0",
    "@types/nodemailer": "^6.4.15",
    "@types/pg": "^8.15.6",
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.54.0",
    "eslint-config-next": "14.0.3",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "typescript": "^5.2.2"
  }
}
EOF

# Use temporary package.json for installation
mv package.json package.json.original
mv package.json.temp package.json

# Install only essential dependencies
npm install --no-optional --no-audit --no-fund --legacy-peer-deps

# Build
npm run build

# Restore original package.json (optional, if you want to keep Storybook for future)
# mv package.json.original package.json
```

## Alternative: Use npm ci with package-lock.json (Fastest)

If you have a package-lock.json committed, this is the fastest:

```bash
cd ~/optiohire/frontend

# Clean install using lock file (much faster, deterministic)
rm -rf node_modules
npm ci --no-optional --no-audit --no-fund
npm run build
```

## Recommended: Production-Optimized Install Script

Create this as a script you can run:

```bash
cd ~/optiohire/frontend

# Install with performance optimizations
npm install \
  --no-optional \
  --no-audit \
  --no-fund \
  --legacy-peer-deps \
  --prefer-offline

# Build
npm run build
```

## Why This Works

1. `--no-optional`: Skips optional dependencies (faster)
2. `--no-audit`: Skips security audit (faster)
3. `--no-fund`: Skips funding messages (faster)
4. `--legacy-peer-deps`: Avoids peer dependency resolution issues
5. Excluding Storybook/Jest: Removes ~500MB+ of unnecessary packages

## Expected Time

- Full install (with Storybook): 1.5+ hours
- Optimized install (without Storybook/Jest): 10-20 minutes
- With npm ci + lock file: 5-10 minutes

## After Building

Once build is successful, you can run:
```bash
npm run start
```

Or use PM2:
```bash
cd ~/optiohire
pm2 start deploy/ecosystem.config.js
```

