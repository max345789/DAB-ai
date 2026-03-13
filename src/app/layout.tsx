import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/AppProviders";
import { TopNav } from "@/components/TopNav";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dabcloud.in"),
  title: {
    default: "DAB AI",
    template: "%s · DAB AI",
  },
  description: "DAB AI is an AI marketing agent that helps you capture leads, follow up automatically, and manage marketing tasks in one chat.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://dabcloud.in",
    title: "DAB AI",
    description:
      "An AI marketing agent that helps you capture leads, follow up automatically, and manage marketing tasks in one chat.",
    siteName: "DAB AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "DAB AI",
    description:
      "An AI marketing agent that helps you capture leads, follow up automatically, and manage marketing tasks in one chat.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} antialiased`}>
        <AppProviders>
          <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
            <TopNav />
            <main className="mx-auto w-full max-w-5xl flex-1 min-h-0 px-4 py-6 sm:px-6">
              {children}
            </main>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
