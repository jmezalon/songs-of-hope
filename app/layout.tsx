import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { SessionProvider } from "@/components/providers/session-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Chant d'Espérance - Haitian Hymnal Platform",
    template: "%s | Chant d'Espérance"
  },
  description: "Digital platform for Chant d'Espérance, the Haitian Adventist Hymnal. Browse, search, and manage hymns in Français, Kreyòl, and bilingual formats. Access thousands of hymns with lyrics, themes, and biblical references.",
  keywords: [
    "Chant d'Espérance",
    "Haitian hymnal",
    "Adventist hymns",
    "Kreyòl hymns",
    "French hymns",
    "Christian music",
    "Haiti",
    "hymn database",
    "worship songs",
    "bilingual hymns"
  ],
  authors: [{ name: "Chant d'Espérance Team" }],
  creator: "Chant d'Espérance",
  publisher: "Chant d'Espérance",
  formatDetection: {
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Chant d'Espérance - Haitian Hymnal Platform",
    description: "Digital platform for Chant d'Espérance, the Haitian Adventist Hymnal. Browse, search, and manage hymns in Français, Kreyòl, and bilingual formats.",
    url: '/',
    siteName: "Chant d'Espérance",
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: "Chant d'Espérance - Haitian Hymnal Platform",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Chant d'Espérance - Haitian Hymnal Platform",
    description: "Digital platform for Chant d'Espérance, the Haitian Adventist Hymnal.",
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#9333ea" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          {children}
          <Toaster position="top-right" richColors />
        </SessionProvider>
      </body>
    </html>
  );
}
