import React, { useState } from 'react';
import { Mic, Download, Menu, X } from 'lucide-react';

interface NavbarProps {
  extensionConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ extensionConnected = false }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/5 px-4 sm:px-6 lg:px-12 py-3.5 sm:py-4 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent shadow-md shadow-accent/10 shrink-0">
            <Mic className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Hearly
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 border border-accent/30 text-accent font-bold tracking-wide">
                AI v1.0
              </span>
            </span>
          </div>
        </div>

        {/* Extension Bridge Status Indicator - Desktop */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-semibold text-gray-300">
          <span className={`w-2 h-2 rounded-full ${extensionConnected ? 'bg-accent animate-ping' : 'bg-amber-400'}`} />
          <span>{extensionConnected ? 'Chrome Extension Active' : 'Extension Ready'}</span>
        </div>

        {/* Navigation Links - Desktop */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-xs lg:text-sm font-medium text-gray-400">
          <a href="#demo" className="hover:text-accent transition-colors py-1">Live Demo</a>
          <a href="#features" className="hover:text-accent transition-colors py-1">Features</a>
          <a href="#architecture" className="hover:text-accent transition-colors py-1">Architecture</a>
          <a href="#pricing" className="hover:text-accent transition-colors py-1">Pricing</a>
        </nav>

        {/* Desktop CTA & Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="#install"
            className="hidden sm:flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-xs font-bold text-black bg-accent hover:bg-accent/90 rounded-xl shadow-lg shadow-accent/20 transition-all hover:scale-[1.03] active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {extensionConnected ? 'Extension Active' : 'Install Extension'}
          </a>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden pt-4 pb-3 border-t border-white/10 mt-3 flex flex-col gap-3 animate-fadeIn">
          <a
            href="#demo"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-accent hover:bg-white/5"
          >
            Live Interactive Demo
          </a>
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-accent hover:bg-white/5"
          >
            Features
          </a>
          <a
            href="#architecture"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-accent hover:bg-white/5"
          >
            System Architecture
          </a>
          <a
            href="#pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-accent hover:bg-white/5"
          >
            Pricing Plans
          </a>
          <div className="pt-2 border-t border-white/5 flex items-center justify-between px-3">
            <span className="text-xs text-gray-400">
              Extension: <strong className="text-accent">{extensionConnected ? 'Connected' : 'Ready'}</strong>
            </span>
            <a
              href="#install"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2 text-xs font-bold text-black bg-accent rounded-lg"
            >
              Install Extension
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
