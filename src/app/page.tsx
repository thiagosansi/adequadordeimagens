import { Navbar } from '@/components/landing/navbar'
import { HeroSection } from '@/components/landing/hero-section'
import { TrustBar } from '@/components/landing/trust-bar'
import { ProblemSection } from '@/components/landing/problem-section'
import { SolutionSection } from '@/components/landing/solution-section'
import { FeaturesGrid } from '@/components/landing/features-grid'
import { BuiltForSection } from '@/components/landing/built-for-section'
import { EnterpriseSection } from '@/components/landing/enterprise-section'
import { RoadmapSection } from '@/components/landing/roadmap-section'
import { CtaSection } from '@/components/landing/cta-section'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050816]">
      <Navbar />
      <HeroSection />
      <TrustBar />
      <ProblemSection />
      <SolutionSection />
      <FeaturesGrid />
      <BuiltForSection />
      <EnterpriseSection />
      <RoadmapSection />
      <CtaSection />
    </div>
  )
}
