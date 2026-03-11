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
          <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.18),_transparent_45%),radial-gradient(circle_at_25%_15%,_rgba(14,165,233,0.18),_transparent_45%),linear-gradient(180deg,_#f8fafc_0%,_#e2e8f0_100%)] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.12),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(99,102,241,0.18),_transparent_40%),linear-gradient(180deg,_#0b0f14_0%,_#05070b_100%)] dark:text-slate-100">
            <TopNav />
            <main className="mx-auto w-full max-w-[1400px] px-6 py-8">
              {children}
            </main>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
