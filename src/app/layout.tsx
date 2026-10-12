import "./globals.css";
import type { Metadata } from "next";
import localFont from "next/font/local";

import SafeMotionProvider from "@/components/shared/SafeMotionProvider";

const poppins = localFont({
  src: [
    { path: "./fonts/Poppins-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Poppins-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/Poppins-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-poppins",
});

const inter = localFont({
  src: "./fonts/Inter-Variable.ttf",
  weight: "100 900",
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
