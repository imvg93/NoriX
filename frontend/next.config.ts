import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed output: 'export' to fix styling issues
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  outputFileTracingRoot: process.cwd(),
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
