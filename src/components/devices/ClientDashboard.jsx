import React, { useState, useMemo } from 'react';
import {
  SlidersHorizontal, RotateCcw, Video, Cpu, Settings,
  ChevronRight, ChevronLeft, Info, X, Eye, CheckCircle2, Lock,
  ArrowRight, RefreshCw,
} from 'lucide-react';
import DeviceRow from './DeviceRow.jsx';
import { useApp } from '../../context/AppContext.jsx';

const PLATFORMS_LIST = ['Fleet360', 'TSP', 'LocoNav', 'Fleetx'];
const CAMERA_OPTIONS = [
  { value: 'any', label: 'Any Camera Configuration' },
  { value: '0',   label: 'No Camera Needed (GPS Track Only)' },
  { value: '1',   label: '1 Camera Required' },
  { value: '2',   label: '2 Cameras (Dual View)' },
  { value: '4',   label: '4 Cameras (Multi-Channel DVR)' },
];

export default function ClientDashboard({
  devices,
  sensors,
  accessories,
  onOpenDevPortal,
  onGoHome,
  isSyncing,
  syncError,
  onForceSync,
}) {
  const { user } = useApp();
  const [selectedPlatforms,   setSelectedPlatforms]   = useState([]);
  const [selectedCameraCount, setSelectedCameraCount] = useState('any');
  const [selectedDevices,     setSelectedDevices]     = useState([]);
  const [selectedSensors,     setSelectedSensors]     = useState([]);
  const [selectedAccessories, setSelectedAccessories] = useState([]);

  const [inspectedDevice,  setInspectedDevice]  = useState(null);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquiryName,      setInquiryName]      = useState('');
  const [inquiryEmail,     setInquiryEmail]     = useState('');

  // ── Filter engine ──────────────────────────────────────────
  const eligibleDevicesForSelector = useMemo(() => devices.filter(d => {
    if (selectedPlatforms.length > 0 && !d.platforms.some(p => selectedPlatforms.includes(p))) return false;
    if (selectedCameraCount !== 'any' && d.camerasSupported !== parseInt(selectedCameraCount)) return false;
    return true;
  }), [devices, selectedPlatforms, selectedCameraCount]);

  const eligibleSensorsForSelector = useMemo(() => {
    const active = new Set();
    eligibleDevicesForSelector.forEach(d => d.sensors.forEach(s => active.add(s)));
    return sensors.filter(s => active.has(s.name));
  }, [sensors, eligibleDevicesForSelector]);

  const eligibleAccessoriesForSelector = useMemo(() => {
    const active = new Set();
    eligibleDevicesForSelector.forEach(d => d.accessories.forEach(a => active.add(a)));
    return accessories.filter(a => active.has(a.name));
  }, [accessories, eligibleDevicesForSelector]);

  const filteredDevices = useMemo(() => devices.filter(d => {
    if (selectedPlatforms.length > 0   && !d.platforms.some(p => selectedPlatforms.includes(p)))          return false;
    if (selectedCameraCount !== 'any'  && d.camerasSupported !== parseInt(selectedCameraCount))            return false;
    if (selectedDevices.length > 0     && !selectedDevices.includes(d.id))                                return false;
    if (selectedSensors.length > 0     && !selectedSensors.every(s => d.sensors.includes(s)))             return false;
    if (selectedAccessories.length > 0 && !selectedAccessories.every(a => d.accessories.includes(a)))     return false;
    return true;
  }), [devices, selectedPlatforms, selectedCameraCount, selectedDevices, selectedSensors, selectedAccessories]);

  // ── Toggle handlers ────────────────────────────────────────
  const togglePlatform  = p => { setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]); setSelectedDevices([]); };
  const toggleDevice    = id => setSelectedDevices(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleSensor    = n  => setSelectedSensors(prev => prev.includes(n)  ? prev.filter(x => x !== n)  : [...prev, n]);
  const toggleAccessory = n  => setSelectedAccessories(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]);
  const resetFilters    = () => { setSelectedPlatforms([]); setSelectedCameraCount('any'); setSelectedDevices([]); setSelectedSensors([]); setSelectedAccessories([]); };

  const handleSimulateInquiry = e => {
    e.preventDefault();
    if (!inquiryName.trim()) return;
    setInquirySubmitted(true);
    setTimeout(() => { setInquirySubmitted(false); setInquiryName(''); setInquiryEmail(''); setInspectedDevice(null); }, 3000);
  };

  const hasFilters = selectedPlatforms.length > 0 || selectedCameraCount !== 'any' || selectedDevices.length > 0 || selectedSensors.length > 0 || selectedAccessories.length > 0;

  return (
    <div className="min-h-screen bg-brand-dark text-white flex flex-col font-sans">

      {/* Sub-header — fixed so it stays visible on scroll */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-brand-darker border-b border-white/10 py-3.5 px-4 sm:px-6 md:px-8 shadow-md">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Home + iNAV logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={onGoHome}
              className="flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors cursor-pointer font-sans font-medium"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Home
            </button>
            <div className="h-4 w-px bg-white/15" />
            <div className="flex items-center gap-1.5 select-none">
              <span className="w-2 h-2 rounded-full bg-brand-primary shadow-[0_0_6px_rgba(216,41,46,0.6)] shrink-0" />
              <span className="font-black tracking-wider text-white text-base font-sans">
                <span className="italic">i</span>NAV
              </span>
            </div>
          </div>

          {/* Right: DEV360 ACCESS */}
          {user && (
            <button
              onClick={onOpenDevPortal}
              className="px-3 py-1.5 border border-brand-primary text-brand-primary text-[10px] font-bold uppercase rounded hover:bg-brand-primary hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Lock className="w-3 h-3" />
              <span>DEV360 ACCESS</span>
            </button>
          )}
        </div>
      </header>
      {/* Spacer so content doesn't hide behind fixed header */}
      <div className="h-[53px]" />

      {/* Sync banners */}
      {isSyncing && (
        <div className="bg-brand-primary/15 border-b border-brand-primary/30 py-2 px-6 flex items-center justify-center gap-2 text-xs font-mono text-brand-primary">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Syncing dataset with live Google Spreadsheet…</span>
        </div>
      )}
      {syncError && (
        <div className="bg-red-500/15 border-b border-red-500/30 py-2 px-6 flex items-center justify-center gap-2 text-xs font-mono text-red-400">
          <span className="font-bold">⚠️ SYNC NOTICE:</span>
          <span>{syncError}</span>
          <button onClick={onForceSync} className="underline font-bold ml-2 hover:text-red-300 transition-colors cursor-pointer">Retry Sync</button>
        </div>
      )}

      {/* Hero */}
      <section className="bg-gradient-to-r from-[#0D1B2A] to-brand-dark text-white py-12 px-4 sm:px-6 md:px-8 text-center relative overflow-hidden select-none border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(216,41,46,0.1),transparent)]" />
        <div className="max-w-4xl mx-auto relative z-10">
          <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-brand-primary uppercase bg-brand-primary/15 px-3 py-1 rounded border border-brand-primary/30 inline-block mb-3">
            Hardware &amp; Platform Advisor / Philippines
          </span>
          <h1 className="font-sans font-black text-2xl sm:text-4xl tracking-tight leading-none text-white max-w-2xl mx-auto uppercase">
            Devices &amp; Compatibility Hub
          </h1>
          <p className="text-sm sm:text-base text-white/70 mt-3 max-w-xl mx-auto leading-relaxed">
            Verify compatibility metrics and match telemetry sensors, multi-lens cameras, and accessories across Fleet360, TSP, LocoNav, and Fleetx environments.
          </p>
        </div>
      </section>

      {/* Main content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 flex flex-col gap-8">

        {/* Advisor Controls */}
        <section className="bg-brand-darker/60 rounded-xl border border-white/10 shadow-lg p-5 sm:p-7 relative z-20">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-brand-primary" />
              <h2 className="font-sans font-extrabold text-white text-xs uppercase tracking-[0.2em]">Fleets Advisor Controls</h2>
            </div>
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-extrabold text-white/50 hover:text-white hover:bg-white/5 px-3 py-1.5 rounded border border-transparent hover:border-white/10 transition-all duration-300 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset All Filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">

            {/* Column 1: Platforms & Cameras */}
            <div className="flex flex-col gap-6">
              <div>
                <label className="block text-[10px] uppercase font-bold text-white/40 tracking-widest mb-2.5 flex items-center justify-between">
                  <span>1. Platforms Selection</span>
                  <span className="text-[10px] text-white/30 font-mono italic">Multi-select allowed</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS_LIST.map(platform => {
                    const sel = selectedPlatforms.includes(platform);
                    return (
                      <button key={platform} onClick={() => togglePlatform(platform)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl border font-sans text-xs font-semibold transition-all duration-200 cursor-pointer ${
                          sel ? 'bg-brand-primary/20 border-brand-primary text-brand-primary shadow-md scale-[1.02]'
                              : 'bg-brand-card hover:bg-brand-card/80 text-white/80 border-white/10'
                        }`}
                      >
                        <span className="truncate">{platform}</span>
                        <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${sel ? 'bg-brand-primary border-brand-primary text-white' : 'border-white/20'}`}>
                          {sel && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-white/40 tracking-widest mb-2 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-white/40" />
                  <span>2. Cameras Required</span>
                </label>
                <select
                  value={selectedCameraCount}
                  onChange={e => setSelectedCameraCount(e.target.value)}
                  className="w-full bg-brand-card border border-white/10 rounded-lg px-3 py-2.5 text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer"
                >
                  {CAMERA_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-brand-dark">{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Column 2: Devices Filter */}
            <div className="flex flex-col">
              <label className="block text-[10px] uppercase font-bold text-white/40 tracking-widest mb-2.5 flex items-center justify-between">
                <span>3. Hardware Devices Filter</span>
                <span className="text-[10px] font-mono text-brand-primary font-bold">{eligibleDevicesForSelector.length} Candidates</span>
              </label>
              <div className="border border-white/10 rounded-lg bg-brand-card/30 p-3 h-[210px] overflow-y-auto flex flex-col gap-1.5 scrollbar-none">
                {eligibleDevicesForSelector.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-3 text-white/40 select-none">
                    <Info className="w-6 h-6 mb-1 text-white/20" />
                    <p className="text-xs font-medium">No matching devices</p>
                    <p className="text-[10px] text-white/30">Relax your Platform/Camera search filters</p>
                  </div>
                ) : (
                  eligibleDevicesForSelector.map(device => {
                    const isChecked = selectedDevices.includes(device.id);
                    return (
                      <button key={device.id} onClick={() => toggleDevice(device.id)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all duration-200 cursor-pointer ${
                          isChecked ? 'bg-brand-primary text-white font-bold border border-brand-primary shadow-md'
                                    : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0 ${isChecked ? 'bg-white border-white' : 'border-white/20'}`}>
                          {isChecked && <div className="w-1.5 h-1.5 bg-brand-primary rounded-full" />}
                        </div>
                        <span className="truncate flex-1 font-medium">{device.name}</span>
                        <span className="text-[9px] text-white/50 font-mono">{device.camerasSupported > 0 ? `🎥 ${device.camerasSupported}c` : 'Track'}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Column 3: Sensors & Accessories */}
            <div className="md:col-span-2 lg:col-span-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-white/40 tracking-widest mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-white/40" />4. Required Sensors</span>
                  <span className="text-[10px] font-mono text-brand-primary font-bold">{selectedSensors.length} active</span>
                </label>
                <div className="border border-white/10 rounded-lg bg-brand-card/30 p-2 h-[100px] overflow-y-auto flex flex-wrap gap-1 scrollbar-none">
                  {eligibleSensorsForSelector.length === 0 ? (
                    <p className="text-[10px] text-white/40 p-2 text-center w-full select-none">Reset hardware filters to restore compatible sensors.</p>
                  ) : eligibleSensorsForSelector.map(sensor => {
                    const isActive = selectedSensors.includes(sensor.name);
                    return (
                      <button key={sensor.id} onClick={() => toggleSensor(sensor.name)}
                        className={`text-[10px] px-2 py-1 rounded-md border transition-all duration-200 cursor-pointer ${isActive ? 'bg-brand-primary text-white font-bold border-brand-primary' : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/10'}`}
                      >
                        {sensor.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-white/40 tracking-widest mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Settings className="w-3.5 h-3.5 text-white/40" />5. Required Accessories</span>
                  <span className="text-[10px] font-mono text-brand-primary font-bold">{selectedAccessories.length} active</span>
                </label>
                <div className="border border-white/10 rounded-lg bg-brand-card/30 p-2 h-[100px] overflow-y-auto flex flex-wrap gap-1 scrollbar-none">
                  {eligibleAccessoriesForSelector.length === 0 ? (
                    <p className="text-[10px] text-white/40 p-2 text-center w-full select-none">Reset filters to restore compatible accessories.</p>
                  ) : eligibleAccessoriesForSelector.map(acc => {
                    const isActive = selectedAccessories.includes(acc.name);
                    return (
                      <button key={acc.id} onClick={() => toggleAccessory(acc.name)}
                        className={`text-[10px] px-2 py-1 rounded-md border transition-all duration-200 cursor-pointer ${isActive ? 'bg-brand-card border-brand-primary text-white font-bold' : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/10'}`}
                      >
                        {acc.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Active filter tags */}
          {hasFilters && (
            <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-1.5 text-xs text-white/50">
              <span className="font-bold text-white/70">Active filters:</span>
              {selectedPlatforms.map(p => (
                <span key={p} className="bg-brand-primary/10 text-brand-primary px-2.5 py-1 rounded-full border border-brand-primary/30 flex items-center gap-1 font-semibold text-[11px]">
                  Platform: {p} <X className="w-3 h-3 cursor-pointer text-white/40 hover:text-white" onClick={() => togglePlatform(p)} />
                </span>
              ))}
              {selectedCameraCount !== 'any' && (
                <span className="bg-white/5 text-white/90 px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1 font-semibold text-[11px]">
                  {selectedCameraCount === '0' ? 'No Cam' : `Cam: ${selectedCameraCount}`}
                  <X className="w-3 h-3 cursor-pointer text-white/40 hover:text-white" onClick={() => setSelectedCameraCount('any')} />
                </span>
              )}
              {selectedDevices.map(id => {
                const dev = devices.find(x => x.id === id);
                if (!dev) return null;
                return (
                  <span key={id} className="bg-brand-primary/20 text-white px-2.5 py-1 rounded-full border border-white/20 flex items-center gap-1 font-semibold text-[11px]">
                    Device: {dev.name} <X className="w-3 h-3 cursor-pointer text-white/40 hover:text-white" onClick={() => toggleDevice(id)} />
                  </span>
                );
              })}
              {selectedSensors.map(s => (
                <span key={s} className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/25 flex items-center gap-1 font-semibold text-[11px]">
                  Sensor: {s} <X className="w-3 h-3 cursor-pointer text-white/40 hover:text-white" onClick={() => toggleSensor(s)} />
                </span>
              ))}
              {selectedAccessories.map(a => (
                <span key={a} className="bg-violet-500/10 text-violet-400 px-2.5 py-1 rounded-full border border-violet-500/25 flex items-center gap-1 font-semibold text-[11px]">
                  Accessory: {a} <X className="w-3 h-3 cursor-pointer text-white/40 hover:text-white" onClick={() => toggleAccessory(a)} />
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Results */}
        <section className="flex flex-col gap-2">
          {filteredDevices.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-white/10 pb-4 mb-2">
              <div>
                <h3 className="font-sans font-extrabold text-white uppercase tracking-tight text-base sm:text-lg flex items-center gap-2">
                  <span className="w-2.5 h-5 bg-brand-primary rounded-sm inline-block" />
                  Compatible Fleet Hardware
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white/5 text-white/70 border border-white/10 ml-2">
                    {filteredDevices.length} {filteredDevices.length === 1 ? 'Device' : 'Devices'}
                  </span>
                </h3>
                <p className="text-xs text-white/50 tracking-wide mt-0.5">Your fully filtered matches across three interactive scrolling row bands.</p>
              </div>
              <span className="font-sans text-xs font-semibold text-white/40 self-end">
                Showing <strong className="text-brand-primary">{filteredDevices.length}</strong> of <strong className="text-white/80">{devices.length}</strong> available products
              </span>
            </div>
          )}

          {filteredDevices.length > 0 ? (
            <DeviceRow
              id="unified_results_row"
              title="Compatible Fleet Hardware"
              subtitle="All compatible tracking units and advanced modular telemetry transceivers"
              devices={filteredDevices}
              allSensors={sensors}
              allAccessories={accessories}
              onInspectDevice={setInspectedDevice}
              hideHeader={true}
              rowsCount={3}
            />
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-xl py-12 px-6 text-center shadow-lg flex flex-col items-center justify-center max-w-lg mx-auto my-6">
              <div className="w-12 h-12 rounded-full bg-brand-primary/15 text-brand-primary flex items-center justify-center mb-3">
                <SlidersHorizontal className="w-6 h-6" />
              </div>
              <h3 className="font-sans text-white font-bold text-base uppercase tracking-tight">No Filter Match Found</h3>
              <p className="text-xs text-white/50 mt-2 leading-relaxed">
                We couldn't identify any telemetry units that support that exact dynamic mix of platform, camera, sensors, and accessories simultaneously.
              </p>
              <button onClick={resetFilters} className="mt-4 px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer">
                Reset To Default View
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#050A18] text-white/50 border-t border-white/5 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-[10px] text-white/30 uppercase tracking-[0.3em] text-center md:text-left">
            © {new Date().getFullYear()} iNav Philippines Corp | Precision Telematics
          </div>
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-[9px] font-bold text-white/50 uppercase tracking-wider">
              {user && (
                <span className="hover:text-brand-primary transition-colors cursor-pointer" onClick={onOpenDevPortal}>DEV360 ADMIN ACCESS</span>
              )}
            <span>SYSTEM STATUS: <span className="text-green-500">ONLINE</span></span>
            <span className="px-2 py-1 bg-white/5 rounded">VER 2.4.1</span>
          </div>
        </div>
      </footer>

      {/* Inspect Modal */}
      {inspectedDevice && (
        <div className="fixed inset-0 bg-brand-darker/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-brand-dark border border-white/10 w-full max-w-2xl rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(217,4,41,0.15)] flex flex-col animate-fade-in relative max-h-[90vh]">

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#050A18] to-brand-card p-6 text-white flex justify-between items-start relative select-none border-b border-white/5">
              <div className="absolute right-0 bottom-0 top-0 w-32 bg-[radial-gradient(ellipse_at_right,rgba(216,41,46,0.1),transparent)] pointer-events-none" />
              <div>
                <span className="text-[9px] font-mono font-bold tracking-widest text-brand-primary uppercase bg-brand-primary/10 border border-brand-primary/35 px-2 py-0.5 rounded mr-2">
                  {inspectedDevice.category}
                </span>
                <h3 className="font-sans font-black text-xl sm:text-2xl tracking-tight mt-1">{inspectedDevice.name}</h3>
                <p className="text-xs text-white/40 mt-1">Hardware Specification &amp; Connection Matrix</p>
              </div>
              <button
                onClick={() => { setInspectedDevice(null); setInquirySubmitted(false); }}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-brand-primary flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer border border-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6 font-sans scrollbar-none">
              <div>
                <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Product Overview</h4>
                <p className="text-sm text-white/80 leading-relaxed">
                  {inspectedDevice.description || 'Highly stable telematics responder for continuous fleet operations.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-brand-card/50 p-3.5 rounded-xl border border-white/10">
                  <h5 className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Compatible Channels</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {PLATFORMS_LIST.map(platform => {
                      const isSupported = inspectedDevice.platforms.includes(platform);
                      return (
                        <span key={platform} className={`text-xs px-2 py-1 rounded-lg border font-semibold ${isSupported ? 'bg-brand-primary/10 border-brand-primary/40 text-brand-primary font-bold' : 'bg-brand-dark/40 border-white/5 text-white/30 line-through opacity-55'}`}>
                          {platform}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-brand-card/50 p-3.5 rounded-xl border border-white/10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0 border border-brand-primary/20">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-[10px] uppercase tracking-widest font-bold text-white/40 leading-none">Camera Capabilities</h5>
                    <p className="text-sm font-bold text-white mt-1">
                      {inspectedDevice.camerasSupported > 0 ? `${inspectedDevice.camerasSupported} Camera Lens Support` : 'GPS Core Track Only (No Video)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sensors */}
              <div>
                <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-brand-primary" />
                  Compatible Sensors ({inspectedDevice.sensors.length})
                </h4>
                {inspectedDevice.sensors.length === 0 ? (
                  <p className="text-xs text-white/30 italic">No customizable external sensor connections.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {inspectedDevice.sensors.map(sensorName => {
                      const match = sensors.find(s => s.name === sensorName);
                      return (
                        <div key={sensorName} className="p-2.5 border border-white/10 rounded-lg text-xs bg-brand-card/40 flex flex-col justify-between font-medium">
                          <strong className="text-white/90 font-semibold">{sensorName}</strong>
                          {match && <span className="text-[9px] text-white/40 mt-1 truncate">{match.description}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Accessories */}
              <div>
                <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-brand-primary" />
                  Compatible Accessories ({inspectedDevice.accessories.length})
                </h4>
                {inspectedDevice.accessories.length === 0 ? (
                  <p className="text-xs text-white/30 italic">No additional accessories supported.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {inspectedDevice.accessories.map(accName => {
                      const match = accessories.find(a => a.name === accName);
                      return (
                        <div key={accName} className="p-2.5 border border-white/10 rounded-lg text-xs bg-brand-card/40 flex flex-col font-medium">
                          <strong className="text-white/90 font-semibold">{accName}</strong>
                          {match && <span className="text-[9px] text-white/40 mt-1 line-clamp-2">{match.description}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Inquiry form */}
              <div className="bg-brand-card/40 rounded-xl border border-white/10 p-4">
                {inquirySubmitted ? (
                  <div className="flex items-center gap-3 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="font-bold text-sm">Inquiry received!</p>
                      <p className="text-xs text-white/50 mt-0.5">Our team will contact you soon.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Request More Info</h4>
                    <form onSubmit={handleSimulateInquiry} className="flex flex-col gap-2.5 text-xs">
                      <input
                        type="text" required placeholder="Your name"
                        value={inquiryName} onChange={e => setInquiryName(e.target.value)}
                        className="w-full bg-brand-darker border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-white/25 outline-none focus:border-brand-primary"
                      />
                      <input
                        type="email" placeholder="Email (optional)"
                        value={inquiryEmail} onChange={e => setInquiryEmail(e.target.value)}
                        className="w-full bg-brand-darker border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-white/25 outline-none focus:border-brand-primary"
                      />
                      <button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2">
                        Send Inquiry <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
