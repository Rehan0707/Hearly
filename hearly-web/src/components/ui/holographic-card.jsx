import { useRef } from 'react';

const HolographicCard = ({ children, className = '', style = {} }) => {
    const cardRef = useRef(null);

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const card = cardRef.current;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Calculate rotation based on mouse position
        const rotateX = (centerY - y) / 15;
        const rotateY = (x - centerX) / 15;

        card.style.setProperty('--x', `${x}px`);
        card.style.setProperty('--y', `${y}px`);
        card.style.setProperty('--bg-x', `${(x / rect.width) * 100}%`);
        card.style.setProperty('--bg-y', `${(y / rect.height) * 100}%`);
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        
        // Show the glow
        const glow = card.querySelector('.holo-glow');
        const shimmer = card.querySelector('.holo-shimmer');
        if (glow) glow.style.opacity = '1';
        if (shimmer) shimmer.style.opacity = '1';
    };

    const handleMouseLeave = () => {
        if (!cardRef.current) return;
        const card = cardRef.current;
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        card.style.setProperty('--x', `50%`);
        card.style.setProperty('--y', `50%`);
        card.style.setProperty('--bg-x', '50%');
        card.style.setProperty('--bg-y', '50%');
        
        // Hide the glow
        const glow = card.querySelector('.holo-glow');
        const shimmer = card.querySelector('.holo-shimmer');
        if (glow) glow.style.opacity = '0';
        if (shimmer) shimmer.style.opacity = '0';
    };

    return (
        <div 
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={className}
            style={{
                position: 'relative',
                transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                transformStyle: 'preserve-3d',
                willChange: 'transform',
                ...style
            }}
        >
            {/* Base Background - Frosted Glass */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(20, 20, 20, 0.6)',
                backdropFilter: 'blur(10px)',
                borderRadius: 'inherit',
                border: '1px solid rgba(186, 247, 43, 0.1)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 10px 30px -10px rgba(0, 0, 0, 0.5)',
                zIndex: 0
            }} />

            {/* Holographic Shimmer / Prismatic Effect */}
            <div 
                className="holo-shimmer"
                style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 'inherit',
                    background: `linear-gradient(
                        105deg,
                        transparent 20%,
                        rgba(186, 247, 43, 0.1) 25%,
                        rgba(255, 255, 255, 0.2) 50%,
                        rgba(186, 247, 43, 0.1) 75%,
                        transparent 80%
                    )`,
                    backgroundSize: '200% 200%',
                    backgroundPosition: `calc(100% - var(--bg-x, 50%)) calc(100% - var(--bg-y, 50%))`,
                    opacity: 0,
                    mixBlendMode: 'color-dodge',
                    pointerEvents: 'none',
                    transition: 'opacity 0.4s ease',
                    zIndex: 1,
                }}
            />

            {/* Holographic Spot Glow */}
            <div 
                className="holo-glow"
                style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 'inherit',
                    background: `radial-gradient(
                        circle at var(--bg-x, 50%) var(--bg-y, 50%), 
                        rgba(186, 247, 43, 0.15) 0%, 
                        transparent 60%
                    )`,
                    opacity: 0,
                    pointerEvents: 'none',
                    transition: 'opacity 0.4s ease',
                    zIndex: 2,
                }}
            />

            {/* Content Container (Lifted for 3D depth) */}
            <div 
                style={{
                    position: 'relative',
                    zIndex: 3,
                    transform: 'translateZ(40px)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default HolographicCard;
