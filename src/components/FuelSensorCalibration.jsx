import { useState, useMemo, useEffect } from 'react';
import { Trash2, Download, RefreshCw, Info, Copy, Check, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function FuelSensorCalibration({ onGoHome }) {
  // --- Sensor Parameters ---
  const [emptyV, setEmptyV] = useState(0.37);
  const [fullV, setFullV] = useState(4.70);
  const [sensorUnit, setSensorUnit] = useState('V');
  const [tankShape, setTankShape] = useState('linear');
  const [taperedBottomRatio, setTaperedBottomRatio] = useState(0.6);

  // --- Tank/Volume Specs ---
  const [maxCapacity, setMaxCapacity] = useState(60);
  const [intervalStep, setIntervalStep] = useState(5);

  // --- Custom Points ---
  const [customPoints, setCustomPoints] = useState([]);
  const [newCustomPtStr, setNewCustomPtStr] = useState('');

  // --- Overrides ---
  const [overrides, setOverrides] = useState({});
  const [editingOverrides, setEditingOverrides] = useState({});

  // --- UI state ---
  const [copiedStatus, setCopiedStatus] = useState(false);
  const [message, setMessage] = useState(null);
  const [simLiters, setSimLiters] = useState(30);

  useEffect(() => {
    if (simLiters > maxCapacity) setSimLiters(maxCapacity);
  }, [maxCapacity, simLiters]);

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const getCylinderVolumeFraction = (y) => {
    if (y <= 0) return 0;
    if (y >= 1) return 1;
    return (Math.acos(1 - 2 * y) - 2 * (1 - 2 * y) * Math.sqrt(y - y * y)) / Math.PI;
  };

  const getCylinderHeightFromVolume = (vFraction) => {
    if (vFraction <= 0) return 0;
    if (vFraction >= 1) return 1;
    let low = 0, high = 1;
    for (let i = 0; i < 20; i++) {
      const mid = (low + high) / 2;
      if (getCylinderVolumeFraction(mid) < vFraction) low = mid; else high = mid;
    }
    return (low + high) / 2;
  };

  const getTaperedHeightFromVolume = (x, r) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    if (Math.abs(r - 1.0) < 0.001) return x;
    const a = 1 - r, b = 2 * r, c = -x * (1 + r);
    const disc = b * b - 4 * a * c;
    if (disc < 0) return x;
    return (-b + Math.sqrt(disc)) / (2 * a);
  };

  const applyRangePreset = (preset) => {
    const map = {
      voltage:    [0.37,  4.70,  'V',  'Applied automotive 0.37V to 4.70V preset.'],
      current:    [4.00,  20.00, 'mA', 'Applied 4mA to 20mA current loop preset.'],
      resistance: [10.0,  180.0, 'Omega',  'Applied 10Ohm to 180Ohm sender preset.'],
      percent:    [0.00,  100.0, '%',  'Applied 0% to 100% relative level preset.'],
    };
    const [e, f, u, msg] = map[preset];
    setEmptyV(e); setFullV(f); setSensorUnit(u === 'Omega' ? 'Ohm' : u);
    showMessage(msg, 'success');
  };

  const items = useMemo(() => {
    if (maxCapacity <= 0 || intervalStep <= 0) return [];
    const pointsSet = new Set([0]);
    for (let i = intervalStep; i < maxCapacity; i += intervalStep) pointsSet.add(parseFloat(i.toFixed(2)));
    pointsSet.add(parseFloat(maxCapacity.toFixed(2)));
    customPoints.forEach(p => { if (p >= 0 && p <= maxCapacity) pointsSet.add(parseFloat(p.toFixed(2))); });
    return Array.from(pointsSet).sort((a, b) => a - b).map((liters, index) => {
      const volFrac = liters / maxCapacity;
      let heightPct = tankShape === 'cylinder' ? getCylinderHeightFromVolume(volFrac) * 100
                    : tankShape === 'tapered'  ? getTaperedHeightFromVolume(volFrac, taperedBottomRatio) * 100
                    : volFrac * 100;
      return {
        id: `cal-pt-${index}-${liters}`,
        liters, volumePct: volFrac * 100, heightPct,
        calculatedVal: emptyV + (fullV - emptyV) * (heightPct / 100),
        isOverridden: overrides[liters] !== undefined,
        overrideVal: overrides[liters],
      };
    });
  }, [maxCapacity, intervalStep, emptyV, fullV, tankShape, taperedBottomRatio, customPoints, overrides]);

  const simSensorValue = useMemo(() => {
    if (items.length === 0) return emptyV;
    const getVal = (item) => item.isOverridden && item.overrideVal !== undefined ? item.overrideVal : item.calculatedVal;
    if (simLiters <= 0) return getVal(items[0]);
    if (simLiters >= maxCapacity) return getVal(items[items.length - 1]);
    let pB = items[0], pT = items[items.length - 1];
    for (let i = 0; i < items.length - 1; i++) {
      if (simLiters >= items[i].liters && simLiters <= items[i + 1].liters) { pB = items[i]; pT = items[i + 1]; break; }
    }
    const denom = pT.liters - pB.liters;
    if (denom === 0) return getVal(pB);
    return getVal(pB) + (getVal(pT) - getVal(pB)) * ((simLiters - pB.liters) / denom);
  }, [simLiters, items, maxCapacity, emptyV]);

  const simHeightPct = useMemo(() => {
    const v = simLiters / maxCapacity;
    if (tankShape === 'cylinder') return getCylinderHeightFromVolume(v) * 100;
    if (tankShape === 'tapered')  return getTaperedHeightFromVolume(v, taperedBottomRatio) * 100;
    return v * 100;
  }, [simLiters, maxCapacity, tankShape, taperedBottomRatio]);

  const formatVal = (val) => {
    if (sensorUnit === 'mA') return `${val.toFixed(2)} mA`;
    if (sensorUnit === 'Ohm') return `${val.toFixed(1)} Ohm`;
    if (sensorUnit === '%')  return `${val.toFixed(1)} %`;
    return `${val.toFixed(3)} V`;
  };

  const handleAddCustomPoint = (e) => {
    if (e) e.preventDefault();
    const lValue = parseFloat(newCustomPtStr);
    if (isNaN(lValue)) { showMessage('Please enter a valid numeric value.', 'error'); return; }
    if (lValue < 0 || lValue > maxCapacity) { showMessage(`Point must be between 0 and ${maxCapacity}L.`, 'error'); return; }
    const rounded = parseFloat(lValue.toFixed(2));
    const existing = new Set(['0']);
    if (intervalStep > 0) for (let i = intervalStep; i < maxCapacity; i += intervalStep) existing.add(i.toFixed(2));
    existing.add(maxCapacity.toFixed(2));
    customPoints.forEach(p => existing.add(p.toFixed(2)));
    if (existing.has(rounded.toFixed(2))) { showMessage(`Point at ${rounded}L already exists.`, 'info'); setNewCustomPtStr(''); return; }
    setCustomPoints(prev => [...prev, rounded]);
    setNewCustomPtStr('');
    showMessage(`Added node at ${rounded} Liters.`, 'success');
  };

  const handleRemoveCustomPoint = (liters) => {
    setCustomPoints(prev => prev.filter(p => p !== liters));
    if (overrides[liters] !== undefined) { const c = { ...overrides }; delete c[liters]; setOverrides(c); }
    showMessage(`Removed node at ${liters}L.`, 'info');
  };

  const handleSaveOverride = (liters, val) => {
    const n = parseFloat(val);
    if (isNaN(n)) { showMessage('Invalid value.', 'error'); return; }
    setOverrides(prev => ({ ...prev, [liters]: n }));
    const c = { ...editingOverrides }; delete c[liters]; setEditingOverrides(c);
    showMessage(`Override: ${liters}L to ${n.toFixed(3)} ${sensorUnit}.`, 'success');
  };

  const handleResetOverride = (liters) => {
    setOverrides(prev => { const c = { ...prev }; delete c[liters]; return c; });
    showMessage(`Reset ${liters}L to analytical value.`, 'info');
  };

  const handleClearAllOverrides = () => {
    setOverrides({}); setEditingOverrides({});
    showMessage('All overrides cleared.', 'info');
  };

  const handleExportCSV = () => {
    const rows = items.map(item => {
      const v = item.isOverridden && item.overrideVal !== undefined ? item.overrideVal : item.calculatedVal;
      return `${item.liters.toFixed(2)},${v.toFixed(3)}`;
    });
    const blob = new Blob([`Liters,Sensor Reading\n${rows.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.setAttribute('download', `fuel_calib_${maxCapacity}L_${tankShape}.csv`);
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showMessage('CSV downloaded.', 'success');
  };

  const handleCopyToClipboard = () => {
    const rows = items.map(item => {
      const v = item.isOverridden && item.overrideVal !== undefined ? item.overrideVal : item.calculatedVal;
      return `${item.liters.toFixed(2)},${v.toFixed(3)}`;
    });
    navigator.clipboard.writeText(`Liters,Sensor Reading\n${rows.join('\n')}`)
      .then(() => { setCopiedStatus(true); setTimeout(() => setCopiedStatus(false), 2000); showMessage('Copied to clipboard.', 'success'); })
      .catch(() => showMessage('Copy failed.', 'error'));
  };

  const handleReset = () => {
    setEmptyV(0.37); setFullV(4.70); setSensorUnit('V'); setTankShape('linear');
    setTaperedBottomRatio(0.6); setMaxCapacity(60); setIntervalStep(5);
    setCustomPoints([]); setOverrides({}); setEditingOverrides({}); setSimLiters(30);
    showMessage('Workbench reset to defaults.', 'success');
  };

  const chartW = 580, chartH = 280, padX = 65, padY = 45;
  const minVal = Math.min(emptyV, fullV);
  const spanVal = Math.abs(fullV - emptyV) || 1;
  const getX = (l) => padX + (l / (maxCapacity || 1)) * (chartW - padX * 2);
  const getY = (val) => {
    const ratio = (val - minVal) / spanVal;
    const h = chartH - padY * 2;
    return emptyV < fullV ? chartH - padY - ratio * h : padY + ratio * h;
  };

  const chartLinePath = useMemo(() => {
    if (!items.length) return '';
    return items.map((item, i) => {
      const v = item.isOverridden && item.overrideVal !== undefined ? item.overrideVal : item.calculatedVal;
      return `${i === 0 ? 'M' : 'L'} ${getX(item.liters)} ${getY(v)}`;
    }).join(' ');
  }, [items, emptyV, fullV, maxCapacity]);

  const chartAreaPath = useMemo(() => {
    if (!items.length) return '';
    const zeroY = getY(emptyV < fullV ? minVal : Math.max(emptyV, fullV));
    let p = `M ${getX(0)} ${zeroY} `;
    items.forEach(item => {
      const v = item.isOverridden && item.overrideVal !== undefined ? item.overrideVal : item.calculatedVal;
      p += `L ${getX(item.liters)} ${getY(v)} `;
    });
    return p + `L ${getX(maxCapacity)} ${zeroY} Z`;
  }, [items, emptyV, fullV, maxCapacity]);

  return (
    <div className="min-h-screen bg-brand-dark text-white font-sans">
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -32, scale: 0.96 }}
            className="fixed top-5 right-5 z-50 max-w-sm shadow-2xl border border-white/15 bg-brand-card px-4 py-3 flex items-center gap-3 rounded-lg"
          >
            <div className={`w-2 h-2 rounded-full shrink-0 ${message.type === 'success' ? 'bg-emerald-400' : message.type === 'error' ? 'bg-red-400' : 'bg-white/40'}`} />
            <p className="text-xs font-medium text-white/90">{message.text}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="fixed top-0 left-0 right-0 z-50 bg-brand-darker border-b border-white/10 px-5 py-3 flex items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={onGoHome} className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors cursor-pointer font-medium">
            <ChevronLeft className="h-3.5 w-3.5" />
            Home
          </button>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex items-center gap-1.5 select-none">
            <span className="w-2 h-2 rounded-full bg-brand-primary shadow-[0_0_6px_rgba(216,41,46,0.6)] shrink-0" />
            <span className="font-black tracking-wider text-white text-base"><span className="italic">i</span>NAV</span>
          </div>
          <div className="w-px h-5 bg-white/10" />
          <h1 className="text-sm font-bold tracking-wide text-white/80 hidden sm:block">Fuel Sensor Calibration</h1>
        </div>
      </header>
      <div className="h-[53px]" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          <section className="lg:col-span-5 flex flex-col gap-5">

            <div className="bg-brand-darker/60 rounded-xl border border-white/10 shadow-lg p-6">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-5">
                <span className="w-1 h-5 bg-brand-primary rounded-full" />
                <h2 className="text-xs font-bold text-white uppercase tracking-widest">1. Signal Parameters</h2>
              </div>
              <div className="mb-5">
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-wider mb-2">Sensor Type Preset</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { key: 'voltage',    label: 'Voltage',    sub: '0.37 - 4.70 V',  unit: 'V'   },
                    { key: 'current',    label: 'Current',    sub: '4 - 20 mA',       unit: 'mA'  },
                    { key: 'resistance', label: 'Resistance', sub: '10 - 180 Ohm',    unit: 'Ohm' },
                    { key: 'percent',    label: 'Relative',   sub: '0 - 100 %',       unit: '%'   },
                  ].map(({ key, label, sub, unit }) => (
                    <button key={key} onClick={() => applyRangePreset(key)}
                      className={`px-3 py-2 text-left text-[10px] rounded-lg border transition-all cursor-pointer ${
                        sensorUnit === unit
                          ? 'bg-brand-primary/15 border-brand-primary/40 text-brand-primary font-bold'
                          : 'bg-brand-dark border-white/10 text-white/50 hover:bg-white/5 hover:text-white hover:border-white/20'
                      }`}>
                      <span className="block font-bold">{label}</span>
                      <span className={`block text-[9px] mt-0.5 ${sensorUnit === unit ? 'text-brand-primary/70' : 'text-white/25'}`}>{sub}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { id: 'emptyV', label: 'Empty Tank Signal', value: emptyV, setter: setEmptyV, hint: 'Sensor reading when tank is empty' },
                  { id: 'fullV',  label: 'Full Tank Signal',  value: fullV,  setter: setFullV,  hint: 'Sensor reading when tank is full' },
                ].map(({ id, label, value, setter, hint }) => (
                  <div key={id}>
                    <label htmlFor={`${id}-input`} className="block text-[10px] text-white/40 uppercase mb-1.5 font-bold tracking-wide">{label}</label>
                    <div className="flex rounded-lg border border-white/10 focus-within:border-brand-primary/60 bg-brand-dark transition-colors overflow-hidden">
                      <input id={`${id}-input`} type="number" step="0.01" value={value}
                        onChange={e => setter(parseFloat(e.target.value) || 0)}
                        className="w-full bg-transparent px-3 py-2 outline-none text-sm text-white font-mono" />
                      <span className="px-3 py-2 bg-white/5 text-white/40 text-xs flex items-center font-mono select-none border-l border-white/10">{sensorUnit}</span>
                    </div>
                    <p className="text-[9px] text-white/25 mt-1">{hint}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-brand-darker/60 rounded-xl border border-white/10 shadow-lg p-6">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-5">
                <span className="w-1 h-5 bg-brand-primary rounded-full" />
                <h2 className="text-xs font-bold text-white uppercase tracking-widest">2. Reservoir Geometry</h2>
              </div>
              <div className="mb-5">
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-wider mb-2">Tank Profile</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { key: 'linear',   top: 'Standard',  sub: 'Rectangular' },
                    { key: 'cylinder', top: 'Cylinder',  sub: 'Horizontal'  },
                    { key: 'tapered',  top: 'Tapered',   sub: 'Trapezoidal' },
                  ].map(({ key, top, sub }) => (
                    <button key={key} onClick={() => { setTankShape(key); showMessage(`Switched to ${key} profile.`, 'info'); }}
                      className={`flex flex-col items-center justify-center py-3 px-2 rounded-lg border transition-all cursor-pointer ${
                        tankShape === key
                          ? 'bg-brand-primary/15 border-brand-primary/40 text-brand-primary'
                          : 'bg-brand-dark border-white/10 text-white/50 hover:bg-white/5 hover:text-white hover:border-white/20'
                      }`}>
                      <span className="block text-[10px] font-bold">{top}</span>
                      <span className={`block text-[8px] mt-0.5 ${tankShape === key ? 'text-brand-primary/60' : 'text-white/25'}`}>{sub}</span>
                    </button>
                  ))}
                </div>
              </div>
              {tankShape === 'tapered' && (
                <div className="mb-5 p-3 bg-brand-dark rounded-lg border border-white/10">
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="taperedRatio-slider" className="text-[10px] font-bold text-white/50 uppercase">Bottom Width Ratio</label>
                    <span className="text-xs font-mono font-bold text-brand-primary">{(taperedBottomRatio * 100).toFixed(0)}%</span>
                  </div>
                  <input id="taperedRatio-slider" type="range" min="0.2" max="1.0" step="0.05" value={taperedBottomRatio}
                    onChange={e => setTaperedBottomRatio(parseFloat(e.target.value))}
                    className="w-full accent-brand-primary h-1 bg-white/10 cursor-pointer rounded-full" />
                  <p className="text-[9px] text-white/25 mt-1.5">Base width relative to top width</p>
                </div>
              )}
              <div className="space-y-4">
                {[
                  { id: 'maxCap', label: 'Max Capacity',  value: maxCapacity,  setter: v => setMaxCapacity(Math.max(1, v)),   suffix: 'Liters' },
                  { id: 'step',   label: 'Step Interval', value: intervalStep, setter: v => setIntervalStep(Math.max(0.1, v)), suffix: 'Liters' },
                ].map(({ id, label, value, setter, suffix }) => (
                  <div key={id}>
                    <label htmlFor={`${id}-input`} className="block text-[10px] text-white/40 uppercase mb-1.5 font-bold tracking-wide">{label}</label>
                    <div className="flex rounded-lg border border-white/10 focus-within:border-brand-primary/60 bg-brand-dark transition-colors overflow-hidden">
                      <input id={`${id}-input`} type="number" step="any" value={value}
                        onChange={e => setter(parseFloat(e.target.value) || 0)}
                        className="w-full bg-transparent px-3 py-2 outline-none text-sm text-white font-mono" />
                      <span className="px-3 py-2 bg-white/5 text-white/40 text-xs flex items-center font-mono select-none border-l border-white/10">{suffix}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-brand-darker/60 rounded-xl border border-white/10 shadow-lg p-6">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-5">
                <span className="w-1 h-5 bg-brand-primary rounded-full" />
                <h2 className="text-xs font-bold text-white uppercase tracking-widest">3. Level Simulator</h2>
              </div>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="simLiters-slider" className="text-[10px] font-bold text-white/40 uppercase tracking-wide">Simulated Volume</label>
                  <strong className="text-xs font-mono text-brand-primary">{simLiters.toFixed(1)} / {maxCapacity} L</strong>
                </div>
                <input id="simLiters-slider" type="range" min="0" max={maxCapacity} step="0.1" value={simLiters}
                  onChange={e => setSimLiters(parseFloat(e.target.value))}
                  className="w-full accent-brand-primary h-1 bg-white/10 cursor-pointer rounded-full" />
              </div>
              <div className="grid grid-cols-5 gap-4 items-center bg-brand-dark rounded-lg p-4 border border-white/10">
                <div className="col-span-2 flex justify-center">
                  <svg viewBox="0 0 100 120" className="w-20 h-28">
                    <rect x="10" y="10" width="80" height="100" fill="#050A18" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
                    {tankShape === 'cylinder' && <circle cx="50" cy="60" r="45" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="2,2" />}
                    {tankShape === 'tapered'  && <polygon points="20,110 80,110 90,10 10,10" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="2,2" />}
                    {tankShape === 'linear' && <rect x="10" y={110 - simHeightPct} width="80" height={simHeightPct} fill="url(#liquidGrad)" />}
                    {tankShape === 'cylinder' && (
                      <g>
                        <clipPath id="cylinderClip"><rect x="5" y={110 - simHeightPct} width="90" height={simHeightPct} /></clipPath>
                        <circle cx="50" cy="60" r="45" fill="url(#liquidGrad)" clipPath="url(#cylinderClip)" />
                      </g>
                    )}
                    {tankShape === 'tapered' && (
                      <g>
                        <clipPath id="taperedClip"><rect x="0" y={110 - simHeightPct} width="100" height={simHeightPct} /></clipPath>
                        <polygon points="20,110 80,110 90,10 10,10" fill="url(#liquidGrad)" clipPath="url(#taperedClip)" />
                      </g>
                    )}
                    {tankShape === 'tapered'  ? <polygon points="20,110 80,110 90,10 10,10" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinejoin="round" />
                     : tankShape === 'cylinder' ? <circle cx="50" cy="60" r="45" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
                     : <rect x="10" y="10" width="80" height="100" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />}
                    <line x1="50" y1="5" x2="50" y2="115" stroke="#D8292E" strokeWidth="3" />
                    <rect x="44" y="2" width="12" height="4" fill="#D8292E" />
                    <defs>
                      <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#0284c7" stopOpacity="0.85" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="col-span-3 flex flex-col gap-3">
                  <div>
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-wider">Probe Depth</p>
                    <p className="text-white font-bold text-sm mt-0.5">{simHeightPct.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-wider">Sensor Output</p>
                    <p className="text-brand-primary font-black text-lg mt-0.5 leading-none">{formatVal(simSensorValue)}</p>
                    <p className="text-[9px] text-white/25 mt-1">linear interpolation from table</p>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={handleReset}
              className="w-full py-2.5 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/20 hover:bg-white/5 text-xs uppercase font-bold tracking-wider transition-colors cursor-pointer">
              Reset Workbench
            </button>
          </section>

          <section className="lg:col-span-7 flex flex-col gap-5">

            <div className="bg-brand-darker/60 rounded-xl border border-white/10 shadow-lg p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-5">
                <div>
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">Calibration Response Curve</h2>
                  <p className="text-[10px] text-white/40 mt-0.5">Height-to-volume correction — geometric integration</p>
                </div>
                <span className="text-[9px] font-mono font-bold tracking-wider px-2 py-1 uppercase bg-brand-primary/10 border border-brand-primary/25 text-brand-primary rounded">
                  {tankShape === 'linear' ? 'Linear' : tankShape === 'cylinder' ? 'Cylinder' : 'Tapered'}
                </span>
              </div>
              <div className="rounded-lg border border-white/10 bg-brand-dark p-2">
                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto">
                  {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
                    const val = minVal + r * spanVal;
                    const y = getY(val);
                    return (
                      <g key={`yg-${i}`}>
                        <line x1={padX} y1={y} x2={chartW - padX} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4,4" />
                        <text x={padX - 8} y={y + 3} fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="monospace" textAnchor="end">{val.toFixed(2)}{sensorUnit}</text>
                      </g>
                    );
                  })}
                  {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
                    const lVal = r * maxCapacity;
                    const x = getX(lVal);
                    return (
                      <g key={`xg-${i}`}>
                        <line x1={x} y1={padY} x2={x} y2={chartH - padY} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4,4" />
                        <text x={x} y={chartH - padY + 14} fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="monospace" textAnchor="middle">{lVal.toFixed(0)}L</text>
                      </g>
                    );
                  })}
                  {chartAreaPath && <path d={chartAreaPath} fill="url(#areaGrad)" opacity="0.15" />}
                  {chartLinePath && <path d={chartLinePath} fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
                  {simLiters >= 0 && simLiters <= maxCapacity && (
                    <g>
                      <line x1={getX(simLiters)} y1={padY} x2={getX(simLiters)} y2={chartH - padY} stroke="#D8292E" strokeWidth="1" strokeDasharray="2,2" opacity="0.7" />
                      <circle cx={getX(simLiters)} cy={getY(simSensorValue)} r="5" fill="#D8292E" stroke="#0A1128" strokeWidth="2" />
                    </g>
                  )}
                  {items.map((item, i) => {
                    const v = item.isOverridden && item.overrideVal !== undefined ? item.overrideVal : item.calculatedVal;
                    return <circle key={`dot-${i}`} cx={getX(item.liters)} cy={getY(v)} r={item.isOverridden ? '5' : '3.5'}
                      fill={item.isOverridden ? '#D8292E' : '#0ea5e9'} stroke="#0A1128" strokeWidth="1.5" />;
                  })}
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" />
                      <stop offset="100%" stopColor="#0284c7" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="flex gap-2 items-start mt-3 p-3 bg-brand-primary/5 border border-brand-primary/15 rounded-lg text-[10px] text-white/50">
                <Info className="w-3.5 h-3.5 text-brand-primary mt-0.5 shrink-0" />
                <p>Horizontal cylinder profiles introduce volumetric non-linearity. Depth is computed via integrated circular segment bisection.</p>
              </div>
            </div>

            <div className="bg-brand-darker/60 rounded-xl border border-white/10 shadow-lg p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4 mb-5">
                <div>
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">Calibration Matrix</h2>
                  <p className="text-[10px] text-white/40 mt-0.5">Inject custom nodes or override individual sensor values.</p>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-medium">
                  <button onClick={handleCopyToClipboard}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/10 bg-brand-dark hover:bg-white/5 text-white/60 hover:text-white transition-colors cursor-pointer">
                    {copiedStatus ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    Copy CSV
                  </button>
                  <button onClick={handleExportCSV}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/10 bg-brand-dark hover:bg-white/5 text-white/60 hover:text-white transition-colors cursor-pointer">
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                  {Object.keys(overrides).length > 0 && (
                    <button onClick={handleClearAllOverrides}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer font-bold">
                      Clear Overrides
                    </button>
                  )}
                </div>
              </div>
              <form onSubmit={handleAddCustomPoint} className="flex flex-wrap sm:flex-nowrap gap-2 items-center mb-4 p-3 bg-brand-dark rounded-lg border border-white/10">
                <label htmlFor="custom-liters-input" className="text-[10px] font-bold text-white/40 uppercase tracking-wider shrink-0">Inject Node:</label>
                <div className="relative flex-grow max-w-[130px]">
                  <input id="custom-liters-input" type="number" step="0.01" placeholder="e.g. 12.5" value={newCustomPtStr}
                    onChange={e => setNewCustomPtStr(e.target.value)}
                    className="w-full text-xs bg-brand-darker border border-white/10 focus:border-brand-primary/60 rounded py-1.5 px-2.5 pr-7 text-white outline-none transition-colors" />
                  <span className="absolute right-2 top-2 text-[8px] font-bold text-white/25">L</span>
                </div>
                <button type="submit"
                  className="bg-brand-primary hover:bg-brand-primary/80 text-white rounded px-3 py-1.5 text-xs font-bold tracking-wider uppercase cursor-pointer transition-colors shrink-0">
                  Add
                </button>
              </form>
              {customPoints.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {customPoints.map((p, i) => (
                    <span key={`badge-${i}`}
                      className="inline-flex items-center gap-1 text-[10px] font-mono pl-2.5 pr-1 py-0.5 rounded border border-brand-primary/30 bg-brand-primary/10 text-brand-primary">
                      {p}L
                      <button type="button" onClick={() => handleRemoveCustomPoint(p)} className="ml-0.5 p-0.5 hover:bg-brand-primary/20 rounded cursor-pointer">
                        <Trash2 className="w-2.5 h-2.5 text-white/40 hover:text-red-400" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-brand-dark border-b border-white/10 text-white/30 uppercase tracking-widest font-bold text-[9px]">
                      <th className="px-3 py-2.5 text-center w-10">#</th>
                      <th className="px-4 py-2.5">Volume</th>
                      <th className="px-4 py-2.5">Depth</th>
                      <th className="px-4 py-2.5">Sensor Output</th>
                      <th className="px-4 py-2.5 text-right">Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    <AnimatePresence initial={false}>
                      {items.map((item, index) => {
                        const finalVal = item.isOverridden && item.overrideVal !== undefined ? item.overrideVal : item.calculatedVal;
                        const isEdited = editingOverrides[item.liters] !== undefined;
                        const tempVal  = editingOverrides[item.liters] ?? finalVal.toString();
                        return (
                          <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className={`transition-colors ${item.isOverridden ? 'bg-red-500/5' : ''} ${Math.abs(simLiters - item.liters) < 0.05 ? 'bg-brand-primary/5' : ''}`}>
                            <td className="px-3 py-3 text-center text-white/20 select-none">{(index + 1).toString().padStart(2, '0')}</td>
                            <td className="px-4 py-3">
                              <span className="font-bold text-white">{item.liters.toFixed(2)}</span>
                              <span className="text-[9px] text-white/30 ml-1">L</span>
                              <span className="block text-[8px] text-white/25 mt-0.5">{item.volumePct.toFixed(1)}% vol</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                                  <div className="bg-sky-500 h-full rounded-full" style={{ width: `${item.heightPct}%` }} />
                                </div>
                                <span className="text-white/60 text-[10px]">{item.heightPct.toFixed(1)}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {isEdited ? (
                                <div className="flex items-center gap-1">
                                  <input type="number" step="0.001" value={tempVal}
                                    onChange={e => setEditingOverrides(prev => ({ ...prev, [item.liters]: e.target.value }))}
                                    className="w-16 px-2 py-0.5 rounded border border-brand-primary/50 bg-brand-dark text-white text-xs outline-none"
                                    autoFocus />
                                  <button type="button" onClick={() => handleSaveOverride(item.liters, tempVal)}
                                    className="px-2 py-0.5 bg-brand-primary hover:bg-brand-primary/80 text-white text-[9px] font-bold rounded cursor-pointer">Save</button>
                                  <button type="button" onClick={() => { const c = { ...editingOverrides }; delete c[item.liters]; setEditingOverrides(c); }}
                                    className="px-2 py-0.5 bg-white/5 border border-white/10 text-white/40 text-[9px] rounded cursor-pointer">X</button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold ${item.isOverridden ? 'text-brand-primary' : 'text-white/80'}`}>{finalVal.toFixed(3)} {sensorUnit}</span>
                                  <button type="button" onClick={() => setEditingOverrides(prev => ({ ...prev, [item.liters]: finalVal.toString() }))}
                                    className="text-[9px] text-white/25 hover:text-brand-primary transition-colors font-bold cursor-pointer">[edit]</button>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {item.isOverridden ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <span className="px-1.5 py-0.5 bg-brand-primary/10 text-brand-primary text-[8px] font-bold uppercase rounded border border-brand-primary/25">Override</span>
                                  <button type="button" onClick={() => handleResetOverride(item.liters)} className="p-1 text-white/25 hover:text-white rounded cursor-pointer">
                                    <RefreshCw className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="px-1.5 py-0.5 bg-white/5 text-white/25 text-[8px] font-bold uppercase rounded border border-white/10">Analytical</span>
                              )}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>

          </section>
        </div>
      </main>

      <footer className="mt-8 bg-brand-darker border-t border-white/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-5 text-[10px] text-white/25 font-mono">
          <span>UNIT: {sensorUnit}</span>
          <span className="hidden sm:inline">POINTS: {items.length}</span>
          <span>PROFILE: {tankShape.toUpperCase()}</span>
        </div>
        <p className="text-[10px] text-white/20 font-mono hidden md:block uppercase">Industrial Fleet Diagnostics - iNAV</p>
      </footer>

    </div>
  );
}