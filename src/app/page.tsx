import { AppShell } from "@/components/votetrue/DesignPrimitives";
import { HeroSection } from "@/components/votetrue/home/HeroSection";
import { HowItWorks } from "@/components/votetrue/home/HowItWorks";
import { TrustSection } from "@/components/votetrue/home/TrustSection";

export default function Home() {
  return (
    <AppShell active="home">
      <div className="page">
        <HeroSection />
        <hr className="divider" />
        <HowItWorks />
        <hr className="divider" />
        <TrustSection />
      </div>
    </AppShell>
  );
}
