import type { Metadata, Viewport } from "next";
import { Poppins, Inter } from "next/font/google";
import { getLocale } from "next-intl/server";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OxzyO - Orizzonti Ludici",
  description: "Associazione Ludica - Tana del Goblin di Pisa",
  openGraph: {
    title: "OxzyO - Orizzonti Ludici",
    description: "Associazione Ludica - Tana del Goblin di Pisa",
    siteName: "OxzyO - Orizzonti Ludici",
    images: [
      {
        url: "/images/og-default.png", // place your image here (1200×630 px recommended)
        width: 1200,
        height: 630,
        alt: "OxzyO - Orizzonti Ludici",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OxzyO - Orizzonti Ludici",
    description: "Associazione Ludica - Tana del Goblin di Pisa",
    images: ["/images/og-default.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#fd7c01",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const skipLabel = locale === "it" ? "Passa al contenuto principale" : "Skip to main content";
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cf.geekdo-images.com" />
      </head>
      <body className={`${poppins.variable} ${inter.variable} antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded-lg focus:shadow-lg focus:outline-none"
        >
          {skipLabel}
        </a>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
