import type { Metadata } from "next";

import FloatingBookingOrb from "@/components/home/FloatingBookingOrb";
import Footer from "@/components/home/Footer";
import ServicesExplorer from "@/components/services/ServicesExplorer";

export const metadata: Metadata = {
  title: "Cleaning Services | CleanNest",
  description:
    "Explore CleanNest home, office, deep-cleaning, and specialized cleaning services in Lebanon.",
};

export default function ServicesPage() {
  return (
    <>
      <main className="overflow-hidden">
        <ServicesExplorer />
      </main>

      <Footer />
      <FloatingBookingOrb />
    </>
  );
}