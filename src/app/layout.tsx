import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",          // iOS safe-area support
  themeColor: "#0A0A0A",
};

export const metadata: Metadata = {
  title: {
    default: "DR DHL Elite Fitness Club",
    template: "%s | DR DHL Elite Fitness Club",
  },
  description:
    "DR DHL Elite Fitness Club — Premium gym management platform for members, trainers, and owners.",
  applicationName: "DR DHL Elite Fitness Club",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DR DHL Fitness",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <head>
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        {/* iOS standalone */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="DR DHL Fitness" />
        {/* MS tiles */}
        <meta name="msapplication-TileColor" content="#0A0A0A" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className="min-h-full antialiased">
        {children}
      </body>
    </html>
  );
}
