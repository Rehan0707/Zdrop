import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.VERCEL
    ? ".next"
    : process.env.ZDROP_NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  serverExternalPackages: [
    "firebase-admin",
    "pdf-lib",
    "jszip",
    "@napi-rs/canvas",
    "sharp",
  ],
  outputFileTracingIncludes: {
    "/api/sessions/*": ["./node_modules/@napi-rs/canvas/**/*", "./node_modules/@napi-rs/canvas-*/**/*", "./node_modules/sharp/**/*", "./node_modules/@img/**/*"],
    "/api/print/*": [
      "./node_modules/sharp/**/*",
      "./node_modules/@img/**/*",
      "./node_modules/@napi-rs/canvas/**/*",
      "./node_modules/@napi-rs/canvas-*/**/*",
      "./node_modules/pdfjs-dist/legacy/build/*.mjs",
      "./node_modules/pdfjs-dist/package.json",
      "./node_modules/pdfjs-dist/standard_fonts/**/*",
      "./node_modules/pdfjs-dist/cmaps/**/*",
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "motion"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Download-Options", value: "noopen" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=()" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
