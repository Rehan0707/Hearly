
import { motion } from 'framer-motion';
import { Mic, Brain, Shield, Waves, Zap, Globe } from 'lucide-react';
import HolographicCard from './ui/holographic-card';

const features = [
  {
    icon: Mic,
    title: "Speaker Identification",
    description: "Identify and attribute voices in real-time with advanced MFCC analysis and voiceprint matching.",
  },
  {
    icon: Waves,
    title: "Real-time Transcription",
    description: "Live speech-to-text with sub-200ms latency. Powered by Deepgram's neural speech models.",
  },
  {
    icon: Brain,
    title: "AI Meeting Summaries",
    description: "Automatic action items, decisions, and key takeaways generated from every conversation.",
  },
  {
    icon: Shield,
    title: "End-to-End Encryption",
    description: "256-bit AES encryption with local processing. Your voice data never leaves your device.",
  },
  {
    icon: Zap,
    title: "Emotion Detection",
    description: "Detect sentiment, confidence, and engagement levels across speakers in real-time.",
  },
  {
    icon: Globe,
    title: "Cross-Platform",
    description: "Available on macOS, Windows, and Linux. Seamless sync across all your devices.",
  },
];

const FeatureCard = ({ icon: Icon, title, description, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{
      duration: 0.6,
      delay: index * 0.08,
      ease: [0.16, 1, 0.3, 1],
    }}
    viewport={{ once: true, margin: '-50px' }}
    style={{ perspective: '1000px' }}
  >
    <HolographicCard
      style={{
        padding: '36px 32px',
        borderRadius: '24px',
        cursor: 'default',
        height: '100%'
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(186, 247, 43, 0.12) 0%, rgba(186, 247, 43, 0.04) 100%)',
          border: '1px solid rgba(186, 247, 43, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
          color: 'var(--brand-crimson)',
        }}
      >
        <Icon size={22} strokeWidth={1.8} />
      </div>
      <h3
        style={{
          marginBottom: '12px',
          color: 'var(--text-primary)',
          fontWeight: 500,
          fontSize: '1.05rem',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: '0.92rem',
          lineHeight: 1.7,
          color: 'var(--text-secondary)',
        }}
      >
        {description}
      </p>
    </HolographicCard>
  </motion.div>
);

const Features = () => {
  return (
    <section id="features" style={{ padding: '120px 0' }}>
      <div className="section-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: '72px' }}
        >
          <div className="tag" style={{ marginBottom: '24px', display: 'inline-flex' }}>
            <Zap size={14} />
            Capabilities
          </div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '20px' }}>
            Everything you need.{' '}
            <span style={{ color: 'var(--text-secondary)' }}>Nothing you don't.</span>
          </h2>
          <p style={{ maxWidth: '560px', margin: '0 auto', fontSize: '1.05rem' }}>
            Powerful tools designed for the next generation of voice-first applications and intelligent agents.
          </p>
        </motion.div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
        }}>
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} {...feature} index={i} />
          ))}
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 992px) {
          #features > div > div:last-child {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          #features > div > div:last-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
};

export default Features;
