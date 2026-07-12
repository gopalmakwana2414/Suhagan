import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

import ReactQueryProvider from "@/providers/ReactQueryProvider";

import AuthInitializer from "@/components/AuthInitializer";

import { Toaster } from "sonner";

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
  title: "Kaumudi",
  description: "Premium Saree Collection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col">
        <ReactQueryProvider>
          <AuthInitializer />

          <Navbar />

          <main className="flex-1">
            {children}
          </main>

          <Footer />

          <Toaster
            richColors
            position="top-right"
            closeButton
          />
        </ReactQueryProvider>
      </body>
    </html>
  );
}