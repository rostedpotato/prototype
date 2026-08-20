import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove X-Powered-By header for security
  poweredByHeader: false,

  experimental: {
    // Tree-shake lucide-react icons to reduce bundle size
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
