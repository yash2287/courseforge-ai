import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/providers/convex-client-provider";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CourseForge AI - AI Training Course Generator for Teams",
    template: "%s | CourseForge AI",
  },
  description:
    "Generate company-specific training courses in minutes with AI. Create onboarding, compliance, and product training with auto quizzes, certificates, and progress tracking.",
  keywords: [
    "AI course generator",
    "training course creator",
    "LMS for small business",
    "employee training software",
    "AI-powered LMS",
    "compliance training",
    "onboarding courses",
    "corporate training platform",
  ],
  authors: [{ name: "CourseForge AI" }],
  creator: "CourseForge AI",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://courseforge.ai"
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "CourseForge AI - AI Training Course Generator for Teams",
    description:
      "Generate company-specific training courses in minutes with AI. Auto quizzes, certificates, and progress tracking included.",
    siteName: "CourseForge AI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CourseForge AI - Build training courses beautifully",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CourseForge AI - AI Training Course Generator",
    description:
      "Generate company-specific training courses in minutes with AI.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${instrumentSerif.variable} ${geistMono.variable} antialiased grain`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ConvexClientProvider>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                },
              }}
            />
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
