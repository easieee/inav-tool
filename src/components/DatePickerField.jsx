import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, getDaysInMonth, startOfMonth, getDay, addMonths, subMonths } from 'date-fns';

const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export default function DatePickerField({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => (value ? new Date(value + 'T00:00:00') : new Date()));
  const [popupStyle, setPopupStyle] = useState({});
  const triggerRef = useRef(null);
  const popupRef = useRef(null);

  const selected = value ? new Date(value + 'T00:00:00') : null;
  const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);

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
    const popupHeight = 310;
    const top    = rect.bottom / zoom;
    const left   = rect.left   / zoom;
    const width  = Math.max(rect.width / zoom, 288);
    const spaceBelow = window.innerHeight / zoom - top;
    setPopupStyle({
      top:   spaceBelow >= popupHeight ? top + 6 : rect.top / zoom - popupHeight - 6,
      left,
      width,
    });
    setOpen(v => !v);
  };

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Build 6×7 calendar grid
  const leadingBlanks = getDay(startOfMonth(viewDate));
  const daysInMonth   = getDaysInMonth(viewDate);
  const cells = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const pick = day => {
    if (!day) return;
    const str = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(str);
    setOpen(false);
  };

  const isSelected = day => day && selected &&
    selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === day;

  const isToday = day => day && todayMidnight.getFullYear() === year &&
    todayMidnight.getMonth() === month && todayMidnight.getDate() === day;

  const goToday = () => {
    const t = new Date();
    const str = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
    onChange(str);
    setViewDate(new Date());
    setOpen(false);
  };

  const displayLabel = selected ? format(selected, 'MMM d, yyyy') : 'Select date';

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        onClick={openPopup}
        className="w-full flex items-center gap-2 bg-brand-dark border border-white/10 rounded-xl px-3 py-2.5 text-sm text-left hover:border-white/25 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 transition-colors cursor-pointer"
      >
        <Calendar className="h-4 w-4 text-white shrink-0" />
        <span className={selected ? 'text-white' : 'text-white/30'}>{displayLabel}</span>
      </button>

      {open && ReactDOM.createPortal(
        <div
          ref={popupRef}
          style={{ position: 'fixed', top: popupStyle.top, left: popupStyle.left, width: popupStyle.width, zIndex: 9999, transform: 'scale(0.85)', transformOrigin: 'top left' }}
          className="bg-[#070e1f] border border-white/15 rounded-2xl shadow-2xl p-4"
        >
          {/* Month / year nav */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={() => setViewDate(d => subMonths(d, 1))}
              className="p-1.5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors cursor-pointer">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-white font-semibold text-sm">{MONTH_NAMES[month]} {year}</span>
            <button type="button" onClick={() => setViewDate(d => addMonths(d, 1))}
              className="p-1.5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors cursor-pointer">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {DOW.map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-white/25 uppercase py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, i) => (
              <button
                key={i}
                type="button"
                onClick={() => pick(day)}
                disabled={!day}
                className={`h-8 w-full rounded-lg text-xs font-medium transition-all ${
                  !day        ? 'invisible pointer-events-none' :
                  isSelected(day) ? 'bg-brand-primary text-white font-bold shadow-sm' :
                  isToday(day)    ? 'bg-white/10 text-white ring-1 ring-white/30' :
                                    'text-white/70 hover:bg-white/10 hover:text-white cursor-pointer'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Today shortcut */}
          <div className="mt-3 pt-2.5 border-t border-white/10 flex justify-center">
            <button type="button" onClick={goToday}
              className="text-xs text-brand-primary/80 hover:text-brand-primary font-semibold transition-colors cursor-pointer">
              Today
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
