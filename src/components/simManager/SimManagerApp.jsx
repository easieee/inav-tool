import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, Database, Coins, Plus, CheckCircle2, AlertTriangle, Settings, History } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { loadSimManagerFromSheets, saveSimManagerToSheets, SIM_MANAGER_SPREADSHEET_ID } from '../../lib/simManagerAPI.js';
import { DEFAULT_SIMS, DEFAULT_PROMOS } from '../../data/simManagerDefaultData.js';
import { calculateRegularBalanceDaysRemaining, calculatePlatformDaysRemaining, formatDate, addDays, getSimExpiryAlerts } from '../../lib/simDateUtils.js';
import SimList from './SimList.jsx';
import PromoManager from './PromoManager.jsx';
import LoadRequestForm from './LoadRequestForm.jsx';
import NotificationCenter from './NotificationCenter.jsx';
import AddSimModal from './AddSimModal.jsx';
import AuditLogPanel from './AuditLogPanel.jsx';

/**
 * Self-contained manager for the SIM Fleet / Load Requests / Promo Catalog section.
 * Shares the signed-in Google auth token from AppContext, but reads/writes to its
 * own dedicated Google Sheet (SIM_MANAGER_SPREADSHEET_ID) rather than the shared
 * technician-scheduler spreadsheet.
 */
export default function SimManagerApp({ onGoHome }) {
  const { user, canManageData, publicReadMode } = useApp();

  // App Core State
  const [sims, setSims] = useState([]);
  const [promos, setPromos] = useState([]);
  const [loadRequests, setLoadRequests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // UI Navigation State
  const [activeTab, setActiveTab] = useState('sims');
  const [preselectedIccid, setPreselectedIccid] = useState('');
  const [isAddSimOpen, setIsAddSimOpen] = useState(false);
  const [editingSim, setEditingSim] = useState(null);
  const [isPromoOnlyMode, setIsPromoOnlyMode] = useState(false);

  // ── Local fallback ─────────────────────────────────────────
  const loadLocalFallback = useCallback(() => {
    try {
      const ls = localStorage.getItem('siman_sims');
      const lp = localStorage.getItem('siman_promos');
      const lr = localStorage.getItem('siman_requests');
      const la = localStorage.getItem('siman_auditlogs');
      setSims(ls ? JSON.parse(ls) : DEFAULT_SIMS);
      setPromos(lp ? JSON.parse(lp) : DEFAULT_PROMOS);
      setLoadRequests(lr ? JSON.parse(lr) : []);
      setAuditLogs(la ? JSON.parse(la) : []);
    } catch {
      setSims(DEFAULT_SIMS);
      setPromos(DEFAULT_PROMOS);
      setLoadRequests([]);
      setAuditLogs([]);
    }
  }, []);

  // ── Sheets load ────────────────────────────────────────────
  const handleLoadFromSheets = useCallback(async () => {
    setSyncing(true);
    setSyncError('');
    try {
      // Always use public GViz read (null token) — no sign-in required.
      const data = await loadSimManagerFromSheets(null, SIM_MANAGER_SPREADSHEET_ID);
      setSims(data.sims);
      setPromos(data.promos.length > 0 ? data.promos : DEFAULT_PROMOS);
      setLoadRequests(data.loadRequests);
      setAuditLogs(data.auditLogs);
      try {
        localStorage.setItem('siman_sims', JSON.stringify(data.sims));
        localStorage.setItem('siman_promos', JSON.stringify(data.promos));
        localStorage.setItem('siman_requests', JSON.stringify(data.loadRequests));
        localStorage.setItem('siman_auditlogs', JSON.stringify(data.auditLogs));
      } catch {}
    } catch (err) {
      setSyncError(err.message || String(err));
      loadLocalFallback();
    } finally {
      setSyncing(false);
      setLoaded(true);
    }
  }, [loadLocalFallback]);

  // ── On mount — load once ───────────────────────────────────
  useEffect(() => {
    handleLoadFromSheets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally once on mount

  // ── Force sync (retry) ─────────────────────────────────────
  const handleForceSync = useCallback(async () => {
    await handleLoadFromSheets();
  }, [handleLoadFromSheets]);

  // ── Save helper (read-only mode — writes disabled) ─────────
  // eslint-disable-next-line no-unused-vars
  const syncToSheets = useCallback(async (_s, _p, _r, _a) => {
    // Sheet is read-only via public GViz; writes are disabled.
  }, []);

  // ── Audit log helper ────────────────────────────────────────
  const recordAuditLog = useCallback((type, title, description) => {
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
      type,
      title,
      description,
      user: user?.name || 'Anonymous',
      userEmail: user?.email || '',
    };
    const updated = [entry, ...auditLogs].slice(0, 200);
    setAuditLogs(updated);
    return updated;
  }, [auditLogs, user]);

  // ── Persist state locally as fallback whenever it changes ──
  useEffect(() => {
    try { localStorage.setItem('siman_sims', JSON.stringify(sims)); } catch {}
  }, [sims]);
  useEffect(() => {
    try { localStorage.setItem('siman_promos', JSON.stringify(promos)); } catch {}
  }, [promos]);
  useEffect(() => {
    try { localStorage.setItem('siman_requests', JSON.stringify(loadRequests)); } catch {}
  }, [loadRequests]);
  useEffect(() => {
    try { localStorage.setItem('siman_auditlogs', JSON.stringify(auditLogs)); } catch {}
  }, [auditLogs]);

  // ── Clear toast after a delay ───────────────────────────────
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Dynamic Dashboard Stats
  const stats = useMemo(() => {
    const totalSims = sims.length;
    let warningCount = 0;
    let platformExpiringCount = 0;
    let totalBalance = 0;

    sims.forEach(sim => {
      totalBalance += sim.regularBalance || 0;
      const alerts = getSimExpiryAlerts(sim);
      if (alerts.length > 0) {
        warningCount++;
      }

      const platformDays = calculatePlatformDaysRemaining(sim.expirationOfSubs);
      if (platformDays <= 3) {
        platformExpiringCount++;
      }
    });

    const pendingRequestsCount = loadRequests.filter(r => r.status === 'Pending').length;

    return { totalSims, warningCount, platformExpiringCount, totalBalance, pendingRequestsCount };
  }, [sims, loadRequests]);

  // Action: Add / Edit SIM
  const handleSaveSim = (savedSim) => {
    const exists = sims.some(s => s.iccid === savedSim.iccid);
    let updatedSims;
    let updatedAuditLogs = auditLogs;
    if (exists) {
      updatedSims = sims.map(s => s.iccid === savedSim.iccid ? savedSim : s);
      setToastMessage(`Updated SIM ${savedSim.sim} successfully.`);
    } else {
      updatedSims = [...sims, savedSim];
      setToastMessage(`Added SIM ${savedSim.sim} successfully.`);
      updatedAuditLogs = recordAuditLog(
        'register',
        'SIM Registered',
        `${savedSim.sim} (ICCID ...${savedSim.iccid.slice(-6)}) registered under ${savedSim.company || 'Unassigned'}.`
      );
    }
    setSims(updatedSims);
    syncToSheets(updatedSims, promos, loadRequests, updatedAuditLogs);
  };

  // Action: Delete SIM
  const handleDeleteSim = (iccid) => {
    const confirmed = window.confirm('Are you sure you want to delete this SIM card registry? This cannot be undone.');
    if (!confirmed) return;

    const updatedSims = sims.filter(s => s.iccid !== iccid);
    setSims(updatedSims);
    setToastMessage('SIM card deleted successfully.');
    syncToSheets(updatedSims, promos, loadRequests, auditLogs);
  };

  // Action: Add Promo
  const handleAddPromo = (newPromo) => {
    const updatedPromos = [...promos, newPromo];
    setPromos(updatedPromos);
    setToastMessage(`Added Promo "${newPromo.name}" to catalog.`);
    const updatedAuditLogs = recordAuditLog(
      'promo',
      'Promo Added',
      `Promo "${newPromo.name}" (${newPromo.durationDays} days) added to catalog.`
    );
    syncToSheets(sims, updatedPromos, loadRequests, updatedAuditLogs);
  };

  // Action: Delete Promo
  const handleDeletePromo = (promoName) => {
    const confirmed = window.confirm(`Remove "${promoName}" from Promo plans? Existing assignments on SIMs will remain until updated.`);
    if (!confirmed) return;

    const updatedPromos = promos.filter(p => p.name !== promoName);
    setPromos(updatedPromos);
    setToastMessage(`Removed Promo "${promoName}".`);
    syncToSheets(sims, updatedPromos, loadRequests, auditLogs);
  };

  // Action: Request Load (Apply & Record transaction)
  const handleRequestLoad = (data) => {
    let targetSim;
    let updatedSims = [...sims];

    if (data.isManual) {
      // Create and append the new manual SIM card immediately so it exists in fleet list
      const newSim = {
        iccid: data.simData.iccid || '',
        company: data.simData.company || 'Unassigned',
        plate: data.simData.plate || '',
        imei: data.simData.imei || '',
        model: data.simData.model || '',
        brand: data.simData.brand || '',
        sim: data.simData.sim || '',
        regularBalance: data.simData.regularBalance || 0,
        loadDate: data.simData.loadDate || formatDate(new Date()),
        daysRemaining: calculateRegularBalanceDaysRemaining(data.simData.loadDate || ''),
        promo: '', // Initialize empty because promo load is Pending
        promoExp: '',
        daysRemainingPlatform: calculatePlatformDaysRemaining(data.simData.expirationOfSubs || ''),
        dateOfSubs: data.simData.dateOfSubs || formatDate(new Date()),
        expirationOfSubs: data.simData.expirationOfSubs || formatDate(addDays(new Date(), 365)),
        lastUpdated: new Date().toISOString()
      };

      targetSim = newSim;
      updatedSims.push(newSim);
      setSims(updatedSims);
    } else {
      // Find the existing SIM card
      const idx = sims.findIndex(s => s.iccid === data.simData.iccid);
      if (idx === -1) return;
      targetSim = sims[idx];
    }

    // Record the Load Request as Pending
    const newRequest = {
      id: 'REQ-' + Date.now().toString().slice(-6),
      timestamp: new Date().toISOString(),
      iccid: targetSim.iccid,
      sim: targetSim.sim,
      company: targetSim.company,
      plate: targetSim.plate,
      type: data.loadType,
      amountOrPromo: data.loadType === 'Regular' ? `₱${data.amountOrPromoName}` : data.amountOrPromoName,
      status: 'Pending',
      notes: data.notes
    };

    const updatedRequests = [newRequest, ...loadRequests];
    setLoadRequests(updatedRequests);
    setToastMessage(`Load request ${newRequest.id} created with "Pending" status.`);
    const updatedAuditLogs = recordAuditLog(
      'load',
      'SIM Load Requested',
      `${newRequest.type} load request ${newRequest.id} (${newRequest.amountOrPromo}) submitted for ${targetSim.sim}.`
    );
    syncToSheets(updatedSims, promos, updatedRequests, updatedAuditLogs);
  };

  // Action: Confirm Load (Confirm SIM is loaded, mark request Completed & apply to SIM)
  const handleConfirmLoad = (requestId) => {
    const reqIdx = loadRequests.findIndex(r => r.id === requestId);
    if (reqIdx === -1) return;
    const request = { ...loadRequests[reqIdx] };
    if (request.status !== 'Pending') return;

    // Apply load changes to the targeted SIM card
    const updatedSims = sims.map(sim => {
      if (sim.iccid === request.iccid) {
        const targetSim = { ...sim };
        if (request.type === 'Regular') {
          // Parse number from string like "₱100" or raw "100"
          const topup = parseFloat(request.amountOrPromo.replace('₱', '')) || 0;
          targetSim.regularBalance = (targetSim.regularBalance || 0) + topup;
          targetSim.loadDate = formatDate(new Date()); // restart countdown from today
          targetSim.daysRemaining = 90; // reset to 90 days
        } else {
          // Promo load type
          const promoName = request.amountOrPromo;
          const matchedPromo = promos.find(p => p.name === promoName);
          const duration = matchedPromo ? matchedPromo.durationDays : 30;

          targetSim.promo = promoName;
          targetSim.promoExp = formatDate(addDays(new Date(), duration)); // automatically compute expiration
        }
        targetSim.lastUpdated = new Date().toISOString();
        return targetSim;
      }
      return sim;
    });

    request.status = 'Completed';
    const updatedRequests = loadRequests.map(r => r.id === requestId ? request : r);

    setSims(updatedSims);
    setLoadRequests(updatedRequests);
    setToastMessage(`Confirmed: Request ${requestId} is loaded. Fleet balance updated successfully!`);
    syncToSheets(updatedSims, promos, updatedRequests, auditLogs);
  };

  // Action: Reject Load (Mark request Rejected)
  const handleRejectLoad = (requestId) => {
    const reqIdx = loadRequests.findIndex(r => r.id === requestId);
    if (reqIdx === -1) return;
    const request = { ...loadRequests[reqIdx] };
    if (request.status !== 'Pending') return;

    request.status = 'Rejected';
    const updatedRequests = loadRequests.map(r => r.id === requestId ? request : r);

    setLoadRequests(updatedRequests);
    setToastMessage(`Load request ${requestId} has been marked as Rejected.`);
    syncToSheets(sims, promos, updatedRequests, auditLogs);
  };

  // Pre-fill SIM in load request tab
  const handleSelectForLoad = (iccid) => {
    setPreselectedIccid(iccid);
    setActiveTab('load');
  };

  // ── Loading screen ─────────────────────────────────────────
  if (!loaded) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        <span className="text-slate-400 text-sm font-sans">Loading SIM fleet registry…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col font-sans selection:bg-blue-600/30">

      {/* Header Bar */}
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
          <h1 className="text-sm font-bold tracking-wide text-white/80 hidden sm:block">SIM Manager</h1>
        </div>

        <div className="flex items-center gap-3">
          <NotificationCenter
            sims={sims}
            onSelectSim={(iccid) => {
              const matched = sims.find(s => s.iccid === iccid);
              if (matched) {
                setEditingSim(matched);
                setIsAddSimOpen(true);
              }
            }}
          />

        </div>
      </header>
      <div className="h-[53px]" />

      {/* Visual Toast & Sync Alerts banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e293b] border-l-4 border-emerald-500 text-white rounded-xl shadow-2xl py-3 px-5 flex items-center gap-3 animate-slideUp text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {syncError && (
        <div className="bg-amber-950/20 border-b border-amber-500/30 text-amber-200 text-xs text-center py-2 px-4 font-sans">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{syncError}</span>
            <button onClick={handleForceSync} className="underline font-bold ml-2 hover:text-amber-100 transition-colors cursor-pointer">
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Hero iNAV Tools Title banner */}
      <section className="py-10 bg-gradient-to-b from-slate-900/50 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 max-w-5xl mx-auto">

            {/* Stat 1: Total SIMs */}
            <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 text-left space-y-1 hover:border-blue-500 transition-colors">
              <span className="label block">Total Fleet SIMs</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-sans font-bold text-white">{stats.totalSims}</span>
                <span className="text-[10px] font-mono text-slate-400">active items</span>
              </div>
            </div>

            {/* Stat 2: Warnings (3-day threshold) */}
            <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 text-left space-y-1 hover:border-amber-500 transition-colors">
              <span className="label block">Expiry Alerts</span>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-sans font-bold ${stats.warningCount > 0 ? 'text-amber-500 animate-pulse' : 'text-white'}`}>
                  {stats.warningCount}
                </span>
                <span className="text-[10px] font-mono text-slate-400">within 3 days</span>
              </div>
            </div>

            {/* Stat 3: Platform Expired */}
            <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 text-left space-y-1 hover:border-red-500 transition-colors">
              <span className="label block">Sub Expirations</span>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-sans font-bold ${stats.platformExpiringCount > 0 ? 'text-red-500' : 'text-white'}`}>
                  {stats.platformExpiringCount}
                </span>
                <span className="text-[10px] font-mono text-slate-400">low days</span>
              </div>
            </div>

            {/* Stat 4: Combined Balance */}
            <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 text-left space-y-1 hover:border-emerald-500 transition-colors">
              <span className="label block">Total Loaded Capital</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-sans font-semibold text-white">₱{stats.totalBalance.toLocaleString()}</span>
                <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-0.5">
                  <Coins className="w-3 h-3 shrink-0" />
                  active
                </span>
              </div>
            </div>

            {/* Stat 5: Requesting Load */}
            <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 text-left space-y-1 hover:border-violet-500 transition-colors">
              <span className="label block">Requesting Load</span>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-sans font-bold ${stats.pendingRequestsCount > 0 ? 'text-violet-400' : 'text-white'}`}>
                  {stats.pendingRequestsCount}
                </span>
                <span className="text-[10px] font-mono text-slate-400">pending</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Section Tab bar */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-16">

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

          {/* Box 1: SIM Fleet List */}
          <button
            onClick={() => setActiveTab('sims')}
            className={`text-left p-6 rounded-2xl border transition-all duration-200 outline-none flex items-start gap-4 cursor-pointer ${
              activeTab === 'sims'
                ? 'bg-[#1e293b] border-blue-500/50 shadow-xl shadow-blue-950/10'
                : 'bg-[#1e293b]/40 border-[#334155]/60 hover:bg-[#1e293b] hover:border-[#334155]'
            }`}
            id="tab-box-sims"
          >
            <div className={`p-3 rounded-xl ${activeTab === 'sims' ? 'bg-blue-500/15 text-blue-500' : 'bg-slate-800/40 text-slate-400'}`}>
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-sans font-semibold text-base text-white">SIM Fleet Master</h3>
              <span className="text-[10px] font-mono font-bold text-blue-400 mt-3 inline-flex items-center gap-1">
                Open Fleet Registry &rarr;
              </span>
            </div>
          </button>

          {/* Box 2: Load Request Form */}
          <button
            onClick={() => {
              setActiveTab('load');
              setPreselectedIccid('');
            }}
            className={`text-left p-6 rounded-2xl border transition-all duration-200 outline-none flex items-start gap-4 cursor-pointer ${
              activeTab === 'load'
                ? 'bg-[#1e293b] border-blue-500/50 shadow-xl shadow-blue-950/10'
                : 'bg-[#1e293b]/40 border-[#334155]/60 hover:bg-[#1e293b] hover:border-[#334155]'
            }`}
            id="tab-box-load"
          >
            <div className={`p-3 rounded-xl ${activeTab === 'load' ? 'bg-blue-500/15 text-blue-500' : 'bg-slate-800/40 text-slate-400'}`}>
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-sans font-semibold text-base text-white">Request SIM Load</h3>
              <span className="text-[10px] font-mono font-bold text-blue-400 mt-3 inline-flex items-center gap-1">
                Open Load Wizard &rarr;
              </span>
            </div>
          </button>

          {/* Box 3: Promo catalog */}
          <button
            onClick={() => setActiveTab('promos')}
            className={`text-left p-6 rounded-2xl border transition-all duration-200 outline-none flex items-start gap-4 cursor-pointer ${
              activeTab === 'promos'
                ? 'bg-[#1e293b] border-blue-500/50 shadow-xl shadow-blue-950/10'
                : 'bg-[#1e293b]/40 border-[#334155]/60 hover:bg-[#1e293b] hover:border-[#334155]'
            }`}
            id="tab-box-promos"
          >
            <div className={`p-3 rounded-xl ${activeTab === 'promos' ? 'bg-blue-500/15 text-blue-500' : 'bg-slate-800/40 text-slate-400'}`}>
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-sans font-semibold text-base text-white">Promo Catalog</h3>
              <span className="text-[10px] font-mono font-bold text-blue-400 mt-3 inline-flex items-center gap-1">
                Manage Plans &rarr;
              </span>
            </div>
          </button>

          {/* Box 4: Activity Log */}
          <button
            onClick={() => setActiveTab('audit')}
            className={`text-left p-6 rounded-2xl border transition-all duration-200 outline-none flex items-start gap-4 cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-[#1e293b] border-blue-500/50 shadow-xl shadow-blue-950/10'
                : 'bg-[#1e293b]/40 border-[#334155]/60 hover:bg-[#1e293b] hover:border-[#334155]'
            }`}
            id="tab-box-audit"
          >
            <div className={`p-3 rounded-xl ${activeTab === 'audit' ? 'bg-blue-500/15 text-blue-500' : 'bg-slate-800/40 text-slate-400'}`}>
              <History className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-sans font-semibold text-base text-white">Activity Log</h3>
              <span className="text-[10px] font-mono font-bold text-blue-400 mt-3 inline-flex items-center gap-1">
                View Audit Trail &rarr;
              </span>
            </div>
          </button>

        </div>

        {/* Dynamic Content Area */}
        <div className="bg-[#1e293b]/40 border border-[#334155]/60 rounded-2xl p-6 md:p-8 min-h-[400px]">

          {activeTab === 'sims' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-sans font-medium text-white tracking-tight">Active SIM Fleet Master</h2>
                </div>

                {canManageData && (
                  <button
                    onClick={() => {
                      setEditingSim(null);
                      setIsAddSimOpen(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-sans text-sm font-semibold py-2 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-900/10 hover:shadow-blue-900/20 cursor-pointer"
                    id="btn-register-new-sim"
                  >
                    <Plus className="w-4 h-4" />
                    Register SIM
                  </button>
                )}
              </div>

              <SimList
                sims={sims}
                onEditSim={(sim) => {
                  setEditingSim(sim);
                  setIsAddSimOpen(true);
                }}
                onDeleteSim={handleDeleteSim}
                onSelectForLoad={handleSelectForLoad}
              />
            </div>
          )}

          {activeTab === 'load' && (
            <LoadRequestForm
              sims={sims}
              promos={promos}
              loadRequests={loadRequests}
              preselectedIccid={preselectedIccid}
              onRequestLoad={handleRequestLoad}
              onConfirmLoad={handleConfirmLoad}
              onRejectLoad={handleRejectLoad}
              canManageData={canManageData}
              onEditSim={(sim) => {
                setEditingSim(sim);
                setIsPromoOnlyMode(true);
                setIsAddSimOpen(true);
              }}
            />
          )}

          {activeTab === 'promos' && (
            <PromoManager
              promos={promos}
              onAddPromo={handleAddPromo}
              onDeletePromo={handleDeletePromo}
              canManageData={canManageData}
            />
          )}

          {activeTab === 'audit' && (
            <AuditLogPanel auditLogs={auditLogs} />
          )}

        </div>
      </main>

      {/* Form/Modal Registry layer */}
      <AddSimModal
        isOpen={isAddSimOpen}
        onClose={() => {
          setIsAddSimOpen(false);
          setEditingSim(null);
          setIsPromoOnlyMode(false);
        }}
        onSave={handleSaveSim}
        editingSim={editingSim}
        promos={promos}
        isPromoOnlyMode={isPromoOnlyMode}
      />

    </div>
  );
}
