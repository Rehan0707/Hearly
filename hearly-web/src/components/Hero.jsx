
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import logo from '../assets/logo.svg';
import Magnetic from './ui/Magnetic';

export default function Hero({ onOpenWaitlist }) {
  return (
    <section
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '140px 24px 100px',
        position: 'relative',
      }}
    >
      {/* Logo + Brand */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '32px',
        }}
      >
        <img
          src={logo}
          alt="Hearly"
          style={{
            width: '36px',
            height: '36px',
            objectFit: 'contain',
            borderRadius: '8px',
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: '1.05rem',
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}
        >
          Hearly
        </span>
      </motion.div>

      {/* Main Headline */}
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: 'clamp(2.8rem, 5.5vw, 4.5rem)',
          lineHeight: 1.15,
          color: 'var(--text-primary)',
          maxWidth: '800px',
          letterSpacing: '-0.01em',
          marginBottom: '48px',
        }}
      >
        {"Experience liftoff with the next-gen voice intelligence".split(" ").map((word, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.1 + i * 0.08,
              type: "spring",
              stiffness: 150,
              damping: 12
            }}
            style={{ display: 'inline-block', marginRight: '0.25em' }}
            className={word === "next-gen" ? "gradient-text-crimson" : ""}
          >
            {word}
          </motion.span>
        ))}
      </h1>

      {/* Version Tag */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{
          background: 'var(--brand-crimson-dim)',
          color: 'var(--brand-crimson)',
          padding: '6px 14px 6px 10px',
          borderRadius: 'var(--radius-pill)',
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          marginBottom: '20px',
          border: '1px solid var(--brand-crimson-glow)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '8px', height: '8px' }}>
          <span style={{
            position: 'absolute',
            width: '100%', height: '100%',
            borderRadius: '50%',
            background: 'var(--brand-crimson)',
            animation: 'pulse-ring 1.8s ease-out infinite',
          }} />
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand-crimson)', flexShrink: 0 }} />
        </span>
        Coming Soon — Waitlist Open
        <style>{`
          @keyframes pulse-ring {
            0% { transform: scale(1); opacity: 0.8; }
            100% { transform: scale(2.4); opacity: 0; }
          }
        `}</style>
      </motion.div>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
        style={{
          fontSize: 'clamp(1rem, 1.6vw, 1.15rem)',
          color: 'var(--text-secondary)',
          maxWidth: '540px',
          lineHeight: 1.65,
          marginBottom: '36px',
        }}
      >
        Real-time speaker identification, live transcription, and AI meeting summaries — right inside your browser.
      </motion.p>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <Magnetic strength={0.4}>
          <a href="#" className="btn-primary" onClick={(e) => {
            e.preventDefault();
            if (onOpenWaitlist) onOpenWaitlist();
          }}>
            <Sparkles size={18} strokeWidth={2} />
            Join Waitlist
          </a>
        </Magnetic>
        <Magnetic strength={0.3}>
          <a href="#features" className="btn-outline">
            Explore use cases
          </a>
        </Magnetic>
      </motion.div>
    </section>
  );
}
