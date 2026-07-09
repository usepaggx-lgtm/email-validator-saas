import Header from '@/components/Header'
import Footer from '@/components/Footer'
import HeroSection from '@/components/HeroSection'
import TrustBar from '@/components/TrustBar'
import HowItWorks from '@/components/HowItWorks'
import FeaturesSection from '@/components/FeaturesSection'
import StatsSection from '@/components/StatsSection'
import TestimonialsSection from '@/components/TestimonialsSection'
import ApiDemoSection from '@/components/ApiDemoSection'
import PricingSection from '@/components/PricingSection'
import FAQSection from '@/components/FAQSection'
import CTASection from '@/components/CTASection'

export default function HomePage() {
  return (
    <>
      <Header />
      <HeroSection />
      <TrustBar />
      <HowItWorks />
      <FeaturesSection />
      <StatsSection />
      <TestimonialsSection />
      <ApiDemoSection />
      <PricingSection />
      <CTASection />
      <FAQSection />
      <Footer />
    </>
  )
}
