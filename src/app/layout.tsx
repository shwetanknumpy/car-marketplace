import type { Metadata } from "next";
import { Toaster } from "sonner";
import Providers from "@/components/providers";
import Navbar from "@/components/navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AutoMarket — Buy & Sell Cars",
    template: "%s | AutoMarket",
  },
  description:
    "AutoMarket is the premier platform to buy and sell pre-owned vehicles. Browse thousands of verified listings from trusted sellers.",
  keywords: ["car marketplace", "buy cars", "sell cars", "used cars", "auto dealer"],
  authors: [{ name: "AutoMarket" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
    siteName: "AutoMarket",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              duration: 4000,
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
