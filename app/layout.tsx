import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-figtree",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bus Tracker - Live College Bus",
  description: "Live college bus tracking for Raipur students: Saddu, Shankar Nagar, and SSIPMT College.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bus Tracker",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#EEF1F5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={figtree.variable}>
      <body className="min-h-screen bg-bg text-ink font-sans antialiased sm:py-5 sm:pb-10 pt-safe pb-safe px-0 sm:px-4">
        {children}
      </body>
    </html>
  );
}
