import AboutSection from "@/components/home/AboutSection";
import ContactSection from "@/components/home/ContactSection";
import FAQSection from "@/components/home/FAQSection";
import FloatingBookingOrb from "@/components/home/FloatingBookingOrb";
import Footer from "@/components/home/Footer";
import HeroSection from "@/components/home/HeroSection";
import ReviewsSection from "@/components/home/ReviewsSection";
import ServicesPreviewSection from "@/components/home/ServicesPreviewSection";
import StatisticsSection from "@/components/home/StatisticsSection";
import WhyChooseUsSection from "@/components/home/WhyChooseUsSection";

export default function HomePage() {
  return (
    <main className="overflow-hidden">
      <HeroSection />
      <AboutSection />
      <WhyChooseUsSection />
      <ServicesPreviewSection />
      <StatisticsSection />
      <ReviewsSection />
      <FAQSection />
      <ContactSection />
      <Footer />

      <FloatingBookingOrb />
    </main>
  );
}