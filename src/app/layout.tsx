import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import SmoothScroll from "@/components/layout/SmoothScroll";
import PageTransition from "@/components/animations/PageTransition";
import Header from "@/components/layout/Header";
import ChatBot from "@/components/ui/ChatBot";
import PreloaderWrapper from "@/components/ui/PreloaderWrapper";

const playfair = Playfair_Display({ subsets: ["latin"], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Minimalist Folio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.variable} ${GeistMono.variable} ${playfair.variable} font-sans`} suppressHydrationWarning>
        <PreloaderWrapper>
          <ChatBot />
          <SmoothScroll>
            <Header />
            <PageTransition>
              {children}
            </PageTransition>
          </SmoothScroll>
        </PreloaderWrapper>
      </body>
    </html>
  );
}
