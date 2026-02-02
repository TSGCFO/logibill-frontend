import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SkipLinks } from "@/components/accessibility";
import { GlobalAnnouncer } from "@/components/accessibility";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LogiBill - Billing Platform",
    template: "%s | LogiBill",
  },
  description: "Enterprise billing platform for fulfillment operations",
  keywords: ["billing", "invoicing", "fulfillment", "logistics", "3PL"],
  authors: [{ name: "LogiBill" }],
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <SkipLinks />
        <Providers>
          {children}
          <GlobalAnnouncer />
        </Providers>
      </body>
    </html>
  );
}
