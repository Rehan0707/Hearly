import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, Loader2 } from 'lucide-react';
import HolographicCard from './ui/holographic-card';

const pricingTiers = [
  {
    name: 'Basic',
    description: 'For individuals exploring voice intelligence.',
    price: '$0',
    frequency: '/month',
    features: [
      '10 hours of transcription/month',
      'Basic speaker identification',
      'Standard latency (~1s)',
      'Community support',
    ],
    cta: 'Get Started Free',
    isPopular: false,
  },
  {
    name: 'Pro',
    description: 'For professionals and power users.',
    price: '$9',
    frequency: '/month',
    features: [
      'Unlimited transcription',
      'Real-time emotion detection',
      'AI meeting summaries & action items',
      'Sub-200ms ultra-low latency',
      'Priority email support',
    ],
    cta: 'Start 14-Day Trial',
    isPopular: true,
  },
  {
    name: 'Enterprise',
    description: 'For large teams requiring strict security.',
    price: 'Custom',
    frequency: '',
    features: [
      'Custom neural models',
      'SSO & SAML integration',
      'Dedicated VPC deployment',
      '24/7 priority phone support',
      'Custom SLA',
    ],
    cta: 'Contact Sales',
    isPopular: false,
  },
];

export default function Pricing({ onSelectPlan }) {
  const [isAnnual, setIsAnnual] = useState(true);
  const [toast, setToast] = useState(null);
  const [loadingTier, setLoadingTier] = useState(null);

  const handleCTA = (e, tier) => {
    e.preventDefault();
    if (tier.name === 'Enterprise') {
      setToast('Please contact sales@hearly.com for enterprise plans.');
      setTimeout(() => setToast(null), 4000);
      return;
    }

    setLoadingTier(tier.name);
    setTimeout(() => {
      setLoadingTier(null);
      if (onSelectPlan) {
        onSelectPlan({
          ...tier,
          isAnnual
        });
      }
    }, 600);
  };

  return (
    <section id="pricing" style={{ padding: '140px 0', position: 'relative' }}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            style={{
              position: 'fixed',
              bottom: '40px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#050505',
              border: '1px solid var(--brand-crimson)',
              color: '#FFFFFF',
              padding: '16px 24px',
              borderRadius: '12px',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 10px 40px rgba(186, 247, 43, 0.2)',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
            }}
          >
            <Sparkles size={18} color="var(--brand-crimson)" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

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
            Simple pricing. <span style={{ color: 'var(--text-secondary)' }}>Infinite value.</span>
          </h2>
          <p style={{ maxWidth: '560px', margin: '0 auto', fontSize: '1.05rem', marginBottom: '40px' }}>
            Choose the perfect plan for your voice intelligence needs. No hidden fees or surprise charges.
          </p>

          {/* Billing Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <span style={{ color: isAnnual ? 'var(--text-secondary)' : 'var(--text-primary)', fontWeight: 500 }}>Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              style={{
                width: '56px',
                height: '32px',
                background: isAnnual ? 'var(--brand-crimson)' : 'rgba(255,255,255,0.1)',
                borderRadius: '100px',
                position: 'relative',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            >
              <motion.div
                layout
                initial={false}
                animate={{
                  x: isAnnual ? 26 : 4,
                }}
                style={{
                  width: '24px',
                  height: '24px',
                  background: isAnnual ? '#050505' : 'var(--text-primary)',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '4px',
                }}
              />
            </button>
            <span style={{ color: isAnnual ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 500 }}>
              Annually <span style={{ color: 'var(--brand-crimson)', fontSize: '0.8rem', marginLeft: '4px' }}>Save 20%</span>
            </span>
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
            const priceDisplay = tier.price === 'Custom' 
              ? 'Custom' 
              : isAnnual 
                ? `$${Math.floor(parseInt(tier.price.replace('$', '')) * 0.8)}` 
                : tier.price;

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

                  <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'baseline' }}>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={isAnnual ? 'annual' : 'monthly'}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        style={{ fontSize: '3rem', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.03em', display: 'inline-block' }}
                      >
                        {priceDisplay}
                      </motion.span>
                    </AnimatePresence>
                    {tier.frequency && (
                      <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>
                        {tier.frequency}
                      </span>
                    )}
                  </div>

                  <a
                    href="#"
                    onClick={(e) => handleCTA(e, { ...tier, price: priceDisplay })}
                    className={tier.isPopular ? "btn-primary" : "btn-outline"}
                    style={{ width: '100%', justifyContent: 'center', marginBottom: '40px' }}
                  >
                    {loadingTier === tier.name ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Loader2 size={20} />
                      </motion.div>
                    ) : (
                      tier.cta
                    )}
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
