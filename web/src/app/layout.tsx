import type { Metadata } from "next";
import { Suspense } from "react";
import { Archivo, IBM_Plex_Mono, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { SiteFooter, SiteHeader, WhatsAppFloat } from "@/components/chrome";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", axes: ["wdth"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const plex = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex" });

const SITE_NAME = "Smash Pro";
const SITE_DESCRIPTION =
  "Smash Pro is India's managed B2B platform for sports equipment — wholesale pricing and ordering for schools, academies, colleges and retailers across cricket, football, badminton, athletics and more.";

export const metadata: Metadata = {
  metadataBase: new URL("https://smashpro.in"),
  // Routes set their own title; the template brands every tab consistently.
  title: {
    default: "Smash Pro — Your Complete Sports Destination – Every Game. Every Level.",
    template: "%s · Smash Pro",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "sports equipment wholesale India", "B2B sports supplier", "institutional sports equipment",
    "school sports equipment supplier", "cricket equipment wholesale", "sports academy equipment",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: SITE_NAME,
    title: "Smash Pro — Your Complete Sports Destination",
    description: SITE_DESCRIPTION,
    images: [{ url: "/img/brand/prosmash-logo-crest-color.png", width: 460, height: 512, alt: "Smash Pro" }],
  },
  twitter: {
    card: "summary",
    title: "Smash Pro — Your Complete Sports Destination",
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${archivo.variable} ${inter.variable} ${plex.variable}`}>
        <Providers>
          {/* usePathname (active-tab highlight) needs a Suspense boundary to prerender */}
          <Suspense fallback={null}>
            <SiteHeader />
          </Suspense>
          {children}
          <SiteFooter />
          <WhatsAppFloat />
        </Providers>
      </body>
    </html>
  );
}
