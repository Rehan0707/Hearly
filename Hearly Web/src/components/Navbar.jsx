import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Globe, Menu, X } from 'lucide-react';
import logo from '../assets/logo.svg';
import { toast } from 'sonner';

const navLinks = [
  { label: 'Product', href: '#features' },
  { label: 'Use Cases', href: '#how-it-works', hasDropdown: true },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Blog', href: '#blog' },
  { label: 'Resources', href: '#', hasDropdown: true },
];

export default function Navbar({ extensionConnected }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavClick = (e, href) => {
    if (href === '#' || href === '#blog') {
      e.preventDefault();
      toast('Coming soon', { description: 'This section is currently under development.', style: { background: 'var(--bg-card)', color: '#fff', border: '1px solid var(--border-subtle)' } });
    }
  };

  return (
    <nav
      style={{
        background: scrolled ? 'rgba(5, 5, 5, 0.8)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: `1px solid ${scrolled ? 'var(--border-subtle)' : 'transparent'}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        {/* Left — Logo */}
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img src={logo} alt="Hearly" style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '7px' }} />
          <span style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: '1rem',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}>
            Hearly
          </span>
        </a>

        {/* Center — Nav Links (Desktop) */}
        <div className="nav-links" style={{ display: 'flex', gap: '32px' }}>
          {navLinks.map((link) => (
            <div 
              key={link.label}
              style={{ position: 'relative' }}
              onMouseEnter={() => link.hasDropdown && setHoveredLink(link.label)}
              onMouseLeave={() => link.hasDropdown && setHoveredLink(null)}
            >
              <a href={link.href} onClick={(e) => handleNavClick(e, link.href)} style={{
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontFamily: 'var(--font-body)',
                fontSize: '0.92rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'color 0.2s ease',
              }}>
                {link.label}
                {link.hasDropdown && <ChevronDown size={14} strokeWidth={2} />}
              </a>
              <AnimatePresence>
                {hoveredLink === link.label && link.hasDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      marginTop: '8px',
                      background: 'rgba(10, 10, 10, 0.98)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      minWidth: '160px',
                    }}
                  >
                    {link.label === 'Use Cases' && (
                      <>
                        <a href="#how-it-works" style={{ padding: '8px 12px', fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none', borderRadius: '4px' }}>Voice Identification</a>
                        <a href="#features" style={{ padding: '8px 12px', fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none', borderRadius: '4px' }}>Meeting Intelligence</a>
                      </>
                    )}
                    {link.label === 'Resources' && (
                      <>
                        <a href="#" onClick={(e) => handleNavClick(e, '#')} style={{ padding: '8px 12px', fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none', borderRadius: '4px' }}>Documentation</a>
                        <a href="#" onClick={(e) => handleNavClick(e, '#')} style={{ padding: '8px 12px', fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none', borderRadius: '4px' }}>API Reference</a>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Right — CTA + Mobile Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {extensionConnected ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(186, 247, 43, 0.1)',
            border: '1px solid rgba(186, 247, 43, 0.25)',
            color: '#BAF72B',
            padding: '10px 24px',
            borderRadius: 'var(--radius-pill)',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: '0.88rem',
            textDecoration: 'none',
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#BAF72B',
              borderRadius: '50%',
              boxShadow: '0 0 8px #BAF72B',
              display: 'inline-block',
            }} />
            Extension Connected
          </div>
        ) : (
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              toast('Preparing download...', { 
                description: 'The extension will be available in the Chrome Web Store soon.',
                icon: '⬇️',
                style: { background: 'var(--bg-card)', color: '#fff', border: '1px solid var(--border-subtle)' }
              });
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--brand-crimson)',
              color: '#050505',
              padding: '10px 24px',
              borderRadius: 'var(--radius-pill)',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: '0.88rem',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            Add to Chrome
            <Globe size={16} strokeWidth={2} />
          </a>
        )}

        {/* Mobile Hamburger */}
        <button
          aria-label="Toggle mobile menu"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: '4px',
          }}
          className="mobile-menu-btn"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'rgba(10, 10, 10, 0.98)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid var(--border-subtle)',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  handleNavClick(e, link.href);
                  setMobileOpen(false);
                }}
                style={{
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.95rem',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'background 0.2s ease',
                }}
              >
                {link.label}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 992px) {
          .mobile-menu-btn {
            display: block !important;
          }
        }
      `}</style>
    </nav>
  );
}
