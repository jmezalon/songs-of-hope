import type { Metadata } from "next";
import { Toaster } from "sonner";
import { SessionProvider } from "@/components/providers/session-provider";
import "./globals.css";

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const defaultOgImage = {
  url: `${appUrl}/opengraph-image`,
  width: 1200,
  height: 630,
  alt: "Chant d'Espérance - Digital Haitian Hymnal",
};

const defaultTwitterImage = `${appUrl}/twitter-image`;

export const metadata: Metadata = {
  title: {
    default: "Chant d'Espérance - Digital Haitian Hymnal | Songs of Hope",
    template: "%s | Chant d'Espérance"
  },
  description: "Explore Chant d'Espérance (Songs of Hope), the complete digital Haitian Adventist Hymnal. Search and browse thousands of hymns in Français and Kreyòl. Features bilingual lyrics, projection mode, playlists, and biblical references. Perfect for worship services and personal devotion.",
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
  metadataBase: new URL(appUrl),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: `${appUrl}/favicon.ico`, sizes: "32x32" },
      { url: `${appUrl}/favicon.ico`, sizes: "16x16" },
    ],
    shortcut: [`${appUrl}/favicon.ico`],
    apple: [`${appUrl}/apple-touch-icon.png`],
    other: [
      {
        rel: "mask-icon",
        url: `${appUrl}/safari-pinned-tab.svg`,
        color: "#8b5cf6",
      },
    ],
  },
  openGraph: {
    title: "Chant d'Espérance - Digital Haitian Hymnal | Songs of Hope",
    description: "Explore the complete Haitian Adventist Hymnal with thousands of songs in Français and Kreyòl. Search hymns, create playlists, and use projection mode for worship services.",
    url: '/',
    siteName: "Chant d'Espérance - Songs of Hope",
    locale: 'en_US',
    type: 'website',
    images: [defaultOgImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Chant d'Espérance - Digital Haitian Hymnal",
    description: "🎵 Complete Haitian Adventist Hymnal • Bilingual Lyrics (Français & Kreyòl) • Projection Mode • Search & Browse • Create Playlists",
    creator: '@ChantEsperance',
    site: '@ChantEsperance',
    images: [defaultTwitterImage],
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
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#9333ea" />
      </head>
      <body
        className="font-sans antialiased"
        suppressHydrationWarning
      >
        <SessionProvider>
          {children}
          <Toaster position="top-right" richColors />
        </SessionProvider>
      </body>
    </html>
  );
}
