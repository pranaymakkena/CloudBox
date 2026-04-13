import "../styles/Landing.css";
import {
  Navbar, Hero, TrustBar, Features,
  HowItWorks, WhyChoose, Testimonials,
  Pricing, CTA, Footer,
} from "../components/LandingComponents";
import ChatWidget from "../components/ChatWidget";

export default function Landing() {
  return (
    <div>
      <Navbar />
      <Hero />
      <TrustBar />
      <Features />
      <HowItWorks />
      <WhyChoose />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
      <ChatWidget mode="landing" />
    </div>
  );
}
