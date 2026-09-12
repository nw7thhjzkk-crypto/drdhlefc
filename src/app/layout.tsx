import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { site, siteOrigin } from "@/lib/site";
import "./globals.css";
import "./public-editorial.css";
import "./public-immersive.css";

const geistSans = localFont({
  src: "../../node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "../../node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

const display = localFont({
  src: "../../node_modules/@fontsource-variable/cormorant-garamond/files/cormorant-garamond-latin-wght-normal.woff2",
  variable: "--font-display",
  weight: "300 700",
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
    "Dr DHL Elite Fitness Club — premium fitness in Bhuj, Gujarat. Gym management, member portal, and trainer tools.",
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
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: site.name,
    title: `${site.name} | Premium Fitness in Bhuj`,
    description: "A premium fitness club in Bhuj with gym management, member portal, and trainer tools.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} | Premium Fitness in Bhuj`,
    description: "A premium fitness club in Bhuj with gym management, member portal, and trainer tools.",
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dr DHL",
  },
  formatDetection: { telephone: false },
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
