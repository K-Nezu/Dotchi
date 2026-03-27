import type { Metadata, Viewport } from "next";
import { Geist, Dancing_Script } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const dancingScript = Dancing_Script({
  variable: "--font-logo",
  weight: "700",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dotchi - 5分間の匿名多数決",
  description:
    "迷ったら放流。知らない誰かが5分で決めてくれる、匿名の多数決",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dotchi",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1a1a1a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${geistSans.variable} ${dancingScript.variable} antialiased`}>{children}</body>
    </html>
  );
}
