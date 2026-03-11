import type { NextConfig } from "next";

/**
 * DAB AI – Next.js Configuration
 *
 * Production:
 *   Set NEXT_PUBLIC_API_BASE=https://api.yourdomain.com/api in your
 *   hosting provider's environment variables panel.
 *
 * Local development:
 *   Create .env.local at the project root containing:
 *     NEXT_PUBLIC_API_BASE=http://localhost:5001/api
 *   Or leave it empty to use the /api proxy rewrite below which
 *   forwards all /api/* requests to the local backend at port 5001.
 */
const nextConfig: NextConfig = {
  async rewrites() {
    // Only active in development when NEXT_PUBLIC_API_BASE is not set.
    // In production this block is effectively bypassed because all fetch()
    // calls use the full NEXT_PUBLIC_API_BASE URL.
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5001/api/:path*",
      },
    ];
  },

  // Forward environment variable to the browser bundle
  env: {
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE ?? "",
  },
};

export default nextConfig;
