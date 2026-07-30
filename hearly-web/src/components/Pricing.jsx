import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, Lock } from 'lucide-react';
import HolographicCard from './ui/holographic-card';

const pricingTiers = [
  {
    name: 'Basic',
    description: 'For individuals exploring voice intelligence.',
    priceBadge: 'Revealed at Launch',
    features: [
      '10 hours of transcription/month',
      'Basic speaker identification',
      'Standard latency (~1s)',
      'Community support',
    ],
    cta: 'Join Waitlist for Basic',
    isPopular: false,
  },
  {
    name: 'Pro',
    description: 'For professionals and power users.',
    priceBadge: 'Revealed at Launch',
    features: [
      'Unlimited transcription',
      'Real-time emotion detection',
      'AI meeting summaries & action items',
      'Sub-200ms ultra-low latency',
      'Priority email support',
    ],
    cta: 'Join Waitlist for Pro',
    isPopular: true,
  },
  {
    name: 'Enterprise',
    description: 'For large teams requiring strict security.',
    priceBadge: 'Revealed at Launch',
    features: [
      'Custom neural models',
      'SSO & SAML integration',
      'Dedicated VPC deployment',
      '24/7 priority phone support',
      'Custom SLA',
    ],
    cta: 'Join Waitlist for Enterprise',
    isPopular: false,
  },
];

export default function Pricing({ onOpenWaitlist }) {
  const handleCTA = (e, tierName) => {
    e.preventDefault();
    if (onOpenWaitlist) {
      onOpenWaitlist(tierName);
    }
  };

  return (
    <section id="pricing" style={{ padding: '140px 0', position: 'relative' }}>
      <div className="section-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: '72px' }}
        >
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '20px' }}>
            Flexible plans. <span style={{ color: 'var(--text-secondary)' }}>Prices revealed soon.</span>
          </h2>
          <p style={{ maxWidth: '620px', margin: '0 auto', fontSize: '1.05rem', marginBottom: '32px', lineHeight: 1.6 }}>
            Our Chrome extension is launching soon! Official plan pricing will be announced at launch. Join the waitlist now to unlock exclusive early-bird discounts and launch perks.
          </p>

          {/* Launch Notice Banner */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(186, 247, 43, 0.08)',
              border: '1px solid var(--brand-crimson-glow)',
              padding: '10px 20px',
              borderRadius: '100px',
              color: 'var(--brand-crimson)',
              fontSize: '0.88rem',
              fontWeight: 600,
            }}
          >
            <Lock size={15} />
            Pricing Unlocks at Official Launch — Join Waitlist for Early Access
          </div>
        </motion.div>

        {/* Pricing Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            alignItems: 'center',
          }}
        >
          {pricingTiers.map((tier, index) => {
            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true, margin: '-50px' }}
                style={{ height: '100%' }}
              >
                <HolographicCard
                  style={{
                    padding: '40px 32px',
                    borderRadius: '24px',
                    height: '100%',
                    backgroundColor: tier.isPopular ? 'rgba(30, 30, 30, 0.8)' : 'rgba(20, 20, 20, 0.6)',
                    border: tier.isPopular ? '1px solid var(--brand-crimson)' : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: tier.isPopular 
                      ? '0 20px 40px -10px rgba(186, 247, 43, 0.15), inset 0 1px 0 rgba(186, 247, 43, 0.3)' 
                      : 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                  }}
                >
                  {tier.isPopular && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      background: 'var(--brand-crimson)',
                      color: '#050505',
                      padding: '6px 16px',
                      borderRadius: '100px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      boxShadow: '0 4px 12px rgba(186, 247, 43, 0.3)',
                    }}>
                      <Sparkles size={14} />
                      Most Popular
                    </div>
                  )}

                  <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>{tier.name}</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px', minHeight: '44px' }}>
                    {tier.description}
                  </p>

                  <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '1.5rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      <Lock size={18} style={{ color: 'var(--brand-crimson)' }} />
                      Revealing Soon
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Prices announced at official launch
                    </span>
                  </div>

                  <a
                    href="#"
                    onClick={(e) => handleCTA(e, tier.name)}
                    className={tier.isPopular ? "btn-primary" : "btn-outline"}
                    style={{ width: '100%', justifyContent: 'center', marginBottom: '40px' }}
                  >
                    {tier.cta}
                  </a>

                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {tier.features.map((feature, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{
                          color: tier.isPopular ? 'var(--brand-crimson)' : 'var(--text-primary)',
                          marginTop: '2px'
                        }}>
                          <Check size={18} strokeWidth={2.5} />
                        </div>
                        <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </HolographicCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
