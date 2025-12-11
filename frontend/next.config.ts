import type { NextConfig } from "next";
import path from "path";

if (typeof (globalThis as Record<string, unknown>).self === "undefined") {
  (globalThis as Record<string, unknown>).self = globalThis;
}

const nextConfig: NextConfig = {
  // Set the workspace root to avoid multiple lockfile warnings
  outputFileTracingRoot: path.resolve(__dirname, ".."),
  // Vercel-optimized configuration
  trailingSlash: false,
  images: {
    // Disable optimization for static images in production to avoid loading issues
    unoptimized: process.env.NODE_ENV === 'production',
    // Allow local static images
    domains: [],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
    ],
    // Fallback for public images
    minimumCacheTTL: 60,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Enable React strict mode
  reactStrictMode: true,
  // Webpack configuration for better compatibility
  webpack: (config, { isServer, dev }) => {
    // Handle client-side fallbacks
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }
    
    // Optimize bundle size and chunk loading
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
          },
        },
      };
    }
    
    // Improve chunk loading reliability in development
    if (dev && !isServer) {
      // Better error handling for failed chunks
      config.optimization = {
        ...config.optimization,
        minimize: false, // Disable minification in dev for better debugging
      };
    }
    
    return config;
  },
  // Experimental features for better performance (removed optimizeCss)
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

export default nextConfig;
