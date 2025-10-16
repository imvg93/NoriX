import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export', // Commented out to allow dynamic routes
  trailingSlash: false, // Changed to false for Vercel compatibility
  images: {
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Vercel-specific configuration
  env: {
    PORT: process.env.PORT || '3000',
  },
  // Add configuration to handle clientReferenceManifest issues
  reactStrictMode: true,
  // Simplified webpack configuration for Vercel compatibility
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
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
};

export default nextConfig;
