import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import Stats from '../components/landing/Stats';
import HowItWorks from '../components/landing/HowItWorks';
import Testimonials from '../components/landing/Testimonials';
import Faq from '../components/landing/Faq';
import ComingSoon from '../components/landing/ComingSoon';
import CtaBanner from '../components/landing/CtaBanner';

export default function Landing() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <Testimonials />
        <Faq />
        <ComingSoon />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
