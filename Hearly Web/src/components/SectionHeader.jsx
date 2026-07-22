import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const SectionHeader = ({ tag, tagIcon: TagIcon, title, titleHighlight, description, onLearnMore = null }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    viewport={{ once: true }}
    style={{ maxWidth: '480px' }}
  >
    {tag && (
      <div className="tag" style={{ marginBottom: '24px' }}>
        {TagIcon && <TagIcon size={14} />}
        {tag}
      </div>
    )}
    <h2 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>
      {title}{' '}
      {titleHighlight && <span style={{ color: 'var(--text-secondary)' }}>{titleHighlight}</span>}
    </h2>
    <p style={{ fontSize: '1.05rem', marginBottom: '32px' }}>{description}</p>
    <a href="#" onClick={(e) => {
      e.preventDefault();
      if (onLearnMore) onLearnMore();
      else toast('Coming soon', { description: 'More details will be available shortly.', style: { background: 'var(--bg-card)', color: '#fff', border: '1px solid var(--border-subtle)' } });
    }} style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      color: 'var(--brand-crimson)',
      fontFamily: 'var(--font-body)',
      fontWeight: 500,
      fontSize: '0.95rem',
      textDecoration: 'none',
      transition: 'gap 0.3s ease',
    }}>
      Learn more <ArrowRight size={16} />
    </a>
  </motion.div>
);

export default SectionHeader;
