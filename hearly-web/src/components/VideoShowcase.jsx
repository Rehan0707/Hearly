import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function VideoShowcase() {
  const sectionRef = useRef(null);
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const container = containerRef.current;

    gsap.set(container, {
      y: 180,
      scale: 0.9,
      opacity: 0,
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 95%',
        end: 'top 20%',
        scrub: 1,
      },
    });

    tl.to(container, {
      y: 0,
      scale: 1,
      opacity: 1,
      duration: 1,
      ease: 'power2.out',
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().then(() => setPlaying(true)).catch((err) => {
        console.warn('Autoplay prevented by browser:', err);
      });
    }
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { 
      v.play().then(() => setPlaying(true)).catch(() => {}); 
    } else { 
      v.pause(); 
      setPlaying(false); 
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  return (
    <section
      ref={sectionRef}
      style={{
        padding: '20px 0 140px',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <div style={{ width: '100%', padding: '0 10px', boxSizing: 'border-box' }}>
        <div
          ref={containerRef}
          onClick={togglePlay}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16 / 9',
            borderRadius: '24px',
            overflow: 'hidden',
            background: '#000',
            boxShadow: '0 40px 120px rgba(0, 0, 0, 0.5), 0 8px 32px rgba(0, 0, 0, 0.3)',
            transform: 'translateZ(0)',
            willChange: 'transform, opacity',
            cursor: 'pointer',
          }}
        >
          {/* Video */}
          <video
            ref={videoRef}
            src="./hearly-demo.mp4"
            autoPlay
            muted
            playsInline
            loop
            preload="auto"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />

          {/* Dark scrim — visible when paused or hovered */}
          <motion.div
            animate={{ opacity: (!playing || hovered) ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.45)',
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />

          {/* Centre play/pause button */}
          <motion.div
            animate={{ opacity: (!playing || hovered) ? 1 : 0, scale: (!playing || hovered) ? 1 : 0.8 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 3,
              pointerEvents: 'none',
            }}
          >
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1.5px solid rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}>
              {playing ? <Pause size={28} fill="#fff" /> : <Play size={28} fill="#fff" style={{ marginLeft: 3 }} />}
            </div>
          </motion.div>

          {/* Bottom controls bar */}
          <motion.div
            animate={{ opacity: (!playing || hovered) ? 1 : 0, y: (!playing || hovered) ? 0 : 12 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '20px 24px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 4,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: playing ? 'var(--brand-crimson)' : 'rgba(255,255,255,0.4)',
                boxShadow: playing ? '0 0 8px var(--brand-crimson)' : 'none',
                transition: 'all 0.3s',
              }} />
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500, letterSpacing: '0.04em' }}>
                {playing ? 'LIVE DEMO' : 'HEARLY IN ACTION'}
              </span>
            </div>

            <button
              onClick={toggleMute}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                padding: '6px 10px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontWeight: 500,
                backdropFilter: 'blur(8px)',
              }}
            >
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              {muted ? 'Unmute' : 'Mute'}
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
