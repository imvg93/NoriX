import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import ErrorBoundary from "../components/ErrorBoundary";
import Layout from "../components/Layout";
import ChunkErrorHandlerSetup from "../components/ChunkErrorHandler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NoriX",
  description: "Find the perfect job opportunities for students",
  icons: {
    icon: [
      { url: '/Favicon.ico', sizes: 'any' },
      { url: '/Favicon.ico', type: 'image/x-icon', sizes: '32x32' },
      { url: '/img/norixlogo.png', sizes: '192x192', type: 'image/png' },
      { url: '/img/norixlogo.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/Favicon.ico',
    apple: [
      { url: '/img/norixlogo.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ChunkErrorHandlerSetup />
        <ErrorBoundary>
          <AuthProvider>
            <NotificationProvider>
              <Layout>
                {children}
              </Layout>
            </NotificationProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
