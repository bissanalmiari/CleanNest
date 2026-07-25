import "./globals.css";
import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";

import SafeMotionProvider from "@/components/shared/SafeMotionProvider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-poppins",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CleanNest — Book Trusted Cleaning Services in Minutes",
  description:
    "CleanNest is a unified cleaning services booking and operations platform for customers, cleaners, and administrators.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable}`}>
      <body>
        <SafeMotionProvider>{children}</SafeMotionProvider>
      </body>
    </html>
  );
}
