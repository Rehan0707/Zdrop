import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.VERCEL ? '.next' : (process.env.ZDROP_NEXT_DIST_DIR || '.next'),
  reactStrictMode: true,
  serverExternalPackages: ["firebase-admin", "pdf-lib", "jszip"],
  experimental: {
    optimizePackageImports: ["lucide-react", "motion"],
  },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'Permissions-Policy', value: 'camera=(self), microphone=()' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    ] }];
  },
};

export default nextConfig;
