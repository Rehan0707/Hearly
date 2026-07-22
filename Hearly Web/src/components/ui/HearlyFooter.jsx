"use client";

import logo from "../../assets/logo.svg";
import { toast } from 'sonner';

function HearyFooter() {
  const handleLinkClick = (e, name) => {
    const href = e.currentTarget.getAttribute('href');
    if (href === '#') {
      e.preventDefault();
      toast('Coming soon', { 
        description: `${name} is not available yet.`,
        style: { background: 'var(--bg-card)', color: '#fff', border: '1px solid var(--border-subtle)' }
      });
    }
  };

  return (
    <footer className="w-full px-6 pt-12 pb-8 md:px-12 md:pt-24 md:pb-16 relative z-10" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)' }}>
      {/* Top Section */}
      <div className="flex flex-col md:flex-row justify-between w-full max-w-[1400px] mx-auto mb-12 md:mb-16 gap-16">
        {/* Left */}
        <div className="text-3xl md:text-[2.75rem] leading-tight tracking-tight font-normal text-[var(--brand-crimson)]">
          Experience liftoff
        </div>
        
        {/* Right Links */}
        <div className="flex gap-16 md:gap-24 font-medium mr-4 md:mr-12">
          <div className="flex flex-col gap-4 text-[0.95rem] text-[#707070]">
            <a href="#" onClick={(e) => handleLinkClick(e, 'Add to Chrome')} className="hover:text-[#AB1509] transition-colors">Add to Chrome</a>
            <a href="#features" className="hover:text-[#AB1509] transition-colors">Product</a>
            <a href="#" onClick={(e) => handleLinkClick(e, 'Docs')} className="hover:text-[#AB1509] transition-colors">Docs</a>
            <a href="#" onClick={(e) => handleLinkClick(e, 'Changelog')} className="hover:text-[#AB1509] transition-colors">Changelog</a>
            <a href="#" onClick={(e) => handleLinkClick(e, 'Press')} className="hover:text-[#AB1509] transition-colors">Press</a>
            <a href="#" onClick={(e) => handleLinkClick(e, 'Releases')} className="hover:text-[#AB1509] transition-colors">Releases</a>
          </div>
          <div className="flex flex-col gap-4 text-[0.95rem] text-[#707070]">
            <a href="#" onClick={(e) => handleLinkClick(e, 'Blog')} className="hover:text-[#AB1509] transition-colors">Blog</a>
            <a href="#pricing" className="hover:text-[#AB1509] transition-colors">Pricing</a>
            <a href="#how-it-works" className="hover:text-[#AB1509] transition-colors">Use Cases</a>
          </div>
        </div>
      </div>

      {/* Middle Big Text */}
      <div className="w-full flex justify-center items-center pb-4 mb-12 md:mb-16">
         <h1 
           className="text-[20vw] leading-[0.8] font-medium tracking-normal text-[var(--brand-crimson)] select-none" 
           style={{ fontFamily: "var(--font-display)" }}
         >
           Hearly
         </h1>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col md:flex-row justify-between items-center text-sm text-[#707070] max-w-[1400px] mx-auto w-full">
        <div className="flex items-center gap-2 mb-8 md:mb-0 self-start md:self-auto">
          <img src={logo} alt="Hearly" className="w-6 h-6 object-contain rounded" />
          <span className="font-semibold text-[var(--brand-crimson)] text-base">Hearly</span>
        </div>
        
        <div className="flex flex-wrap justify-center md:justify-end gap-6 md:gap-8 font-medium">
          <a href="#" onClick={(e) => handleLinkClick(e, 'About Hearly')} className="hover:text-white transition-colors">About Hearly</a>
          <a href="#features" className="hover:text-white transition-colors">Products</a>
          <a href="#" onClick={(e) => handleLinkClick(e, 'Privacy Policy')} className="hover:text-white transition-colors">Privacy</a>
          <a href="#" onClick={(e) => handleLinkClick(e, 'Terms of Service')} className="hover:text-white transition-colors">Terms</a>
        </div>
      </div>
    </footer>
  );
}

export default HearyFooter;
