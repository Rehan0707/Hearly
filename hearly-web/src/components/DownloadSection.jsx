import { lazy, Suspense } from 'react';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const Antigravity = lazy(() => import('./Antigravity.jsx'));
const MACOS_DOWNLOAD_URL = (import.meta.env.VITE_MACOS_DOWNLOAD_URL || '').trim();

export default function DownloadSection({ onOpenWaitlist }) {
  return (
    <section
      style={{
        padding: '0 10px',
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '95vh',
          borderRadius: '20px',
          overflow: 'hidden',
          background: '#0a0a0a',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {/* Particle background — same as homepage */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
          }}
        >
          <Suspense fallback={null}>
            <Antigravity
              count={300}
              magnetRadius={8}
              ringRadius={8}
              waveSpeed={0.3}
              waveAmplitude={0.8}
              particleSize={0.9}
              lerpSpeed={0.02}
              color="#BAF72B"
              autoAnimate={false}
              particleVariance={0.8}
              rotationSpeed={0.05}
              depthFactor={0.8}
              pulseSpeed={2}
              particleShape="capsule"
              fieldStrength={8}
            />
          </Suspense>
        </div>

        {/* Content — vertically centered on the left */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            padding: '0 80px',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 'clamp(2.4rem, 5vw, 4rem)',
              lineHeight: 1.1,
              color: '#FFFFFF',
              maxWidth: '650px',
              letterSpacing: '-0.02em',
              marginBottom: '40px',
            }}
          >
            Get ready for Hearly on macOS{' '}
            <span style={{ color: 'var(--brand-crimson)' }}>Hearly</span>
          </h2>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            {/* Primary CTA */}
            <a
              href={MACOS_DOWNLOAD_URL || '#'}
              target={MACOS_DOWNLOAD_URL ? '_blank' : undefined}
              rel={MACOS_DOWNLOAD_URL ? 'noreferrer' : undefined}
              onClick={(e) => {
                if (!MACOS_DOWNLOAD_URL) {
                  e.preventDefault();
                  if (onOpenWaitlist) onOpenWaitlist();
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--brand-crimson)',
                color: '#050505',
                padding: '14px 28px',
                borderRadius: '100px',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: '0.9rem',
                textDecoration: 'none',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                border: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--brand-crimson)';
                e.currentTarget.style.border = '1px solid var(--brand-crimson)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--brand-crimson)';
                e.currentTarget.style.color = '#050505';
                e.currentTarget.style.border = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Sparkles size={16} />
              {MACOS_DOWNLOAD_URL ? 'Download for Apple silicon' : 'Join Waitlist — Get Early Access'}
            </a>

            {/* Secondary CTA */}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                toast('Coming soon', { 
                  description: 'Documentation is currently being written.',
                  style: { background: 'var(--bg-card)', color: '#fff', border: '1px solid var(--border-subtle)' }
                });
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'rgba(255, 255, 255, 0.85)',
                padding: '14px 28px',
                borderRadius: '100px',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                fontSize: '0.9rem',
                textDecoration: 'none',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              View Documentation
            </a>
          </div>

          <p
            style={{
              marginTop: '18px',
              color: 'rgba(255, 255, 255, 0.58)',
              fontSize: '0.82rem',
              maxWidth: '560px',
            }}
          >
            {MACOS_DOWNLOAD_URL
              ? 'Signed Apple-silicon download. Install the app and the separate virtual microphone component.'
              : 'The signed Apple-silicon download will appear here after release validation is complete.'}
          </p>
        </div>

        {/* Subtle bottom gradient for text readability */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      </div>
    </section>
  );
}
