import { useEffect, useState } from 'react';
import Lenis from 'lenis';
import Antigravity from './components/Antigravity';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import VideoShowcase from './components/VideoShowcase';
import DownloadSection from './components/DownloadSection';
import Features from './components/Features';
import Pricing from './components/Pricing';
import Checkout from './components/Checkout';

import { motion, useScroll, useSpring } from 'framer-motion';
import { Mic, History } from 'lucide-react';
import { Toaster } from 'sonner';
import HearyFooter from './components/ui/HearlyFooter';
import SectionHeader from './components/SectionHeader';
import HearyPopupMockup from './components/HearyPopupMockup';
import CustomCursor from './components/ui/CustomCursor';



/* ─── Main App ─── */
function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentView, setCurrentView] = useState('landing');
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Extension Integration State
  const [extensionConnected, setExtensionConnected] = useState(false);
  const [enrolledProfile, setEnrolledProfile] = useState(null);
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    const handleExtensionMessage = (event) => {
      if (event.data?.type === 'HEARLY_EXTENSION_CONNECTED') {
        setExtensionConnected(true);
        
        // Fetch speaker profile
        const profileReqId = crypto.randomUUID();
        const handleProfileResponse = (e) => {
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
        const handleTranscriptsResponse = (e) => {
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
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });
    let rafId;
    function raf(time) {
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
        onSuccess={(res) => {
          console.log('Payment success:', res);
          setCurrentView('landing');
        }} 
      />
    );
  }

  return (
    <div className="app">
      <CustomCursor />
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

      {/* Antigravity Particle Background */}
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

      {/* Ambient glow overlay */}
      <motion.div
        animate={{ opacity: isScrolled ? 0 : 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(186, 247, 43, 0.08) 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <Navbar extensionConnected={extensionConnected} />

      <main style={{ position: 'relative', zIndex: 1, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}>
          <Hero />

          {/* ─── Video Showcase (GSAP Parallax) ─── */}
          <VideoShowcase />

          <div className="section-divider" />

          {/* ─── Features ─── */}
          <Features />

          <div className="section-divider" />

          {/* ─── Voice Enrollment Section ─── */}
          <section id="how-it-works" style={{ padding: '120px 0' }}>
            <div className="section-container" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '80px',
              alignItems: 'center',
            }}>
              <SectionHeader
                tag="Voice Enrollment"
                tagIcon={Mic}
                title="Smart voice enrollment."
                titleHighlight="Zero friction."
                description="Identify and enroll speakers with high-fidelity analysis. Every voice is captured and attributed correctly in real-time."
              />

              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  viewport={{ once: true }}
                >
                  <HearyPopupMockup screen="enrollment" enrolledProfile={enrolledProfile} meetings={meetings} />
                </motion.div>
                {/* Glow */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '120%',
                  height: '120%',
                  background: 'radial-gradient(circle, rgba(186, 247, 43, 0.06) 0%, transparent 70%)',
                  zIndex: -1,
                  filter: 'blur(60px)',
                }} />
              </div>
            </div>

            {/* Responsive */}
            <style>{`
              @media (max-width: 992px) {
                #how-it-works .section-container {
                  grid-template-columns: 1fr !important;
                  gap: 48px !important;
                  text-align: center;
                }
              }
            `}</style>
          </section>

          <div className="section-divider" />

          {/* ─── Meeting History Section ─── */}
          <section style={{ padding: '120px 0' }}>
            <div className="section-container" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '80px',
              alignItems: 'center',
            }}>
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  viewport={{ once: true }}
                >
                  <HearyPopupMockup screen="history" enrolledProfile={enrolledProfile} meetings={meetings} />
                </motion.div>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '120%',
                  height: '120%',
                  background: 'radial-gradient(circle, rgba(186, 247, 43, 0.04) 0%, transparent 70%)',
                  zIndex: -1,
                  filter: 'blur(60px)',
                }} />
              </div>

              <SectionHeader
                tag="Meeting Intelligence"
                tagIcon={History}
                title="Intelligent meeting history."
                titleHighlight="Always in sync."
                description="Browse past meetings with AI-generated summaries and searchable transcripts. Never miss a decision again."
              />
            </div>

            <style>{`
              @media (max-width: 992px) {
                section:has(.mockup-card) .section-container {
                  grid-template-columns: 1fr !important;
                  gap: 48px !important;
                  text-align: center;
                }
              }
            `}</style>
          </section>

          {/* ─── Pricing Section ─── */}
          <Pricing onSelectPlan={(plan) => {
            setSelectedPlan(plan);
            setCurrentView('checkout');
            window.scrollTo(0, 0);
          }} />


        </div>
      </main>

      {/* ─── Download / Add to Chrome Section ─── */}
      <div style={{ position: 'relative', zIndex: 1, marginBottom: '10px' }}>
        <DownloadSection />
      </div>

      <HearyFooter />
    </div>
  );
}

export default App;
