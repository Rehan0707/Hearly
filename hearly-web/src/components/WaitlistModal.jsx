import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, CheckCircle2, ArrowRight, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { submitWaitlistEntry } from '../services/supabaseWaitlist';
import { sendWaitlistConfirmationEmail } from '../services/emailService';

export default function WaitlistModal({ isOpen, onClose, defaultPlan = null }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Student');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid personal email address');
      return;
    }

    setIsSubmitting(true);
    const result = await submitWaitlistEntry({
      email,
      use_case: role,
      interested_plan: defaultPlan || 'Basic',
    });
    setIsSubmitting(false);

    if (result && result.isDuplicate) {
      toast.info("You've already joined the waitlist!", {
        description: result.message || "We already have your email registered and will notify you when Hearly launches.",
      });
      setIsSubmitted(true);
      return;
    }

    // Trigger automated confirmation email for new subscribers directly
    await sendWaitlistConfirmationEmail(email, role).catch((err) => {
      console.warn('[WaitlistModal] Email delivery notice:', err);
    });

    setIsSubmitted(true);
    toast.success('Successfully added to the Hearly waitlist!', {
      description: "We've saved your details and will notify you when Hearly launches.",
    });
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setEmail('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(5, 5, 5, 0.85)',
            backdropFilter: 'blur(16px)',
          }}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '480px',
            background: '#0d0d0d',
            border: '1px solid rgba(186, 247, 43, 0.25)',
            borderRadius: '24px',
            padding: '36px 32px',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 30px rgba(186, 247, 43, 0.1)',
            overflow: 'hidden',
          }}
        >
          {/* Ambient Glow */}
          <div
            style={{
              position: 'absolute',
              top: '-80px',
              right: '-80px',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(186, 247, 43, 0.18) 0%, transparent 70%)',
              pointerEvents: 'none',
              filter: 'blur(40px)',
            }}
          />

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close waitlist modal"
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          >
            <X size={18} />
          </button>

          {!isSubmitted ? (
            <div>

              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.75rem',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  lineHeight: 1.25,
                  marginBottom: '10px',
                  letterSpacing: '-0.02em',
                }}
              >
                Get VIP Access to <span style={{ color: 'var(--brand-crimson)' }}>Hearly</span>
              </h3>

              <p
                style={{
                  fontSize: '0.92rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  marginBottom: '28px',
                }}
              >
                The Hearly browser extension is launching soon. Join the waitlist to get early beta invites, locked-in early pricing, and exclusive updates.
              </p>

              {defaultPlan && (
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    marginBottom: '20px',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Interested Plan: <strong style={{ color: '#fff' }}>{defaultPlan}</strong></span>
                  <span style={{ color: 'var(--brand-crimson)', fontSize: '0.75rem', fontWeight: 600 }}>Price revealed at launch</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Personal Email Address *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={18}
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                      }}
                    />
                    <input
                      type="email"
                      required
                      placeholder="name@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '12px',
                        padding: '14px 16px 14px 44px',
                        color: '#FFFFFF',
                        fontSize: '0.95rem',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                        boxSizing: 'border-box',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--brand-crimson)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(186, 247, 43, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Primary Use Case
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(20, 20, 20, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      color: '#FFFFFF',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Student">Student / Academic</option>
                    <option value="Software Engineer">Software Engineer / Developer</option>
                    <option value="Product Manager">Product Manager / Designer</option>
                    <option value="Working Professional">Working Professional</option>
                    <option value="Researcher / Journalist">Researcher / Journalist</option>
                    <option value="Executive / Founder">Executive / Founder / Leader</option>
                    <option value="Sales / Marketing">Sales / Marketing / Support</option>
                    <option value="Consultant / Freelancer">Consultant / Freelancer</option>
                    <option value="Educator / Teacher">Educator / Teacher</option>
                    <option value="Healthcare / Legal">Healthcare / Legal Professional</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    background: 'var(--brand-crimson)',
                    color: '#050505',
                    border: 'none',
                    borderRadius: '100px',
                    padding: '16px',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.25 ease',
                    boxShadow: '0 4px 20px rgba(186, 247, 43, 0.25)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 24px rgba(186, 247, 43, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(186, 247, 43, 0.25)';
                  }}
                >
                  {isSubmitting ? 'Joining Waitlist...' : 'Join Waitlist Now'}
                  {!isSubmitting && <ArrowRight size={18} />}
                </button>

                <div
                  style={{
                    marginTop: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <Lock size={12} />
                  No spam. Unsubscribe anytime.
                </div>
              </form>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center', padding: '12px 0' }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(186, 247, 43, 0.15)',
                  color: 'var(--brand-crimson)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  border: '1px solid var(--brand-crimson-glow)',
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.6rem',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  marginBottom: '8px',
                }}
              >
                You're on the Waitlist! 🎉
              </h3>

              <p
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  marginBottom: '24px',
                }}
              >
                We've reserved your spot. Check <strong style={{ color: '#fff' }}>{email}</strong> soon for launch invitations and exclusive beta access.
              </p>

              <button
                onClick={handleReset}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  borderRadius: '100px',
                  padding: '12px 28px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
              >
                Done
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
