import { Navbar } from "@/components/Navbar";
import { ScrollProgress } from "@/components/ScrollProgress";
import { Hero } from "@/components/sections/Hero";
import { Trust } from "@/components/sections/Trust";
import { ValueProp } from "@/components/sections/ValueProp";
import { Storytelling } from "@/components/sections/Storytelling";
import { Services } from "@/components/sections/Services";
import { ProcessTimeline } from "@/components/sections/ProcessTimeline";
import { Framework } from "@/components/sections/Framework";
import { Readiness } from "@/components/sections/Readiness";
import { WhyLumive } from "@/components/sections/WhyLumive";
import { Founder } from "@/components/sections/Founder";
import { Contact } from "@/components/sections/Contact";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Footer } from "@/components/sections/Footer";
import { BOOK_URL } from "@/lib/contact";

export default function Home() {
  return (
    <>
      <ScrollProgress />
      <Navbar />
      <main>
        <Hero />
        <Trust />
        <ValueProp />
        <Storytelling />
        <Services />
        <ProcessTimeline />
        <Framework />
        <WhyLumive />
        <Founder />
        <Readiness />
        <Contact />
        <FinalCTA />
      </main>
      <Footer />

      {/* sticky mobile CTA */}
      <a
        href={BOOK_URL}
        data-sound="cta"
        className="glow-cta fixed inset-x-4 bottom-4 z-50 flex items-center justify-center rounded-md bg-brass px-6 py-3.5 text-center font-semibold text-midnight shadow-lg lg:hidden"
      >
        Book a Call
      </a>
    </>
  );
}
