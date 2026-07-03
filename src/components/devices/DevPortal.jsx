import React, { useState } from 'react';
import {
  Lock, Unlock, PlusCircle, FileEdit, Trash2, X,
  CheckCircle2, AlertTriangle, Cpu, Settings,
  ChevronLeft, ArrowLeft, LogOut, SlidersHorizontal, RefreshCw,
} from 'lucide-react';
import Logo from './Logo.jsx';
import { useApp } from '../../context/AppContext.jsx';

const DEV_PASSWORD = 'DEV360';
const PLATFORMS = ['Fleet360', 'TSP', 'LocoNav', 'Fleetx'];

export default function DevPortal({
  devices,
  sensors,
  accessories,
  onUpdateDevices,
  onUpdateSensors,
  onUpdateAccessories,
  onClosePortal,
  onGoHome,
  isSyncing,
  syncError,
  onForceSync,
}) {
  const { user } = useApp();

  // ── Auth ──────────────────────────────────────────────────
  const [password,        setPassword]        = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError,       setAuthError]       = useState('');

  // ── Nav ───────────────────────────────────────────────────
  const [activeTab,      setActiveTab]      = useState('add_entry');
  const [successBanner,  setSuccessBanner]  = useState('');

  // ── Add Device form ───────────────────────────────────────
  const [newDevName,        setNewDevName]        = useState('');
  const [newDevCategory,    setNewDevCategory]    = useState('Standard Tracker');
  const [newDevCameras,     setNewDevCameras]     = useState(0);
  const [newDevPlatforms,   setNewDevPlatforms]   = useState([]);
  const [newDevSensors,     setNewDevSensors]     = useState([]);
  const [newDevAccessories, setNewDevAccessories] = useState([]);
  const [newDevDesc,        setNewDevDesc]        = useState('');

  // ── Add Sensor form ───────────────────────────────────────
  const [newSensName, setNewSensName] = useState('');
  const [newSensType, setNewSensType] = useState('Digital');
  const [newSensDesc, setNewSensDesc] = useState('');

  // ── Add Accessory form ────────────────────────────────────
  const [newAccName, setNewAccName] = useState('');
  const [newAccDesc, setNewAccDesc] = useState('');

  // ── Edit modals ───────────────────────────────────────────
  const [editingDevice,    setEditingDevice]    = useState(null);
  const [editingSensor,    setEditingSensor]    = useState(null);
  const [editingAccessory, setEditingAccessory] = useState(null);

  // ── Helpers ───────────────────────────────────────────────
  const triggerToast = msg => { setSuccessBanner(msg); setTimeout(() => setSuccessBanner(''), 4000); };
  const toggleIn     = (list, item) => list.includes(item) ? list.filter(x => x !== item) : [...list, item];

  // ── Auth ──────────────────────────────────────────────────
  const handleLogin = e => {
    e.preventDefault();
    if (password === DEV_PASSWORD) {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('⚠️ ACCESS DENIED: Invalid Developer Master Key.');
    }
  };

  // ── Add handlers ──────────────────────────────────────────
  const handleAddDevice = e => {
    e.preventDefault();
    if (!newDevName.trim()) return;
    if (devices.some(d => d.name.toLowerCase() === newDevName.trim().toLowerCase())) {
      alert('Error: A device with this name already exists.'); return;
    }
    const newDevice = {
      id: `dev_custom_${Date.now()}`,
      name: newDevName.trim(), category: newDevCategory,
      camerasSupported: newDevCameras, platforms: newDevPlatforms,
      sensors: newDevSensors, accessories: newDevAccessories, description: newDevDesc.trim(),
    };
    onUpdateDevices([newDevice, ...devices]);
    triggerToast(`Success: Registered device '${newDevice.name}' into active catalog!`);
    setNewDevName(''); setNewDevCategory('Standard Tracker'); setNewDevCameras(0);
    setNewDevPlatforms([]); setNewDevSensors([]); setNewDevAccessories([]); setNewDevDesc('');
  };

  const handleAddSensor = e => {
    e.preventDefault();
    if (!newSensName.trim()) return;
    if (sensors.some(s => s.name.toLowerCase() === newSensName.trim().toLowerCase())) {
      alert('Error: A sensor with this name already exists.'); return;
    }
    const newSensor = { id: `sens_custom_${Date.now()}`, name: newSensName.trim(), type: newSensType, description: newSensDesc.trim() };
    onUpdateSensors([...sensors, newSensor]);
    triggerToast(`Success: Sensor '${newSensor.name}' registered.`);
    setNewSensName(''); setNewSensType('Digital'); setNewSensDesc('');
  };

  const handleAddAccessory = e => {
    e.preventDefault();
    if (!newAccName.trim()) return;
    if (accessories.some(a => a.name.toLowerCase() === newAccName.trim().toLowerCase())) {
      alert('Error: An accessory with this name already exists.'); return;
    }
    const newAcc = { id: `acc_custom_${Date.now()}`, name: newAccName.trim(), description: newAccDesc.trim() };
    onUpdateAccessories([...accessories, newAcc]);
    triggerToast(`Success: Accessory '${newAcc.name}' registered.`);
    setNewAccName(''); setNewAccDesc('');
  };

  // ── Edit save handlers ────────────────────────────────────
  const saveEditedDevice = e => {
    e.preventDefault();
    if (!editingDevice) return;
    onUpdateDevices(devices.map(d => d.id === editingDevice.id ? editingDevice : d));
    triggerToast(`Success: Updated specs for '${editingDevice.name}'.`);
    setEditingDevice(null);
  };

  const saveEditedSensor = e => {
    e.preventDefault();
    if (!editingSensor) return;
    const orig = sensors.find(s => s.id === editingSensor.id);
    if (orig && orig.name !== editingSensor.name) {
      onUpdateDevices(devices.map(d => ({ ...d, sensors: d.sensors.map(n => n === orig.name ? editingSensor.name : n) })));
    }
    onUpdateSensors(sensors.map(s => s.id === editingSensor.id ? editingSensor : s));
    triggerToast(`Success: Sensor '${editingSensor.name}' updated.`);
    setEditingSensor(null);
  };

  const saveEditedAccessory = e => {
    e.preventDefault();
    if (!editingAccessory) return;
    const orig = accessories.find(a => a.id === editingAccessory.id);
    if (orig && orig.name !== editingAccessory.name) {
      onUpdateDevices(devices.map(d => ({ ...d, accessories: d.accessories.map(n => n === orig.name ? editingAccessory.name : n) })));
    }
    onUpdateAccessories(accessories.map(a => a.id === editingAccessory.id ? editingAccessory : a));
    triggerToast(`Success: Accessory '${editingAccessory.name}' updated.`);
    setEditingAccessory(null);
  };

  // ── Delete handlers ───────────────────────────────────────
  const handleDeleteDevice = (id, name) => {
    if (confirm(`Remove '${name}' from the iNav database?`)) {
      onUpdateDevices(devices.filter(d => d.id !== id));
      triggerToast(`Info: Removed '${name}' device.`);
    }
  };
  const handleDeleteSensor = (id, name) => {
    if (confirm(`Remove sensor '${name}'? This will disconnect it from all compatible devices.`)) {
      onUpdateDevices(devices.map(d => ({ ...d, sensors: d.sensors.filter(s => s !== name) })));
      onUpdateSensors(sensors.filter(s => s.id !== id));
      triggerToast(`Info: Removed sensor '${name}'.`);
    }
  };
  const handleDeleteAccessory = (id, name) => {
    if (confirm(`Remove accessory '${name}'? This will disconnect it from all compatible devices.`)) {
      onUpdateDevices(devices.map(d => ({ ...d, accessories: d.accessories.filter(a => a !== name) })));
      onUpdateAccessories(accessories.filter(a => a.id !== id));
      triggerToast(`Info: Removed accessory '${name}'.`);
    }
  };

  // ── Lock screen ───────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-brand-darker flex flex-col justify-center items-center p-4 font-sans border-t-4 border-brand-primary select-none">
        <div className="w-full max-w-md bg-[#0A1128] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(217,4,41,0.12)] relative overflow-hidden text-center flex flex-col gap-6 animate-fade-in">
          <div className="absolute right-0 top-0 w-24 h-24 bg-[radial-gradient(circle_at_top_right,rgba(216,41,46,0.1),transparent)] pointer-events-none" />
          <div className="flex justify-center">
            <Logo showText={true} className="h-10 text-white" />
          </div>
          <div className="flex flex-col gap-1.5 mt-2">
            <h2 className="font-sans font-black uppercase text-xl leading-none text-white tracking-tight flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-brand-primary animate-pulse" /> Dev Console Guard
            </h2>
            <p className="text-xs text-white/50">Authorized Engineering Staff Only • Master Key Required</p>
          </div>

          {!user && (
            <div className="bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/30 text-xs text-yellow-300 text-left flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Sign in via the Technician Scheduler first to enable Google Sheets sync after unlocking.</span>
            </div>
          )}

          {authError && (
            <div className="bg-brand-primary/10 p-3 rounded-xl border border-brand-primary/45 text-xs text-brand-primary text-left flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2 font-mono">Secret Access Key:</label>
              <input
                type="password" required autoFocus placeholder="Enter password…"
                value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-brand-card/40 text-white border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors tracking-widest"
              />
            </div>
            <button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-sans text-xs font-extrabold uppercase py-3.5 rounded-xl transition-all tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md mt-2">
              <Unlock className="w-4 h-4" /> Access Dev Core
            </button>
          </form>
          <button onClick={onClosePortal} className="text-xs text-white/45 hover:text-white transition-colors flex items-center justify-center gap-1 cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Public Catalog
          </button>
        </div>
      </div>
    );
  }

  // ── Admin workspace ───────────────────────────────────────
  return (
    <div className="min-h-screen bg-brand-dark flex flex-col font-sans text-white">

      {/* Fixed top nav — same style as ClientDashboard */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-darker border-b border-white/10 py-3.5 px-4 sm:px-6 md:px-8 flex items-center justify-between select-none shadow-md">
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
        {/* Right: Exit Console */}
        <button onClick={onClosePortal} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer">
          <LogOut className="w-3.5 h-3.5" /> Exit Console
        </button>
      </nav>
      {/* Spacer */}
      <div className="h-[53px]" />

      {/* Sync banners */}
      {isSyncing && (
        <div className="bg-brand-primary/15 border-b border-brand-primary/30 py-2 px-6 flex items-center justify-center gap-2 text-xs font-mono text-brand-primary">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Syncing dev database updates with Google Sheets…
        </div>
      )}
      {syncError && (
        <div className="bg-red-500/15 border-b border-red-500/30 py-2 px-6 flex items-center justify-center gap-2 text-xs font-mono text-red-400">
          <span className="font-bold">⚠️ DB SYNC ERROR:</span> <span>{syncError}</span>
          <button onClick={onForceSync} className="underline font-bold ml-2 hover:text-red-300 transition-colors cursor-pointer">Retry</button>
        </div>
      )}

      {/* Success toast */}
      {successBanner && (
        <div className="fixed top-20 right-4 bg-brand-dark border-l-4 border-l-emerald-500 p-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-slide-in max-w-md border border-white/10">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/25">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-white">{successBanner}</span>
        </div>
      )}

      {/* Workspace header */}
      <header className="bg-[#0A1128] border-b border-white/10 py-5 px-4 sm:px-6 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="font-sans font-black text-white text-xl tracking-tight uppercase flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-brand-primary" /> Fleets &amp; Hardware Management
          </h1>
          <p className="text-xs text-white/50 mt-0.5">Define new telemetry modules and build compatibility matrices in real time.</p>
        </div>
        <div className="flex items-center gap-1.5">
          {['add_entry', 'edit_entry'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                activeTab === tab ? 'bg-brand-primary text-white border-brand-primary shadow-sm' : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
              }`}
            >
              {tab === 'add_entry' ? <><PlusCircle className="w-4 h-4" /> Page 1: Register Assets</> : <><FileEdit className="w-4 h-4" /> Page 2: Edit Catalog</>}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 font-sans">

        {/* ── PAGE 1: REGISTER ──────────────────────────────────── */}
        {activeTab === 'add_entry' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">

            {/* Add Device (8 cols) */}
            <div className="lg:col-span-8 bg-[#0A1128] rounded-2xl border border-white/10 p-6 flex flex-col gap-5 shadow-2xl">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-1">
                <div className="w-7 h-7 rounded bg-brand-primary/10 text-brand-primary flex items-center justify-center"><PlusCircle className="w-4 h-4" /></div>
                <h3 className="font-sans font-extrabold text-white uppercase text-xs tracking-widest">A. Register New Hardware Device</h3>
              </div>

              <form onSubmit={handleAddDevice} className="flex flex-col gap-4 text-xs font-sans">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white/60 font-bold uppercase tracking-wider mb-1.5">Device Model Name: <span className="text-brand-primary">*</span></label>
                    <input type="text" required placeholder="e.g. JC500-AI" value={newDevName} onChange={e => setNewDevName(e.target.value)}
                      className="w-full bg-brand-card/40 border border-white/10 rounded-xl px-3.5 py-2.5 font-semibold text-white outline-none focus:border-brand-primary placeholder-white/20" />
                  </div>
                  <div>
                    <label className="block text-white/60 font-bold uppercase tracking-wider mb-1.5">Category:</label>
                    <select value={newDevCategory} onChange={e => setNewDevCategory(e.target.value)}
                      className="w-full bg-brand-card/40 border border-white/10 rounded-xl px-3 py-2.5 font-semibold text-white outline-none focus:border-brand-primary cursor-pointer">
                      <option value="Video Telematics" className="bg-brand-darker">Row 1: Video Telematics</option>
                      <option value="Advanced Telematics" className="bg-brand-darker">Row 2: Advanced Telematics</option>
                      <option value="Standard Tracker" className="bg-brand-darker">Row 3: Standard Tracker</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/60 font-bold uppercase tracking-wider mb-1.5">Cameras (0-8):</label>
                    <input type="number" min={0} max={8} value={newDevCameras} onChange={e => setNewDevCameras(parseInt(e.target.value) || 0)}
                      className="w-full bg-brand-card/40 border border-white/10 rounded-xl px-3.5 py-2.5 font-semibold text-white outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" />
                  </div>
                </div>

                <div>
                  <label className="block text-white/60 font-bold uppercase tracking-wider mb-2">Compatible Platforms:</label>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map(plat => {
                      const enabled = newDevPlatforms.includes(plat);
                      return (
                        <button key={plat} type="button" onClick={() => setNewDevPlatforms(prev => toggleIn(prev, plat))}
                          className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${enabled ? 'bg-brand-primary border-brand-primary text-white shadow-sm' : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'}`}>
                          {plat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-white/60 font-bold uppercase tracking-wider mb-1.5">Description:</label>
                  <textarea rows={2} placeholder="Operational capabilities, housing, bands…" value={newDevDesc} onChange={e => setNewDevDesc(e.target.value)}
                    className="w-full bg-brand-card/40 border border-white/10 rounded-xl px-3.5 py-2.5 font-medium text-white outline-none focus:border-brand-primary placeholder-white/20" />
                </div>

                <div>
                  <label className="block text-white/60 font-bold uppercase tracking-wider mb-2">Compatible Sensors:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 border border-white/10 rounded-xl p-3 bg-brand-card/10 max-h-[120px] overflow-y-auto">
                    {sensors.map(s => {
                      const active = newDevSensors.includes(s.name);
                      return (
                        <button key={s.id} type="button" onClick={() => setNewDevSensors(prev => toggleIn(prev, s.name))}
                          className={`px-2.5 py-1.5 text-left rounded-lg text-[10px] border transition-all truncate cursor-pointer ${active ? 'bg-brand-primary border-brand-primary text-white font-bold' : 'bg-brand-card/40 text-white/70 hover:bg-brand-card/70 border-white/10'}`}>
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-white/60 font-bold uppercase tracking-wider mb-2">Compatible Accessories:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 border border-white/10 rounded-xl p-3 bg-brand-card/10 max-h-[120px] overflow-y-auto">
                    {accessories.map(a => {
                      const active = newDevAccessories.includes(a.name);
                      return (
                        <button key={a.id} type="button" onClick={() => setNewDevAccessories(prev => toggleIn(prev, a.name))}
                          className={`px-2.5 py-1.5 text-left rounded-lg text-[10px] border transition-all truncate cursor-pointer ${active ? 'bg-brand-primary border-brand-primary text-white font-bold' : 'bg-brand-card/40 text-white/70 hover:bg-brand-card/70 border-white/10'}`}>
                          {a.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary/95 py-3 rounded-xl text-white font-black uppercase tracking-wider cursor-pointer shadow transition-all duration-200">
                  Save &amp; Register Device
                </button>
              </form>
            </div>

            {/* Add Sensor + Accessory (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-8">
              {/* Add Sensor */}
              <div className="bg-[#0A1128] rounded-2xl border border-white/10 shadow-sm p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-1">
                  <Cpu className="w-4 h-4 text-brand-primary" />
                  <h3 className="font-sans font-extrabold text-white uppercase text-xs tracking-widest">B. Add Core Sensor</h3>
                </div>
                <form onSubmit={handleAddSensor} className="flex flex-col gap-3.5 text-xs font-sans">
                  <div>
                    <label className="block text-white/60 font-bold uppercase tracking-wider mb-1">Sensor Name: <span className="text-brand-primary">*</span></label>
                    <input type="text" required placeholder="e.g. Fuel Probe Gen5" value={newSensName} onChange={e => setNewSensName(e.target.value)}
                      className="w-full bg-brand-card/40 border border-white/10 rounded-xl px-3 py-2.5 font-bold text-white outline-none focus:border-brand-primary placeholder-white/20" />
                  </div>
                  <div>
                    <label className="block text-white/60 font-bold uppercase tracking-wider mb-1">Protocol Class:</label>
                    <select value={newSensType} onChange={e => setNewSensType(e.target.value)}
                      className="w-full bg-brand-card/40 border border-white/10 rounded-xl px-3 py-2.5 font-semibold text-white outline-none focus:border-brand-primary cursor-pointer">
                      <option value="Digital"  className="bg-brand-darker">Digital</option>
                      <option value="Analog"   className="bg-brand-darker">Analog</option>
                      <option value="Serial"   className="bg-brand-darker">Serial</option>
                      <option value="Other"    className="bg-brand-darker">Other / BT</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/60 font-bold uppercase tracking-wider mb-1">Description:</label>
                    <textarea rows={2} placeholder="Brief info for advisor cards…" value={newSensDesc} onChange={e => setNewSensDesc(e.target.value)}
                      className="w-full bg-brand-card/40 border border-white/10 rounded-xl px-3 py-2.5 font-medium text-white outline-none focus:border-brand-primary placeholder-white/20" />
                  </div>
                  <button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary/95 py-2.5 rounded-xl text-white font-bold uppercase tracking-wider transition-colors cursor-pointer">
                    Register Sensor
                  </button>
                </form>
              </div>

              {/* Add Accessory */}
              <div className="bg-[#0A1128] rounded-2xl border border-white/10 shadow-sm p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-1">
                  <Settings className="w-4 h-4 text-brand-primary" />
                  <h3 className="font-sans font-extrabold text-white uppercase text-xs tracking-widest">C. Add Accessory</h3>
                </div>
                <form onSubmit={handleAddAccessory} className="flex flex-col gap-3.5 text-xs font-sans">
                  <div>
                    <label className="block text-white/60 font-bold uppercase tracking-wider mb-1">Accessory Name: <span className="text-brand-primary">*</span></label>
                    <input type="text" required placeholder="e.g. DMS Fatigue Cam" value={newAccName} onChange={e => setNewAccName(e.target.value)}
                      className="w-full bg-brand-card/40 border border-white/10 rounded-xl px-3 py-2.5 font-bold text-white outline-none focus:border-brand-primary placeholder-white/20" />
                  </div>
                  <div>
                    <label className="block text-white/60 font-bold uppercase tracking-wider mb-1">Description:</label>
                    <textarea rows={2} placeholder="Details on compatibility outputs…" value={newAccDesc} onChange={e => setNewAccDesc(e.target.value)}
                      className="w-full bg-brand-card/40 border border-white/10 rounded-xl px-3 py-2.5 font-medium text-white outline-none focus:border-brand-primary placeholder-white/20" />
                  </div>
                  <button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary/95 py-2.5 rounded-xl text-white font-bold uppercase tracking-wider transition-colors cursor-pointer">
                    Register Accessory
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ── PAGE 2: EDIT CATALOG ──────────────────────────────── */}
        {activeTab === 'edit_entry' && (
          <div className="flex flex-col gap-8 animate-fade-in w-full font-sans text-white">

            {/* Devices table */}
            <div className="bg-[#0A1128] rounded-2xl border border-white/10 shadow-2xl p-5 sm:p-6 w-full">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 select-none">
                <h3 className="font-sans font-black text-white tracking-wider text-sm uppercase flex items-center gap-2">
                  <span className="w-2.5 h-4.5 bg-brand-primary rounded-sm inline-block" />
                  Active Devices Catalog ({devices.length} models)
                </h3>
              </div>
              <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#050A18]/45">
                <table className="w-full text-xs font-sans text-left border-collapse">
                  <thead>
                    <tr className="bg-[#050A18] text-[10px] font-bold uppercase text-white/50 border-b border-white/10">
                      <th className="px-4 py-3.5">Device Name</th>
                      <th className="px-4 py-3.5">Category</th>
                      <th className="px-4 py-3.5">Cams</th>
                      <th className="px-4 py-3.5">Platforms</th>
                      <th className="px-4 py-3.5">Sensors / Accessories</th>
                      <th className="px-4 py-3.5 text-right">Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {devices.map(device => (
                      <tr key={device.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3.5 font-extrabold text-white">{device.name}</td>
                        <td className="px-4 py-3.5"><span className="bg-white/5 text-white/80 px-2.5 py-1 rounded font-mono text-[10px] border border-white/5">{device.category}</span></td>
                        <td className="px-4 py-3.5 font-semibold font-mono text-white/70">{device.camerasSupported}</td>
                        <td className="px-4 py-3.5"><span className="text-[10px] font-semibold text-brand-primary max-w-[150px] block truncate">{device.platforms.join(', ')}</span></td>
                        <td className="px-4 py-3.5 text-white/60 text-[11px]">
                          <span>S: {device.sensors.length} · A: {device.accessories.length}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setEditingDevice(device)} className="px-2.5 py-1.5 bg-white/5 hover:bg-brand-primary text-white border border-white/10 rounded-lg transition-all font-bold cursor-pointer text-[11px]">Edit</button>
                            <button onClick={() => handleDeleteDevice(device.id, device.name)} className="px-2.5 py-1.5 bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-white rounded-lg border border-brand-primary/20 transition-all font-bold cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sensors + Accessories tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start w-full">
              {/* Sensors */}
              <div className="bg-[#0A1128] rounded-2xl border border-white/10 shadow-2xl p-5">
                <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                  <h3 className="font-sans font-black text-white text-xs uppercase flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-brand-primary" /> Sensors ({sensors.length})
                  </h3>
                </div>
                <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#050A18]/45">
                  <table className="w-full text-xs font-sans text-left border-collapse">
                    <thead>
                      <tr className="bg-[#050A18] text-[10px] font-bold uppercase text-white/50 border-b border-white/10">
                        <th className="px-4 py-3">Name</th><th className="px-4 py-3">Type</th><th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {sensors.map(s => (
                        <tr key={s.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 font-bold text-white">{s.name}</td>
                          <td className="px-4 py-3"><span className="text-[10px] bg-white/5 text-white/70 px-2 py-0.5 rounded border border-white/5 font-mono">{s.type}</span></td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button onClick={() => setEditingSensor(s)} className="px-2 py-1 bg-white/5 hover:bg-brand-primary text-white rounded text-[10px] font-bold transition-all cursor-pointer border border-white/10">Edit</button>
                              <button onClick={() => handleDeleteSensor(s.id, s.name)} className="px-2 py-1 bg-brand-primary/15 text-brand-primary hover:bg-brand-primary hover:text-white border border-brand-primary/20 rounded text-[10px] font-bold transition-all cursor-pointer">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Accessories */}
              <div className="bg-[#0A1128] rounded-2xl border border-white/10 shadow-2xl p-5">
                <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                  <h3 className="font-sans font-black text-white text-xs uppercase flex items-center gap-2">
                    <Settings className="w-4 h-4 text-brand-primary" /> Accessories ({accessories.length})
                  </h3>
                </div>
                <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#050A18]/45">
                  <table className="w-full text-xs font-sans text-left border-collapse">
                    <thead>
                      <tr className="bg-[#050A18] text-[10px] font-bold uppercase text-white/50 border-b border-white/10">
                        <th className="px-4 py-3">Name</th><th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {accessories.map(a => (
                        <tr key={a.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 font-bold text-white">{a.name}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button onClick={() => setEditingAccessory(a)} className="px-2 py-1 bg-white/5 hover:bg-brand-primary text-white rounded text-[10px] font-bold transition-all cursor-pointer border border-white/10">Edit</button>
                              <button onClick={() => handleDeleteAccessory(a.id, a.name)} className="px-2 py-1 bg-brand-primary/15 text-brand-primary hover:bg-brand-primary hover:text-white border border-brand-primary/20 rounded text-[10px] font-bold transition-all cursor-pointer">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── EDIT MODALS ─────────────────────────────────────── */}

      {/* Device Edit Modal */}
      {editingDevice && (
        <div className="fixed inset-0 bg-brand-darker/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-[#0A1128] rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(217,4,41,0.15)] w-full max-w-xl max-h-[90vh] overflow-y-auto flex flex-col scrollbar-none">
            <div className="bg-[#050A18] p-5 text-white flex justify-between items-center select-none border-b border-white/10">
              <h4 className="font-sans font-black text-base uppercase tracking-tight flex items-center gap-1.5">
                <FileEdit className="w-4 h-4 text-brand-primary" /> Edit: {editingDevice.name}
              </h4>
              <button onClick={() => setEditingDevice(null)} className="w-7 h-7 rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-brand-primary border border-white/10 flex items-center justify-center cursor-pointer transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={saveEditedDevice} className="p-6 flex flex-col gap-4 text-xs font-medium font-sans text-white">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/50 font-bold mb-1.5 uppercase tracking-wider">Model Name:</label>
                  <input type="text" required value={editingDevice.name} onChange={e => setEditingDevice({ ...editingDevice, name: e.target.value })}
                    className="w-full bg-brand-card/40 border border-white/10 rounded-xl px-3.5 py-2.5 font-semibold text-white outline-none focus:border-brand-primary" />
                </div>
                <div>
                  <label className="block text-white/50 font-bold mb-1.5 uppercase tracking-wider">Category:</label>
                  <select value={editingDevice.category} onChange={e => setEditingDevice({ ...editingDevice, category: e.target.value })}
                    className="w-full bg-brand-card/40 border border-white/10 rounded-xl px-3.5 py-2.5 font-semibold text-white outline-none focus:border-brand-primary cursor-pointer">
                    <option value="Video Telematics" className="bg-brand-darker">Video Telematics</option>
                    <option value="Advanced Telematics" className="bg-brand-darker">Advanced Telematics</option>
                    <option value="Standard Tracker" className="bg-brand-darker">Standard Tracker</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-white/50 font-bold mb-1.5 uppercase tracking-wider">Cameras (0-8):</label>
                <input type="number" min={0} max={8} value={editingDevice.camerasSupported} onChange={e => setEditingDevice({ ...editingDevice, camerasSupported: parseInt(e.target.value) || 0 })}
                  className="w-full bg-brand-card/40 border border-white/10 rounded-xl px-3.5 py-2.5 font-semibold text-white outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label className="block text-white/50 font-bold mb-2 uppercase tracking-wider">Platforms:</label>
                <div className="flex flex-wrap gap-1.5">
                  {PLATFORMS.map(pName => {
                    const active = editingDevice.platforms.includes(pName);
                    return (
                      <button key={pName} type="button"
                        onClick={() => setEditingDevice({ ...editingDevice, platforms: toggleIn(editingDevice.platforms, pName) })}
                        className={`px-3 py-1.5 border rounded-lg text-xs leading-none transition-all cursor-pointer font-bold ${active ? 'bg-brand-primary border-brand-primary text-white' : 'bg-white/5 text-white/70 border-white/10'}`}>
                        {pName}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-white/50 font-bold mb-1.5 uppercase tracking-wider">Description:</label>
                <textarea rows={2} value={editingDevice.description} onChange={e => setEditingDevice({ ...editingDevice, description: e.target.value })}
                  className="w-full bg-brand-card/40 border border-white/10 rounded-xl px-3.5 py-2.5 font-medium text-white outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label className="block text-white/50 font-bold mb-2 uppercase tracking-wider">Sensors:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 px-2 py-2 border border-white/10 rounded-xl bg-brand-card/20 max-h-[100px] overflow-y-auto">
                  {sensors.map(s => {
                    const active = editingDevice.sensors.includes(s.name);
                    return (
                      <button key={s.id} type="button"
                        onClick={() => setEditingDevice({ ...editingDevice, sensors: toggleIn(editingDevice.sensors, s.name) })}
                        className={`p-1.5 text-left rounded text-[10px] truncate cursor-pointer uppercase ${active ? 'bg-brand-primary text-white font-bold' : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'}`}>
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-white/50 font-bold mb-2 uppercase tracking-wider">Accessories:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 px-2 py-2 border border-white/10 rounded-xl bg-brand-card/20 max-h-[100px] overflow-y-auto">
                  {accessories.map(a => {
                    const active = editingDevice.accessories.includes(a.name);
                    return (
                      <button key={a.id} type="button"
                        onClick={() => setEditingDevice({ ...editingDevice, accessories: toggleIn(editingDevice.accessories, a.name) })}
                        className={`p-1.5 text-left rounded text-[10px] truncate cursor-pointer uppercase ${active ? 'bg-brand-primary text-white font-bold' : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'}`}>
                        {a.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2.5 pt-4 border-t border-white/10 mt-1">
                <button type="submit" className="flex-1 bg-brand-primary hover:bg-brand-primary/90 text-white text-xs py-2.5 rounded-lg font-black uppercase cursor-pointer">Save Changes</button>
                <button type="button" onClick={() => setEditingDevice(null)} className="px-4 py-2.5 bg-white/5 text-white/80 text-xs font-bold hover:bg-white/10 border border-white/10 rounded-lg cursor-pointer">Discard</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sensor Edit Modal */}
      {editingSensor && (
        <div className="fixed inset-0 bg-brand-darker/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-[#0A1128] rounded-2xl border border-white/10 w-full max-w-md p-6 flex flex-col gap-4 text-xs font-medium text-white">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h4 className="font-sans font-extrabold uppercase tracking-widest text-emerald-400 text-xs">Edit Sensor</h4>
              <button onClick={() => setEditingSensor(null)} className="text-white/40 hover:text-white font-bold cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={saveEditedSensor} className="flex flex-col gap-3 font-sans">
              <div>
                <label className="block text-white/50 font-bold mb-1.5 uppercase tracking-wider">Sensor Name:</label>
                <input type="text" required value={editingSensor.name} onChange={e => setEditingSensor({ ...editingSensor, name: e.target.value })}
                  className="w-full bg-brand-card/40 border border-white/10 rounded-xl px-3.5 py-2.5 font-semibold text-white outline-none focus:border-emerald-400" />
              </div>
              <div>
                <label className="block text-white/50 font-bold mb-1.5 uppercase tracking-wider">Protocol:</label>
                <select value={editingSensor.type} onChange={e => setEditingSensor({ ...editingSensor, type: e.target.value })}
                  className="w-full bg-brand-card/40 border border-white/10 rounded-xl px-3.5 py-2.5 font-semibold text-white outline-none focus:border-emerald-400 cursor-pointer">
                  <option value="Digital" className="bg-brand-darker">Digital</option>
                  <option value="Analog"  className="bg-brand-darker">Analog</option>
                  <option value="Serial"  className="bg-brand-darker">Serial</option>
                  <option value="Other"   className="bg-brand-darker">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-white/50 font-bold mb-1.5 uppercase tracking-wider">Description:</label>
                <textarea rows={2} value={editingSensor.description} onChange={e => setEditingSensor({ ...editingSensor, description: e.target.value })}
                  className="w-full bg-brand-card/40 border border-white/10 rounded-xl px-3.5 py-2.5 font-medium text-white outline-none focus:border-emerald-400" />
              </div>
              <div className="flex gap-2.5 pt-3.5 border-t border-white/10">
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-2.5 rounded-lg text-white font-bold uppercase transition-colors cursor-pointer">Save Changes</button>
                <button type="button" onClick={() => setEditingSensor(null)} className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 rounded-lg cursor-pointer">Discard</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Accessory Edit Modal */}
      {editingAccessory && (
        <div className="fixed inset-0 bg-brand-darker/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-[#0A1128] rounded-2xl border border-white/10 w-full max-w-md p-6 flex flex-col gap-4 text-xs font-medium text-white">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h4 className="font-sans font-extrabold uppercase tracking-widest text-blue-400 text-xs">Edit Accessory</h4>
              <button onClick={() => setEditingAccessory(null)} className="text-white/40 hover:text-white font-bold cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={saveEditedAccessory} className="flex flex-col gap-3 font-sans">
              <div>
                <label className="block text-white/50 font-bold mb-1.5 uppercase tracking-wider">Accessory Name:</label>
                <input type="text" required value={editingAccessory.name} onChange={e => setEditingAccessory({ ...editingAccessory, name: e.target.value })}
                  className="w-full bg-brand-card/40 border border-white/10 rounded-xl px-3.5 py-2.5 font-semibold text-white outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-white/50 font-bold mb-1.5 uppercase tracking-wider">Description:</label>
                <textarea rows={2} value={editingAccessory.description} onChange={e => setEditingAccessory({ ...editingAccessory, description: e.target.value })}
                  className="w-full bg-brand-card/40 border border-white/10 rounded-xl px-3.5 py-2.5 font-medium text-white outline-none focus:border-blue-400" />
              </div>
              <div className="flex gap-2.5 pt-3.5 border-t border-white/10">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 py-2.5 rounded-lg text-white font-bold uppercase transition-colors cursor-pointer">Save Changes</button>
                <button type="button" onClick={() => setEditingAccessory(null)} className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 rounded-lg cursor-pointer">Discard</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
