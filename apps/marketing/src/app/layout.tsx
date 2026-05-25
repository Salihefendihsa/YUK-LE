import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { SmoothScrollProvider } from "@/providers/SmoothScrollProvider";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "YÜK-LE — Yapay Zeka Destekli Lojistik Pazaryeri",
  description:
    "Fabrikalar ile güvenilir tır şoförlerini saniyeler içinde buluşturan yeni nesil lojistik platformu.",
  keywords: ["lojistik", "yük taşıma", "nakliye", "AI", "YÜK-LE"],
  openGraph: {
    title: "YÜK-LE — Dijital Lojistik Platformu",
    description:
      "Eşleş, taşı, güvenle teslim al. Yapay zeka destekli B2B lojistik pazaryeri.",
    type: "website",
    locale: "tr_TR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${plusJakarta.variable} ${inter.variable} ${jetbrainsMono.variable} h-full scroll-smooth`}
    >
      <body className="min-h-full bg-neutral-950 font-body text-neutral-200 antialiased">
        <SmoothScrollProvider>
          <Navbar />
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
