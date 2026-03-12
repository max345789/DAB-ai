export function getClientApiBase() {
  const configured = process.env.NEXT_PUBLIC_API_BASE ?? "";
  if (configured) return configured;

  if (typeof window === "undefined") return "";

  const host = window.location.hostname.toLowerCase();

  // Production domains for this project.
  if (host === "dabcloud.in" || host === "app.dabcloud.in" || host === "www.dabcloud.in") {
    return "https://api.dabcloud.in/api";
  }

  // Fallback for Vercel preview domains: keep relative to support local rewrites.
  return "";
}

