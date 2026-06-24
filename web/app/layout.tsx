import type { Metadata } from "next";
import { Space_Grotesk, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/layout/app-shell";

// Display: Space Grotesk (precise-engineering character). Body: Inter Tight at 400.
// Mono: JetBrains Mono for every hash, address, and cryptographic statement.
const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-display",
  display: "swap",
});
const sans = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-sans",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PoolPass — Prove you qualify. Reveal nothing.",
  description:
    "Subscribe to gated real-world-asset pools on Stellar without exposing your identity, your wealth, or the issuer's investor list. Zero-knowledge accreditation on testnet.",
  metadataBase: new URL("https://poolpass.app"),
  openGraph: {
    title: "PoolPass — Prove you qualify. Reveal nothing.",
    description: "Zero-knowledge gated RWA subscriptions on Stellar testnet.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* No-flash theme: set the class before first paint. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('poolpass-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${display.variable} ${sans.variable} ${mono.variable}`}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
