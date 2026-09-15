import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

import AppLayout from "@/components/layout/AppLayout";
import { DemoModeProvider } from "@/context/DemoModeContext";
import DemoWidget from "@/components/DemoWidget";

export const metadata: Metadata = {
  title: "UNIFY-X Dashboard",
  description: "Transport monitoring system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body>
        <DemoModeProvider>
          <AppLayout>
            {children}
          </AppLayout>
          <DemoWidget />
        </DemoModeProvider>
      </body>
    </html>
  );
}
