import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import { site, siteOrigin } from "@/lib/site";
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

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A0A0A",
};

const origin = siteOrigin();

export const metadata: Metadata = {
  metadataBase: new URL(origin),
  title: {
    default: `${site.name} | Premium Fitness in Bhuj`,
    template: `%s | ${site.name}`,
  },
  description:
    "Dr DHL Elite Fitness Club — premium fitness in Bhuj, Gujarat. Coming soon. Register your interest for early access.",
  applicationName: site.name,
  keywords: [
    "Dr DHL Elite Fitness Club",
    "gym in Bhuj",
    "fitness centre in Bhuj",
    "premium fitness club in Bhuj",
    "personal training in Bhuj",
  ],
  authors: [{ name: site.name }],
  creator: site.name,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: site.name,
    title: `${site.name} | Premium Fitness in Bhuj`,
    description:
      "A premium fitness club in Bhuj. Coming soon. Get early access.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} | Premium Fitness in Bhuj`,
    description:
      "A premium fitness club in Bhuj. Coming soon. Get early access.",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dr DHL",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [{ url: "/brand/dr-dhl-monogram.png", type: "image/png" }],
    apple: [{ url: "/brand/dr-dhl-monogram.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en-IN"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full`}
    >
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
