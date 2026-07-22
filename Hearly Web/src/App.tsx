import React, { useEffect, useState } from 'react';
import Lenis from 'lenis';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Mic, History } from 'lucide-react';
import { Toaster } from 'sonner';

import Antigravity from './components/Antigravity';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import VideoShowcase from './components/VideoShowcase';
import { VoiceVisualizerDemo } from './components/VoiceVisualizerDemo';
import { Features } from './components/Features';
import { Architecture } from './components/Architecture';
import Pricing from './components/Pricing';
import Checkout from './components/Checkout';
import DownloadSection from './components/DownloadSection';
import SectionHeader from './components/SectionHeader';
import HearyPopupMockup from './components/HearyPopupMockup';
import { ExtensionBridge } from './components/ExtensionBridge';
import { Footer } from './components/Footer';
import CustomCursor from './components/ui/CustomCursor';

export const App: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'landing' | 'checkout'>('landing');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  // Extension Integration State
  const [extensionConnected, setExtensionConnected] = useState<boolean>(false);
  const [enrolledProfile, setEnrolledProfile] = useState<any>(null);
  const [meetings, setMeetings] = useState<any[]>([]);

  useEffect(() => {
    const handleExtensionMessage = (event: MessageEvent) => {
      if (event.data?.type === 'HEARLY_EXTENSION_CONNECTED') {
        setExtensionConnected(true);

        // Fetch speaker profile
        const profileReqId = crypto.randomUUID();
        const handleProfileResponse = (e: MessageEvent) => {
          if (e.data?.source === 'hearly-extension' && e.data?.requestId === profileReqId) {
            window.removeEventListener('message', handleProfileResponse);
            if (e.data?.profile) {
              setEnrolledProfile(e.data.profile);
            }
          }
        };
        window.addEventListener('message', handleProfileResponse);
        window.postMessage({
          source: 'hearly-web-page',
          type: 'HEARLY_WEB_GET_PROFILE',
          requestId: profileReqId
        }, '*');

        // Fetch transcripts
        const transcriptsReqId = crypto.randomUUID();
        const handleTranscriptsResponse = (e: MessageEvent) => {
          if (e.data?.source === 'hearly-extension' && e.data?.requestId === transcriptsReqId) {
            window.removeEventListener('message', handleTranscriptsResponse);
            if (e.data?.transcripts) {
              setMeetings(e.data.transcripts);
            }
          }
        };
        window.addEventListener('message', handleTranscriptsResponse);
        window.postMessage({
          source: 'hearly-web-page',
          type: 'HEARLY_WEB_GET_MEETINGS',
          requestId: transcriptsReqId
        }, '*');
      }
    };
    window.addEventListener('message', handleExtensionMessage);

    window.postMessage({
      source: 'hearly-web-page',
      type: 'HEARLY_WEB_CHECK_EXTENSION',
      requestId: 'initial'
    }, '*');

    return () => {
      window.removeEventListener('message', handleExtensionMessage);
    };
  }, []);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll);

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });
    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      lenis.destroy();
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (currentView === 'checkout') {
    return (
      <Checkout
        plan={selectedPlan}
        onBack={() => setCurrentView('landing')}
        onSuccess={(res: any) => {
          console.log('Payment success:', res);
          setCurrentView('landing');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-bg text-gray-100 flex flex-col font-sans selection:bg-accent selection:text-black relative overflow-x-hidden">
      <CustomCursor />
      
      {/* Top Scroll Indicator */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'var(--brand-crimson)',
          transformOrigin: '0%',
          scaleX,
          zIndex: 99999,
          boxShadow: '0 0 10px var(--brand-crimson)',
        }}
      />
      <Toaster position="bottom-right" />

      {/* Antigravity Particle Background Canvas */}
      <motion.div
        animate={{ opacity: isScrolled ? 0 : 1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: isScrolled ? 'none' : 'auto',
        }}
      >
        <Antigravity
          count={350}
          magnetRadius={8}
          ringRadius={8}
          waveSpeed={0.3}
          waveAmplitude={0.8}
          particleSize={0.9}
          lerpSpeed={0.05}
          color="#BAF72B"
          autoAnimate={false}
          particleVariance={0.8}
          rotationSpeed={0.05}
          depthFactor={0.8}
          pulseSpeed={2}
          particleShape="capsule"
          fieldStrength={8}
        />
      </motion.div>

      {/* Ambient Radial Glow Overlay */}
      <motion.div
        animate={{ opacity: isScrolled ? 0 : 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(181, 240, 61, 0.08) 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <Navbar extensionConnected={extensionConnected} />
      <ExtensionBridge onStatusChange={setExtensionConnected} />

      <main className="relative z-10 flex-1">
        <Hero extensionConnected={extensionConnected} />

        {/* Video Showcase (GSAP Parallax) */}
        <VideoShowcase />

        {/* Live Interactive Voice Ducking Demo */}
        <VoiceVisualizerDemo />

        {/* Features */}
        <Features />

        {/* Voice Enrollment Section */}
        <section id="how-it-works" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center">
            <SectionHeader
              tag="Voice Enrollment"
              tagIcon={Mic}
              title="Smart voice enrollment."
              titleHighlight="Zero friction."
              description="Identify and enroll speakers with high-fidelity analysis. Every voice is captured and attributed correctly in real-time."
            />

            <div className="relative flex justify-center">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true }}
              >
                <HearyPopupMockup screen="enrollment" enrolledProfile={enrolledProfile} meetings={meetings} />
              </motion.div>
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-accent/10 rounded-full blur-3xl -z-10 pointer-events-none"
              />
            </div>
          </div>
        </section>

        {/* Meeting History Section */}
        <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto border-t border-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center">
            <div className="relative flex justify-center order-2 lg:order-1">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true }}
              >
                <HearyPopupMockup screen="history" enrolledProfile={enrolledProfile} meetings={meetings} />
              </motion.div>
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-accent/5 rounded-full blur-3xl -z-10 pointer-events-none"
              />
            </div>

            <div className="order-1 lg:order-2">
              <SectionHeader
                tag="Meeting Intelligence"
                tagIcon={History}
                title="Intelligent meeting history."
                titleHighlight="Always in sync."
                description="Browse past meetings with AI-generated summaries and searchable transcripts. Never miss a decision again."
              />
            </div>
          </div>
        </section>

        {/* System Architecture */}
        <Architecture />

        {/* Pricing Section */}
        <Pricing onSelectPlan={(plan: any) => {
          setSelectedPlan(plan);
          setCurrentView('checkout');
          window.scrollTo(0, 0);
        }} />

        {/* Download Section (Anchor target #install) */}
        <DownloadSection />
      </main>

      <Footer />
    </div>
  );
};

export default App;
