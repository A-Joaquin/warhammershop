import type { Metadata } from "next";
import { Oswald, Cinzel, Inter, JetBrains_Mono, Pirata_One } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "@/components/layout/site-chrome";
import { CartProvider } from "@/lib/contexts/cart-context";
import { AccountProvider } from "@/lib/contexts/account-context";
import { SITE } from "@/lib/config";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["700", "900"],
});
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});
const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});
const pirata = Pirata_One({
  variable: "--font-pirata",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — Miniaturas Warhammer 40.000`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    type: "website",
    locale: "es_BO",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${oswald.variable} ${cinzel.variable} ${inter.variable} ${jetbrains.variable} ${pirata.variable} h-full`}
    >
      <body
        className="min-h-full flex flex-col bg-ink text-bone"
        suppressHydrationWarning
      >
        <AccountProvider>
          <CartProvider>
            <SiteChrome>{children}</SiteChrome>
          </CartProvider>
        </AccountProvider>
      </body>
    </html>
  );
}
