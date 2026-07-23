import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

const developers = [
  {
    role: 'Backend\ndeveloper',
    name: 'Backend Engineer',
    image: '/images/dev-backend-1.png',
    description:
      'Build scalable voice processing pipelines with real-time transcription and AI-powered insights.',
  },
  {
    role: 'Backend\ndeveloper',
    name: 'Backend Engineer',
    image: '/images/dev-backend-2.png',
    description:
      'Design robust API architectures for agent orchestration and intelligent audio workflows.',
  },
  {
    role: 'Frontend\ndeveloper',
    name: 'UI/UX & Frontend',
    image: '/images/dev-frontend.png',
    description:
      'Streamline UX development by leveraging browser-in-the-loop agents to automate repetitive tasks.',
  },
];

export default function DevelopersSection() {
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scroll = (direction) => {
    const container = scrollRef.current;
    if (!container) return;

    const cardWidth = container.querySelector('[data-dev-card]')?.offsetWidth || 0;
    const gap = 20;
    const scrollAmount = cardWidth + gap;

    if (direction === 'next') {
      setActiveIndex((prev) => Math.min(prev + 1, developers.length - 1));
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    } else {
      setActiveIndex((prev) => Math.max(prev - 1, 0));
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section
      id="developers"
      style={{
        padding: '120px 0 100px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Section header */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 48px',
          marginBottom: '64px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 'clamp(2.4rem, 5vw, 3.6rem)',
              lineHeight: 1.1,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: '24px',
              maxWidth: '550px',
            }}
          >
            Developers of <span className="gradient-text-crimson">Hearly</span>
          </h2>
          <p
            style={{
              fontSize: '1.1rem',
              lineHeight: 1.7,
              color: 'var(--text-secondary)',
              maxWidth: '520px',
            }}
          >
            Whether you are a frontend designer, backend architect building
            voice pipelines, or anyone in between.
          </p>
        </motion.div>
      </div>

      {/* Cards carousel */}
      <div style={{ position: 'relative' }}>
        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            gap: '20px',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            paddingLeft: '48px',
            paddingRight: '48px',
            paddingBottom: '16px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {developers.map((dev, index) => (
            <motion.div
              key={index}
              data-dev-card
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: index * 0.12,
                ease: [0.16, 1, 0.3, 1],
              }}
              viewport={{ once: true }}
              style={{
                flex: '0 0 calc(55% - 10px)',
                maxWidth: '660px',
                minWidth: '400px',
                scrollSnapAlign: 'start',
                padding: '8px',
                background: 'rgba(0,0,0,0.02)',
                borderRadius: '28px',
                border: '1px solid rgba(0,0,0,0.04)',
              }}
            >
              {/* Card */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '4 / 3',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  background: '#e8e8e8',
                  cursor: 'pointer',
                  marginBottom: '20px',
                }}
              >
                {/* Developer image */}
                <img
                  src={dev.image}
                  alt={dev.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center top',
                  }}
                />

                {/* Role overlay — bottom-left */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '28px',
                    left: '28px',
                    zIndex: 2,
                  }}
                >
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 500,
                      fontSize: 'clamp(1.8rem, 3vw, 2.6rem)',
                      lineHeight: 1.1,
                      color: '#FFFFFF',
                      whiteSpace: 'pre-line',
                      textShadow: '0 2px 20px rgba(0,0,0,0.3)',
                    }}
                  >
                    {dev.role}
                  </h3>
                </div>

                {/* "Watch case" pill — top-center */}
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)',
                    padding: '8px 18px',
                    borderRadius: '100px',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                    color: '#1a1a1a',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    cursor: 'pointer',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform =
                      'translateX(-50%) scale(1.05)';
                    e.currentTarget.style.boxShadow =
                      '0 4px 20px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform =
                      'translateX(-50%) scale(1)';
                    e.currentTarget.style.boxShadow =
                      '0 2px 12px rgba(0,0,0,0.08)';
                  }}
                >
                  {/* Play triangle */}
                  <svg
                    width="8"
                    height="10"
                    viewBox="0 0 8 10"
                    fill="none"
                  >
                    <path d="M7 5L1 9V1L7 5Z" fill="#1a1a1a" />
                  </svg>
                  Watch case
                </div>

                {/* Play button — bottom-right */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 3,
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                    transition: 'transform 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <svg
                    width="14"
                    height="16"
                    viewBox="0 0 14 16"
                    fill="none"
                  >
                    <path d="M13 8L1 15V1L13 8Z" fill="#1a1a1a" />
                  </svg>
                </div>

                {/* Bottom gradient for text readability */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '55%',
                    background:
                      'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)',
                    zIndex: 1,
                    pointerEvents: 'none',
                  }}
                />
              </div>

              {/* Card info below */}
              <div style={{ padding: '0 4px' }}>
                <h4
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    color: 'var(--text-primary)',
                    marginBottom: '6px',
                  }}
                >
                  {dev.name}
                </h4>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.88rem',
                    lineHeight: 1.6,
                    color: 'var(--text-secondary)',
                    maxWidth: '360px',
                  }}
                >
                  {dev.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Navigation arrows */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            marginTop: '32px',
          }}
        >
          <button
            onClick={() => scroll('prev')}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: '1px solid var(--border-subtle)',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              color: activeIndex === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
            }}
            onMouseEnter={(e) => {
              if (activeIndex > 0) {
                e.currentTarget.style.background = 'var(--text-primary)';
                e.currentTarget.style.color = '#FFFFFF';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color =
                activeIndex === 0 ? 'var(--text-muted)' : 'var(--text-primary)';
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={() => scroll('next')}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: '1px solid var(--border-subtle)',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              color:
                activeIndex === developers.length - 1
                  ? 'var(--text-muted)'
                  : 'var(--text-primary)',
            }}
            onMouseEnter={(e) => {
              if (activeIndex < developers.length - 1) {
                e.currentTarget.style.background = 'var(--text-primary)';
                e.currentTarget.style.color = '#FFFFFF';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color =
                activeIndex === developers.length - 1
                  ? 'var(--text-muted)'
                  : 'var(--text-primary)';
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Hide scrollbar CSS */}
      <style>{`
        [style*="scroll-snap-type"]::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
