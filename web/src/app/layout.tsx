import type { Metadata } from "next";
import { Suspense } from "react";
import { Archivo, IBM_Plex_Mono, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { PreviewRibbon, SiteFooter, SiteHeader, WhatsAppFloat } from "@/components/chrome";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", axes: ["wdth"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const plex = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex" });

export const metadata: Metadata = {
  // Routes set their own title; the template brands every tab consistently.
  title: {
    default: "SMASH PRO — Sports Equipment for Institutions",
    template: "%s · SMASH PRO",
  },
  description:
    "India's B2B sports commerce platform for schools, academies, colleges and retailers. Preview build — all data illustrative.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${archivo.variable} ${inter.variable} ${plex.variable}`}>
        <Providers>
          {process.env.DEMO_MODE === "1" && <PreviewRibbon />}
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
