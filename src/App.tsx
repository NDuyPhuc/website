/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { AuthProvider, useAuth } from './lib/auth';
import Navbar from './components/Navbar';
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
import Dashboard from './components/Dashboard';
import Loader from './components/Loader';

function MainContent() {
  const { user, loading } = useAuth();

  if (loading) return <Loader />;

  return (
    <main className="min-h-screen bg-black text-white selection:bg-red-600 selection:text-white">
      <Navbar />
      
      {user ? (
        <Dashboard />
      ) : (
        <>
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
        </>
      )}
      
      <Footer />
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
