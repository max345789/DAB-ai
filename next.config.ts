import type { NextConfig } from "next";

/**
 * DAB AI – Next.js Configuration
 *
 * Production:
 *   Set NEXT_PUBLIC_API_BASE=https://api.yourdomain.com/api in your
 *   hosting provider's environment variables panel.
 */
const nextConfig: NextConfig = {
  // Prevent Next from inferring a parent directory as the workspace root
  // when other lockfiles exist on the machine.
  turbopack: {
    root: __dirname,
  },

  // Forward environment variable to the browser bundle
  env: {
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE ?? "",
  },
};

export default nextConfig;
