import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Check, Loader2 } from 'lucide-react';
import logo from '../assets/logo.svg';
import { toast } from 'sonner';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function Checkout({ plan, onBack, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    
    // 1. Load Razorpay script dynamically
    const res = await loadRazorpayScript();
    if (!res) {
      toast.error('Razorpay SDK failed to load. Are you online?', { style: { background: 'var(--bg-card)', color: '#fff', border: '1px solid var(--border-subtle)' } });
      setLoading(false);
      return;
    }

    // 2. Setup options (Using dummy keys for demonstration)
    // To make this production ready, an Order ID should be fetched from the backend.
    const priceAmount = parseInt(plan.price.replace('$', '').replace(',', ''));
    // Convert to INR paise (approx $1 = 83 INR)
    const amountInPaise = priceAmount > 0 ? Math.floor(priceAmount * 83 * 100) : 100;
    
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_dummy',
      amount: amountInPaise, 
      currency: 'INR',
      name: 'Hearly',
      description: `${plan.name} Plan`,
      image: 'https://cdn.razorpay.com/logos/GhRQcyean79PqE_medium.png', // valid image URL just in case
      handler: function (response) {
        setIsSuccess(true);
        setTimeout(() => onSuccess(response), 2500);
      },
      prefill: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        contact: '9999999999'
      },
      theme: {
        color: '#BAF72B',
      },
    };

    try {
      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response) {
        toast.error(`Payment Failed: ${response.error.description}`, { style: { background: 'var(--bg-card)', color: '#fff', border: '1px solid var(--border-subtle)' } });
        setLoading(false);
      });
      paymentObject.open();
    } catch (err) {
      console.error(err);
      toast.error('Error initializing Razorpay. Check console.', { style: { background: 'var(--bg-card)', color: '#fff', border: '1px solid var(--border-subtle)' } });
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* Header */}
      <header style={{
        padding: '24px 40px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={logo} alt="Hearly" style={{ width: '24px', height: '24px' }} />
          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
            Hearly Checkout
          </span>
        </div>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'none', border: 'none', color: 'var(--text-secondary)',
          cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.9rem'
        }}>
          <ArrowLeft size={16} /> Back to site
        </button>
      </header>

      {/* Content */}
      <main style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 20px'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: '100%',
            maxWidth: '900px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '40px',
            background: 'rgba(20, 20, 20, 0.6)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '40px',
            boxShadow: '0 40px 80px rgba(0,0,0,0.5)'
          }}
        >
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                style={{
                  gridColumn: '1 / -1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '60px 0',
                  gap: '24px'
                }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'var(--brand-crimson)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Check size={40} color="#000" strokeWidth={3} />
                </motion.div>
                <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '0' }}>Payment Successful!</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Welcome to Hearly Voice Intelligence.</p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                style={{
                  display: 'contents'
                }}
              >
                {/* Left: Summary */}
                <div>
                  <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '8px' }}>Order Summary</h2>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Review your subscription details below.</p>
                  
                  <div style={{
                    background: '#0a0a0a',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>{plan.name} Plan</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Billed {plan.isAnnual ? 'Annually' : 'Monthly'}</p>
                      </div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {plan.price}
                      </div>
                    </div>
                    
                    <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.05)', margin: '20px 0' }} />
                    
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <li style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                        <Check size={16} color="var(--brand-crimson)" /> Unlimited transcription
                      </li>
                      <li style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                        <Check size={16} color="var(--brand-crimson)" /> Sub-200ms latency
                      </li>
                      <li style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                        <Check size={16} color="var(--brand-crimson)" /> VIP Email Support
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Right: Payment Action */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(186, 247, 43, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(186, 247, 43, 0.2)' }}>
                    <ShieldCheck size={24} color="var(--brand-crimson)" />
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      <strong>Secure Payment</strong><br/>
                      Your payment is securely processed by Razorpay.
                    </div>
                  </div>

                  <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="btn-primary"
                    style={{
                      width: '100%',
                      padding: '16px',
                      fontSize: '1.05rem',
                      justifyContent: 'center',
                      boxShadow: '0 8px 30px rgba(186, 247, 43, 0.4)'
                    }}
                  >
                    {loading ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                        <Loader2 size={20} />
                      </motion.div>
                    ) : (
                      `Pay ${plan.price}`
                    )}
                  </button>
                  <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '16px' }}>
                    By confirming your subscription, you allow Hearly to charge you for future payments in accordance with their terms.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          main > div {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
