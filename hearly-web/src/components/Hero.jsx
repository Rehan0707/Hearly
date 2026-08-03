import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import logo from '../assets/logo.svg';
import Magnetic from './ui/Magnetic';

export default function Hero({ onOpenWaitlist }) {
  const fullText = "Understand every conversation. Even the chaotic ones.";
  const [displayedLength, setDisplayedLength] = useState(0);

  useEffect(() => {
    if (displayedLength < fullText.length) {
      const nextChar = fullText[displayedLength];
      let delay = 85;
      if (nextChar === '.') {
        delay = 600;
      } else if (nextChar === ' ') {
        delay = 80;
      }
      const timer = setTimeout(() => {
        setDisplayedLength((prev) => prev + 1);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [displayedLength, fullText]);

  const currentText = fullText.slice(0, displayedLength);

  const renderTypedContent = () => {
    const parts = currentText.split(/(chaotic)/i);
    return parts.map((part, index) => {
      if (part.toLowerCase() === 'chaotic') {
        return (
          <span key={index} className="gradient-text-crimson">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

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

      {/* Main Headline with Typewriter Effect */}
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: 'clamp(2.8rem, 5.5vw, 4.5rem)',
          lineHeight: 1.15,
          color: 'var(--text-primary)',
          maxWidth: '850px',
          letterSpacing: '-0.01em',
          marginBottom: '48px',
          minHeight: '2.3em',
        }}
      >
        {renderTypedContent()}
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.7, repeat: Infinity, repeatType: 'reverse' }}
          style={{
            display: 'inline-block',
            width: '4px',
            height: '0.85em',
            backgroundColor: 'var(--brand-crimson)',
            marginLeft: '4px',
            verticalAlign: 'baseline',
            borderRadius: '2px',
            boxShadow: '0 0 10px var(--brand-crimson)',
          }}
        />
      </h1>

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
