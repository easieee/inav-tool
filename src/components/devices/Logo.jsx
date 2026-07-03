import React from 'react';

export default function Logo({ className = 'h-9', showText = true }) {
  return (
    <div className={`flex items-center gap-2 select-none h-fit ${className}`}>
      <span className="w-2 h-2 rounded-full bg-brand-primary shadow-[0_0_8px_rgba(216,41,46,0.6)] shrink-0" />
      {showText && (
        <span className="font-sans font-black tracking-wider text-white text-base">
          iNAV <span className="text-white/80 font-light tracking-normal text-sm">Philippines Corp.</span>
        </span>
      )}
    </div>
  );
}
