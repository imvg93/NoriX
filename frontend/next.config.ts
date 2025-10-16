import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export', // Commented out to allow dynamic routes
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  outputFileTracingRoot: process.cwd(),
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Railway-specific configuration
  // Ensure proper port handling
  env: {
    PORT: process.env.PORT || '3000',
  },
  // Add configuration to handle clientReferenceManifest issues
  reactStrictMode: true,
  // Webpack configuration to handle chunk loading issues
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Enhanced chunk optimization for both dev and production
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          // Core Next.js and React chunks
          framework: {
            test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            name: 'framework',
            chunks: 'all',
            priority: 40,
            enforce: true,
          },
          // Socket.io specific chunk
          socketio: {
            test: /[\\/]node_modules[\\/]socket\.io-client[\\/]/,
            name: 'socketio',
            chunks: 'all',
            priority: 30,
          },
          // Other vendor libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 20,
          },
          // Common chunks
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      },
      // Add runtime chunk to help with chunk loading
      runtimeChunk: {
        name: 'runtime',
      },
    };
    
    // Add better error handling for chunk loading
    if (!isServer) {
      config.output = {
        ...config.output,
        chunkLoadTimeout: 10000, // Reduced to 10 seconds for faster error detection
      };
    }
    
    return config;
  },
  // Turbopack configuration
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  async rewrites() {
    if (process.env.NODE_ENV !== 'production') {
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:5001/api/:path*", // Fixed port to match backend
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
