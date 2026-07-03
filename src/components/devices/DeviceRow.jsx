import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Video, HelpCircle, Cpu, Settings } from 'lucide-react';

export default function DeviceRow({
  id,
  title,
  subtitle,
  devices,
  allSensors,
  allAccessories,
  onInspectDevice,
  hideHeader = false,
  rowsCount = 1,
}) {
  const scrollContainerRef = useRef(null);
  const [showLeftArrow,  setShowLeftArrow]  = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScrollState = () => {
    const el = scrollContainerRef.current;
    if (el) {
      setShowLeftArrow(el.scrollLeft > 5);
      setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
    }
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScrollState);
    setTimeout(checkScrollState, 200);
    const observer = new ResizeObserver(() => checkScrollState());
    observer.observe(el);
    return () => { el.removeEventListener('scroll', checkScrollState); observer.disconnect(); };
  }, [devices]);

  const handleScroll = (direction) => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollBy({ left: direction === 'left' ? -(el.clientWidth * 0.75) : el.clientWidth * 0.75, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative flex flex-col my-4 group/row w-full z-10">
      {!hideHeader && (
        <div className="flex items-baseline justify-between mb-3 px-1">
          <div>
            <h3 className="font-sans font-extrabold text-slate-900 uppercase tracking-tight text-base sm:text-lg flex items-center gap-2">
              <span className="w-2.5 h-5 bg-red-600 rounded-sm inline-block" />
              {title}
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 ml-2">
                {devices.length} {devices.length === 1 ? 'Device' : 'Devices'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-sans tracking-wide mt-0.5">{subtitle}</p>
          </div>
        </div>
      )}

      <div className="relative flex items-center w-full">
        {showLeftArrow && (
          <button
            onClick={() => handleScroll('left')}
            className="hidden md:flex absolute left-0 top-0 bottom-0 w-12 sm:w-16 bg-slate-950/25 hover:bg-slate-950/50 text-white items-center justify-center z-30 opacity-100 md:opacity-0 md:group-hover/row:opacity-100 transition-all duration-300 border-r border-white/5 cursor-pointer backdrop-blur-sm group/btn"
            aria-label="Scroll Left"
          >
            <ChevronLeft className="w-8 h-8 group-hover/btn:scale-125 transition-transform text-white/40 hover:text-white" />
          </button>
        )}
        {showRightArrow && (
          <button
            onClick={() => handleScroll('right')}
            className="hidden md:flex absolute right-0 top-0 bottom-0 w-12 sm:w-16 bg-slate-950/25 hover:bg-slate-950/50 text-white items-center justify-center z-30 opacity-100 md:opacity-0 md:group-hover/row:opacity-100 transition-all duration-300 border-l border-white/5 cursor-pointer backdrop-blur-sm group/btn"
            aria-label="Scroll Right"
          >
            <ChevronRight className="w-8 h-8 group-hover/btn:scale-125 transition-transform text-white/40 hover:text-white" />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          className={`w-full overflow-x-auto relative py-3 px-1 scroll-smooth scrollbar-none snap-x ${
            rowsCount > 1
              ? 'grid grid-rows-3 grid-flow-col gap-x-5 gap-y-4 auto-cols-max'
              : 'flex gap-5'
          }`}
        >
          {devices.length === 0 ? (
            <div className="w-full min-h-[160px] flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-400 py-8 px-4 text-center select-none snap-start">
              <HelpCircle className="w-8 h-8 mb-2 stroke-1 text-slate-300" />
              <p className="text-sm font-medium">No devices fit these specific combinations.</p>
              <p className="text-xs text-slate-400 mt-1">Try relaxing active filters or custom sensor demands.</p>
            </div>
          ) : (
            devices.map(device => {
              const hasVideo = device.camerasSupported > 0;
              return (
                <div
                  key={device.id}
                  id={`device_card_${device.id}`}
                  onClick={() => onInspectDevice(device)}
                  className="w-[280px] sm:w-[320px] shrink-0 bg-brand-card rounded-xl border border-white/10 hover:border-brand-primary shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 snap-start cursor-pointer flex flex-col overflow-hidden group select-none"
                >
                  <div className={`h-1.5 w-full ${hasVideo ? 'bg-brand-primary' : 'bg-white/10'}`} />
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h4 className="font-sans font-bold text-white text-base tracking-tight group-hover:text-brand-primary transition-colors">
                        {device.name}
                      </h4>
                      <span className={`text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0 ${
                        hasVideo
                          ? 'bg-brand-primary/15 text-brand-primary border border-brand-primary/30'
                          : 'bg-white/10 text-white/60 border border-white/10'
                      }`}>
                        {hasVideo ? (
                          <><Video className="w-3 h-3" />{device.camerasSupported} {device.camerasSupported === 1 ? 'Camera' : 'Cameras'}</>
                        ) : 'Tracking Only'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {device.platforms.map(p => {
                        let cls = 'bg-white/10 text-white/70 border-white/10';
                        if (p === 'Fleet360') cls = 'bg-sky-500/15 text-sky-400 border-sky-500/25';
                        if (p === 'TSP')      cls = 'bg-brand-primary/15 text-brand-primary border-brand-primary/25';
                        if (p === 'LocoNav')  cls = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
                        if (p === 'Fleetx')  cls = 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25';
                        return (
                          <span key={p} className={`text-[9px] font-mono leading-none px-1.5 py-0.5 rounded border ${cls}`}>
                            {p}
                          </span>
                        );
                      })}
                    </div>

                    <p className="text-xs text-white/50 line-clamp-2 leading-relaxed mb-4 flex-1">
                      {device.description || 'Flexible vehicle telemetry and coordinate tracker.'}
                    </p>

                    <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-2 font-sans">
                      <div className="flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-white/40" />
                        <div className="flex flex-col">
                          <span className="text-[9px] text-white/40 uppercase font-bold leading-none">Sensors</span>
                          <span className="text-xs font-semibold font-mono text-white/80">{device.sensors.length} Supported</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Settings className="w-3.5 h-3.5 text-white/40" />
                        <div className="flex flex-col">
                          <span className="text-[9px] text-white/40 uppercase font-bold leading-none">Accessories</span>
                          <span className="text-xs font-semibold font-mono text-white/80">{device.accessories.length} Compatible</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
