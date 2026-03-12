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
  title: "DAB AI",
  description: "AI marketing agent platform dashboard",
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
          <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
            <TopNav />
            <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
              {children}
            </main>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
