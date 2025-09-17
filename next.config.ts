import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for better performance
  experimental: {
    // Enable CSS optimization
    optimizeCss: true,
    // Optimize package imports
    optimizePackageImports: ['@/lib', '@/components'],
  },
  
  // Enable compression
  compress: true,
  
  // Optimize webpack for better performance
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig;
