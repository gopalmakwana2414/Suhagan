import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import dynamic from "next/dynamic";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageTransitionWrapper from "@/components/layout/PageTransitionWrapper";

import ReactQueryProvider from "@/providers/ReactQueryProvider";

import AuthInitializer from "@/components/AuthInitializer";

import { Toaster } from "@/components/ui/sonner";
import {
  constructMetadata,
  getOrganizationSchema,
  getLocalBusinessSchema,
  getWebsiteSchema,
} from "@/utils/seo";

import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

const WhatsAppButton = dynamic(
  () => import("@/components/common/WhatsAppButton")
);

export const metadata: Metadata = constructMetadata({
  title: "Kaumudi | Premium Sarees Online in India",
  description:
    "Shop premium Banarasi, Silk, Cotton, Linen, Wedding and Designer Sarees from Kaumudi. Elegant collections crafted for every occasion with secure payments and fast delivery.",
  path: "",
});

const orgSchema = getOrganizationSchema();
const localBusinessSchema = getLocalBusinessSchema();
const websiteSchema = getWebsiteSchema();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <ReactQueryProvider>
          <AuthInitializer />

          <Navbar />

          <main className="flex-1 flex flex-col">
            <PageTransitionWrapper>
              {children}
            </PageTransitionWrapper>
          </main>

          <Footer />

          <Toaster
            richColors
            position="top-right"
            closeButton
            duration={4000}
          />

          <WhatsAppButton />
        </ReactQueryProvider>
      </body>
    </html>
  );
}