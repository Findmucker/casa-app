import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import FloatingCuties from "@/components/FloatingCuties";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "A Nossa Casinha",
  description: "A nossa app de casa",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#fce7f3",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" className={`${geist.variable} h-full`}>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="h-full font-sans bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
        <FloatingCuties />
        {children}
      </body>
    </html>
  );
}
