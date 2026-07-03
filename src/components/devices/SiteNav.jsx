import React, { useState } from 'react';
import { Menu, X, ChevronLeft } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Home',             href: 'https://www.inav.ph/' },
  { label: 'GPS Tracking',     href: 'https://www.inav.ph/gps-tracking-solution' },
  { label: 'GPS Navigation',   href: 'https://www.inav.ph/gps-navigation-solution' },
  { label: 'Car Camcorder',    href: 'https://www.inav.ph/car-camcorder' },
  { label: 'Android Auto',     href: 'https://www.inav.ph/android-auto-radio' },
  { label: 'Public Transport', href: 'https://www.inav.ph/public-transport-solution' },
  { label: 'Downloads',        href: 'https://www.inav.ph/downloads' },
];

/**
 * @param {{ onGoHome?: () => void }} props
 */
export default function SiteNav({ onGoHome }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const logoNode = onGoHome ? (
    <button
      onClick={onGoHome}
      className="flex items-center gap-2 select-none group cursor-pointer"
      aria-label="Back to home"
    >
      <span className="font-black text-3xl italic text-brand-primary leading-none">i</span>
      <span className="font-black text-3xl tracking-[0.15em] text-white leading-none">NAV</span>
    </button>
  ) : (
    <a
      href="https://www.inav.ph"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center select-none"
    >
      <span className="font-black text-3xl italic text-brand-primary leading-none">i</span>
      <span className="font-black text-3xl tracking-[0.15em] text-white leading-none">NAV</span>
    </a>
  );

  return (
    <header className="sticky top-0 z-50 bg-brand-darker border-b border-white/10 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">

        <div className="flex items-center gap-3">
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="flex items-center gap-0.5 text-xs text-white/40 hover:text-brand-primary transition-colors cursor-pointer select-none pr-2 border-r border-white/20"
              aria-label="Back to home"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">Home</span>
            </button>
          )}
          {logoNode}
        </div>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-7">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/60 hover:text-white transition-colors whitespace-nowrap"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 text-white/60 hover:text-white transition-colors"
          onClick={() => setMobileOpen(v => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="lg:hidden bg-brand-darker border-t border-white/10 px-4 py-3 flex flex-col gap-1">
          {onGoHome && (
            <button
              onClick={() => { onGoHome(); setMobileOpen(false); }}
              className="flex items-center gap-1.5 text-sm text-brand-primary font-semibold py-2 border-b border-white/10 mb-1"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Home
            </button>
          )}
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/60 hover:text-white py-2 border-b border-white/5 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
