/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import Hero from './components/Hero';
import Trust from './components/Trust';
import About from './components/About';
import Services from './components/Services';
import WhyChoose from './components/WhyChoose';
import Results from './components/Results';
import Trainers from './components/Trainers';
import Membership from './components/Membership';
import Testimonials from './components/Testimonials';
import Gallery from './components/Gallery';
import FAQ from './components/FAQ';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';

export default function App() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Hero />
      <Trust />
      <About />
      <Services />
      <WhyChoose />
      <Results />
      <Trainers />
      <Membership />
      <Testimonials />
      <Gallery />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
