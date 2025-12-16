/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'images.unsplash.com'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 year cache for better performance
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
    // Optimize image loading
    unoptimized: false,
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react', 
      'framer-motion', 
      '@radix-ui/react-dialog', 
      '@radix-ui/react-popover', 
      '@radix-ui/react-select',
      '@react-three/fiber',
      '@react-three/drei',
      'three',
    ],
    // Disable optimizeCss to avoid critters dependency issue on Render
    // optimizeCss: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  poweredByHeader: false,
  compress: true,
  swcMinify: true,
  // Optimize caching for faster builds
  generateEtags: true,
  onDemandEntries: {
    maxInactiveAge: 15 * 1000, // Reduced from 25s to 15s for faster cleanup
    pagesBufferLength: 1, // Reduced from 2 to 1 for less memory usage
  },
  // Optimize production builds
  productionBrowserSourceMaps: false,
  // Optimize static generation
  output: 'standalone',
  // Disable type checking during build to save memory (run separately if needed)
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  // Disable ESLint during build to save memory
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer, dev }) => {
    // Ignore warnings about non-serializable cache items and module warnings
    config.ignoreWarnings = [
      { module: /node_modules/ },
      { message: /No serializer registered for Warning/ },
      { message: /autoprefixer/ },
      { message: /Gradient has outdated direction syntax/ },
      { message: /does not contain a default export/ },
      { message: /Caching failed/ },
      { message: /Resolving.*vendor-chunks/ },
      { message: /doesn't lead to expected result/ },
      { message: /Can't resolve.*vendor-chunks/ },
      { message: /ENOENT: no such file or directory/ },
      { message: /\.nft\.json/ },
      { file: /\.nft\.json/ },
      { message: /webpack\.cache\.PackFileCacheStrategy/ },
      { message: /FileSystemInfo/ },
      { message: /Skipped not serializable cache item/ },
      { message: /while serializing/ },
    ]

    // Optimize webpack cache for faster builds
    if (dev && config.cache) {
      config.cache = {
        ...config.cache,
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
        // Reduce cache size for faster builds
        maxMemoryGenerations: 1,
        compression: 'gzip',
      }
    }


    // Suppress specific warnings at the compilation level
    config.infrastructureLogging = {
      level: 'error',
    }

    // Fix for ESM modules - handle default exports properly
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }

    // Handle external modules that may have issues
    config.externals = config.externals || []
    if (isServer) {
      config.externals.push({
        'webgl-sdf-generator': 'commonjs webgl-sdf-generator',
        'bidi-js': 'commonjs bidi-js',
      })
    }

    // Optimize bundle splitting - ensure framework loads reliably
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20000,
          cacheGroups: {
            default: false,
            vendors: false,
            // Framework chunk - must be highest priority to ensure it loads first
            framework: {
              chunks: 'all',
              name: 'framework',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|object-assign)[\\/]/,
              priority: 40,
              enforce: true,
              reuseExistingChunk: true,
            },
            // Next.js framework chunk
            nextjs: {
              chunks: 'all',
              name: 'nextjs',
              test: /[\\/]node_modules[\\/]next[\\/]/,
              priority: 35,
              enforce: true,
            },
            // Separate chunk for Three.js (large library)
            three: {
              name: 'three',
              test: /[\\/]node_modules[\\/](three|@react-three)[\\/]/,
              chunks: 'async',
              priority: 30,
              minChunks: 1,
            },
            // Separate chunk for Framer Motion
            framer: {
              name: 'framer',
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              chunks: 'async',
              priority: 25,
              minChunks: 1,
            },
            // Vendor chunk for large libraries (async to prevent blocking)
            vendor: {
              name: 'vendor',
              chunks: 'async',
              test: /[\\/]node_modules[\\/]/,
              priority: 20,
              minChunks: 2,
              reuseExistingChunk: true,
            },
            // Common chunk for shared code
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'async',
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      }
    }

    return config
  },
}
module.exports = nextConfig
