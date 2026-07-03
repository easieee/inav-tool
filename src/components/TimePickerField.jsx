import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Clock } from 'lucide-react';

const HOURS   = Array.from({ length: 12 }, (_, i) => i + 1);          // 1–12
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0')); // 00,05,…55

function parse(hhmm) {
  if (!hhmm) return { h: 9, m: '00', p: 'AM' };
  const [hStr, mStr = '00'] = hhmm.split(':');
  let h = parseInt(hStr, 10) || 0;
  const p = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  // round minute to nearest 5
  const rawMin = parseInt(mStr, 10) || 0;
  const roundedMin = Math.round(rawMin / 5) * 5 % 60;
  return { h, m: String(roundedMin).padStart(2, '0'), p };
}

function to24(h, m, p) {
  let hour = h;
  if (p === 'AM' && h === 12) hour = 0;
  else if (p === 'PM' && h !== 12) hour += 12;
  return `${String(hour).padStart(2, '0')}:${m}`;
}

export default function TimePickerField({ value, onChange }) {
  const init = parse(value);
  const [open, setOpen] = useState(false);
  const [h, setH] = useState(init.h);
  const [m, setM] = useState(init.m);
  const [p, setP] = useState(init.p);
  const [popupStyle, setPopupStyle] = useState({});
  const triggerRef = useRef(null);
  const popupRef = useRef(null);

  useEffect(() => {
    const parsed = parse(value);
    setH(parsed.h); setM(parsed.m); setP(parsed.p);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const handler = e => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        popupRef.current  && !popupRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const openPopup = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const zoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
    const popupHeight = 280;
    const top    = rect.bottom / zoom;
    const left   = rect.left   / zoom;
    const width  = Math.max(rect.width / zoom, 208);
    const spaceBelow = window.innerHeight / zoom - top;
    setPopupStyle({
      top:   spaceBelow >= popupHeight ? top + 6 : rect.top / zoom - popupHeight - 6,
      left,
      width,
    });
    setOpen(v => !v);
  };

  const select = (newH, newM, newP) => {
    setH(newH); setM(newM); setP(newP);
    onChange(to24(newH, newM, newP));
  };

  const displayLabel = `${h}:${m} ${p}`;

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        onClick={openPopup}
        className="w-full flex items-center gap-2 bg-brand-dark border border-white/10 rounded-xl px-3 py-2.5 text-sm text-left hover:border-white/25 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 transition-colors cursor-pointer"
      >
        <Clock className="h-4 w-4 text-white shrink-0" />
        <span className="text-white">{displayLabel}</span>
      </button>

      {open && ReactDOM.createPortal(
        <div
          ref={popupRef}
          style={{ position: 'fixed', top: popupStyle.top, left: popupStyle.left, width: popupStyle.width, zIndex: 9999, transform: 'scale(0.85)', transformOrigin: 'top left' }}
          className="bg-[#070e1f] border border-white/15 rounded-2xl shadow-2xl p-3"
        >

          {/* AM / PM toggle */}
          <div className="flex gap-1.5 mb-3">
            {['AM', 'PM'].map(period => (
              <button key={period} type="button"
                onClick={() => select(h, m, period)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  p === period ? 'bg-brand-primary text-white' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                }`}>
                {period}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {/* Hours column */}
            <div className="flex-1">
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold text-center mb-1.5">Hour</p>
              <div className="grid grid-cols-3 gap-1">
                {HOURS.map(hr => (
                  <button key={hr} type="button"
                    onClick={() => select(hr, m, p)}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      h === hr ? 'bg-brand-primary text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                    }`}>
                    {hr}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-px bg-white/10 self-stretch" />

            {/* Minutes column */}
            <div className="flex-1">
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold text-center mb-1.5">Min</p>
              <div className="flex flex-col gap-1 max-h-36 overflow-y-auto scrollbar-none">
                {MINUTES.map(min => (
                  <button key={min} type="button"
                    onClick={() => select(h, min, p)}
                    className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      m === min ? 'bg-brand-primary text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                    }`}>
                    {min}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Done */}
          <div className="mt-3 pt-2.5 border-t border-white/10">
            <button type="button" onClick={() => setOpen(false)}
              className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer">
              Done
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
