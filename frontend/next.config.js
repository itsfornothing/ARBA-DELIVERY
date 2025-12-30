/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for better deployment
  output: 'standalone',
  
  // Enable TypeScript checking for proper error detection
  // Disabled in development for faster builds, enabled in production for type safety
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000',
  },

  // Image optimization - configured for production
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
      {
        protocol: 'https',
        hostname: 'arba-delivery-backend.onrender.com',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development',
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Turbopack configuration (empty to silence warning)
  turbopack: {},

  // Experimental features for performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'framer-motion', 'clsx', 'tailwind-merge'],
  },

  // Webpack optimizations for bundle splitting and module resolution
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add environment validation during build
    if (!dev) {
      const requiredEnvVars = ['NEXT_PUBLIC_API_URL'];
      const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
      
      if (missingEnvVars.length > 0) {
        console.warn(`Warning: Missing environment variables: ${missingEnvVars.join(', ')}`);
      }
    }

    // Enhanced module resolution for better path mapping
    const path = require('path');
    const srcPath = path.resolve(__dirname, 'src');
    
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': srcPath,
      '@/components': path.resolve(srcPath, 'components'),
      '@/lib': path.resolve(srcPath, 'lib'),
      '@/lib/utils': path.resolve(srcPath, 'lib/utils.ts'),
      '@/lib/validation': path.resolve(srcPath, 'lib/validation.ts'),
      '@/lib/theme': path.resolve(srcPath, 'lib/theme.ts'),
      '@/types': path.resolve(srcPath, 'types'),
      '@/app': path.resolve(srcPath, 'app'),
    };

    // Ensure proper module resolution for utilities
    config.resolve.modules = [
      srcPath,
      path.resolve(__dirname, 'src/lib'),
      'node_modules',
      ...config.resolve.modules,
    ];

    // Add fallbacks for better module resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };

    // Ensure proper file extensions are resolved
    config.resolve.extensions = [
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.json',
      ...config.resolve.extensions,
    ];

    // Add specific resolution for problematic modules
    config.resolve.symlinks = false;
    config.resolve.cacheWithContext = false;

    // Optimize bundle splitting
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
          animations: {
            test: /[\\/]node_modules[\\/](framer-motion|@emotion)[\\/]/,
            name: 'animations',
            priority: 20,
            reuseExistingChunk: true,
          },
          ui: {
            test: /[\\/]src[\\/]components[\\/]/,
            name: 'ui-components',
            priority: 15,
            reuseExistingChunk: true,
            minChunks: 2,
          },
          utils: {
            test: /[\\/]src[\\/]lib[\\/]/,
            name: 'utils',
            priority: 25,
            reuseExistingChunk: true,
            minChunks: 2,
          },
        },
      };

      // Add bundle analyzer in development
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
          })
        );
      }
    }

    // Add build progress indicator
    if (!dev) {
      config.plugins.push(
        new webpack.ProgressPlugin({
          activeModules: false,
          entries: true,
          modules: true,
          modulesCount: 5000,
          profile: false,
          dependencies: true,
          dependenciesCount: 10000,
          percentBy: null,
        })
      );
    }

    return config;
  },

  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Static asset optimization
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  trailingSlash: false,
  
  // Build optimization for deployment
  generateBuildId: async () => {
    // Use git commit hash if available, otherwise use timestamp
    try {
      const { execSync } = require('child_process');
      return execSync('git rev-parse HEAD').toString().trim().slice(0, 7);
    } catch {
      return `build-${Date.now()}`;
    }
  },
  
  // Production-specific optimizations
  ...(process.env.NODE_ENV === 'production' && {
    compiler: {
      removeConsole: {
        exclude: ['error', 'warn'],
      },
    },
  }),

  // Development-specific optimizations
  ...(process.env.NODE_ENV === 'development' && {
    // Faster builds in development
    webpack: (config, options) => {
      // Apply base webpack config first
      config = nextConfig.webpack(config, options);
      
      // Development-specific optimizations
      config.optimization.splitChunks = false;
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
      
      return config;
    },
  }),
};

module.exports = nextConfig;