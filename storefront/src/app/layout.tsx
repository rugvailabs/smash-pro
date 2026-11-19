import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { DemoRibbon, SiteFooter, SiteHeader } from "@/components/chrome";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", axes: ["wdth"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const plex = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex" });

export const metadata: Metadata = {
  title: {
    default: "SMASH PRO Storefront — Sports Equipment for Institutions",
    template: "%s · SMASH PRO",
  },
  description:
    "Standalone storefront preview. Frontend-only fixtures — not connected to any backend, database or authentication.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${archivo.variable} ${inter.variable} ${plex.variable}`}>
        <Providers>
          <DemoRibbon />
          <SiteHeader />
          {children}
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
