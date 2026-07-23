import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Play, CheckCircle, Users, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import logo from '../assets/logo.svg';

const HearyPopupMockup = ({ screen }) => {
  const [enrollState, setEnrollState] = useState('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const handleEnroll = () => {
    setEnrollState('loading');
    setTimeout(() => {
      setEnrollState('success');
      toast.success('Voice enrolled successfully!', {
        style: { background: 'var(--bg-card)', color: '#fff', border: '1px solid var(--border-subtle)' }
      });
      setTimeout(() => setEnrollState('idle'), 4000);
    }, 1500);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      toast('Playing voice sample...', { 
        icon: '▶️', 
        style: { background: 'var(--bg-card)', color: '#fff', border: '1px solid var(--border-subtle)' } 
      });
    }
  };

  return (
    <div className="mockup-card">
      {/* Titlebar */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={logo} alt="Hearly Logo" style={{ width: '18px', height: '18px', objectFit: 'contain', borderRadius: '4px' }} />
          <span style={{
            fontSize: '0.9rem',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            color: '#FFFFFF',
          }}>
            Hearly
          </span>
          <span style={{
            fontSize: '0.65rem',
            padding: '2px 8px',
            background: 'rgba(171, 21, 9, 0.1)',
            color: 'var(--brand-crimson)',
            borderRadius: '20px',
            fontWeight: 600,
          }}>
            LIVE
          </span>
        </div>
        <button aria-label="Settings" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
          <Settings size={16} color="#FFFFFF" opacity={0.6} />
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '24px', minHeight: '380px' }}>
        {screen === 'enrollment' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
            <div style={{
              height: '140px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}>
              {[1, 0.4, 0.8, 0.2, 1, 0.6, 0.9, 0.3, 0.7, 0.5, 0.8, 0.3].map((h, i) => (
                <motion.div
                  key={i}
                  animate={isPlaying ? { height: [h * 30, h * 90, h * 30] } : { height: enrollState === 'loading' ? [h * 15, h * 45, h * 15] : h * 30 }}
                  transition={{
                    duration: isPlaying ? 0.8 : 1.4,
                    repeat: Infinity,
                    delay: i * 0.07,
                    ease: "easeInOut",
                  }}
                  style={{
                    width: '4px',
                    background: enrollState === 'success' ? '#10B981' : `linear-gradient(180deg, var(--brand-crimson) 0%, rgba(186, 247, 43, 0.3) 100%)`,
                    borderRadius: '3px',
                  }}
                />
              ))}
            </div>
            <h3 style={{ fontSize: '1.3rem', color: '#FFFFFF', fontFamily: 'var(--font-body)' }}>
              {enrollState === 'success' ? 'Speaker Enrolled' : 'Enrolling Speaker'}
            </h3>
            <p style={{
              fontSize: '0.88rem',
              color: 'rgba(255, 255, 255, 0.7)',
              lineHeight: 1.6,
            }}>
              {enrollState === 'success' ? 'Your voice print has been securely saved.' : 'Say "Hello Hearly" to start the voice identification process.'}
            </p>
            <div style={{
              display: 'flex',
              gap: '8px',
              marginTop: '16px',
            }}>
              <button 
                onClick={handleEnroll}
                disabled={enrollState !== 'idle'}
                style={{
                flex: 1,
                background: enrollState === 'success' ? '#10B981' : 'var(--brand-crimson)',
                color: '#050505',
                border: 'none',
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: enrollState === 'idle' ? 'pointer' : 'default',
                opacity: enrollState === 'loading' ? 0.7 : 1,
                transition: 'all 0.3s ease',
              }}>
                {enrollState === 'loading' ? 'Processing...' : enrollState === 'success' ? 'Done' : 'Confirm Voice'}
              </button>
              <button 
                aria-label={isPlaying ? 'Pause voice sample' : 'Play voice sample'}
                onClick={togglePlay}
                style={{
                padding: '14px 18px',
                background: isPlaying ? 'rgba(186, 247, 43, 0.1)' : 'rgba(255,255,255,0.04)',
                color: isPlaying ? 'var(--brand-crimson)' : '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}>
                {isPlaying ? <span style={{fontSize: '12px', fontWeight: 'bold'}}>||</span> : <Play size={16} />}
              </button>
            </div>
          </div>
        )}

        {screen === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{
              fontSize: '1.1rem',
              marginBottom: '4px',
              color: '#FFFFFF',
              fontFamily: 'var(--font-body)',
            }}>
              Recent Meetings
            </h3>
            {[
              { id: 1, title: "Weekly Sync", time: "2m ago", status: "Analyzed", speakers: 4, summary: "Discussed Q3 goals and upcoming product features. Action items assigned to engineering." },
              { id: 2, title: "Product Design", time: "1h ago", status: "Analyzed", speakers: 3, summary: "Reviewed new UI mockups for the dashboard. Approved the dark mode color palette changes." },
              { id: 3, title: "Client Call", time: "Yesterday", status: "Analyzed", speakers: 2, summary: "Onboarding call with Acme Corp. They requested an additional training session next week." },
              { id: 4, title: "Engineering Sync", time: "2 days ago", status: "Analyzed", speakers: 6, summary: "Resolved the build pipeline issues. Merged PR #402 into main. Discussed technical debt." },
            ].map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                style={{
                  padding: '14px 16px',
                  background: expandedId === m.id ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  border: expandedId === m.id ? '1px solid var(--border-glow)' : '1px solid rgba(255,255,255,0.05)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(186, 247, 43, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <img src={logo} alt="Hearly Logo" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                    </div>
                    <div>
                      <div style={{
                        fontSize: '0.92rem',
                        fontWeight: 600,
                        fontFamily: 'var(--font-body)',
                        color: '#FFFFFF',
                        marginBottom: '4px',
                      }}>
                        {m.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {m.time}
                        <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
                        <Users size={11} aria-label="Attendees" /> {m.speakers}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontSize: '0.72rem',
                    color: 'var(--brand-crimson)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-body)',
                  }}>
                    <CheckCircle size={13} aria-label="Status Analyzed" />
                    {m.status}
                  </div>
                </div>
                
                <AnimatePresence>
                  {expandedId === m.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: 'rgba(255,255,255,0.7)', 
                        lineHeight: 1.5,
                        paddingTop: '12px',
                        borderTop: '1px solid rgba(255,255,255,0.05)'
                      }}>
                        {m.summary}
                        <div style={{ marginTop: '8px' }}>
                          <button style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--brand-crimson)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }} onClick={(e) => {
                            e.stopPropagation();
                            toast('Opening full transcript...', { style: { background: 'var(--bg-card)', color: '#fff', border: '1px solid var(--border-subtle)' } });
                          }}>
                            View Full Transcript <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HearyPopupMockup;
