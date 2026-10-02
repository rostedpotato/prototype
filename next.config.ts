import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove X-Powered-By header for security
  poweredByHeader: false,

  // Allow testing the development server from another device on the LAN.
  allowedDevOrigins: ['192.168.1.6', '192.168.232.1'],

  experimental: {
    // Tree-shake lucide-react icons to reduce bundle size
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
