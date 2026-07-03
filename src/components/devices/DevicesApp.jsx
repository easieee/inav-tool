import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import ClientDashboard from './ClientDashboard.jsx';
import DevPortal from './DevPortal.jsx';
import SiteNav from './SiteNav.jsx';
import { loadDevicesFromSheets, saveDevicesToSheets } from '../../lib/devicesAPI.js';
import { DEFAULT_DEVICES, DEFAULT_SENSORS, DEFAULT_ACCESSORIES } from '../../data/devicesDefaultData.js';

/**
 * Self-contained manager for the Devices & Compatibility section.
 * Shares auth token + spreadsheetId from AppContext.
 */
export default function DevicesApp({ onGoHome }) {
  const { user, spreadsheetId } = useApp();

  const [devices,     setDevices]     = useState([]);
  const [sensors,     setSensors]     = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [view,        setView]        = useState('client');
  const [isSyncing,   setIsSyncing]   = useState(false);
  const [syncError,   setSyncError]   = useState(null);
  const [loaded,      setLoaded]      = useState(false);

  // ── Local fallback ─────────────────────────────────────────
  const loadLocalFallback = useCallback(() => {
    try {
      const ld = localStorage.getItem('inav_devices');
      const ls = localStorage.getItem('inav_sensors');
      const la = localStorage.getItem('inav_accessories');
      setDevices(ld ? JSON.parse(ld) : DEFAULT_DEVICES);
      setSensors(ls ? JSON.parse(ls) : DEFAULT_SENSORS);
      setAccessories(la ? JSON.parse(la) : DEFAULT_ACCESSORIES);
    } catch {
      setDevices(DEFAULT_DEVICES);
      setSensors(DEFAULT_SENSORS);
      setAccessories(DEFAULT_ACCESSORIES);
    }
  }, []);

  // ── Sheets load ────────────────────────────────────────────
  const handleLoadFromSheets = useCallback(async (token, sheetId) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const data = await loadDevicesFromSheets(token, sheetId);
      setDevices(data.devices);
      setSensors(data.sensors);
      setAccessories(data.accessories);
      try {
        localStorage.setItem('inav_devices',     JSON.stringify(data.devices));
        localStorage.setItem('inav_sensors',     JSON.stringify(data.sensors));
        localStorage.setItem('inav_accessories', JSON.stringify(data.accessories));
      } catch {}
    } catch (err) {
      setSyncError(err.message || String(err));
      loadLocalFallback();
    } finally {
      setIsSyncing(false);
      setLoaded(true);
    }
  }, [loadLocalFallback]);

  // ── On mount — load once ───────────────────────────────────
  useEffect(() => {
    if (user?.accessToken && spreadsheetId) {
      handleLoadFromSheets(user.accessToken, spreadsheetId);
    } else {
      loadLocalFallback();
      setLoaded(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally once on mount

  // ── Force sync (retry) ─────────────────────────────────────
  const handleForceSync = useCallback(async () => {
    if (user?.accessToken && spreadsheetId) {
      await handleLoadFromSheets(user.accessToken, spreadsheetId);
    }
  }, [user, spreadsheetId, handleLoadFromSheets]);

  // ── Save helper ────────────────────────────────────────────
  const syncToSheets = useCallback(async (d, s, a) => {
    if (!user?.accessToken || !spreadsheetId) return;
    setIsSyncing(true);
    setSyncError(null);
    try {
      await saveDevicesToSheets(user.accessToken, spreadsheetId, d, s, a);
    } catch (err) {
      setSyncError(err.message || String(err));
    } finally {
      setIsSyncing(false);
    }
  }, [user, spreadsheetId]);

  // ── Update handlers (state + sheets) ──────────────────────
  // Note: sensors/accessories are captured from current render closure (correct values)
  const handleUpdateDevices = async (list) => {
    setDevices(list);
    try { localStorage.setItem('inav_devices', JSON.stringify(list)); } catch {}
    await syncToSheets(list, sensors, accessories);
  };

  const handleUpdateSensors = async (list) => {
    setSensors(list);
    try { localStorage.setItem('inav_sensors', JSON.stringify(list)); } catch {}
    await syncToSheets(devices, list, accessories);
  };

  const handleUpdateAccessories = async (list) => {
    setAccessories(list);
    try { localStorage.setItem('inav_accessories', JSON.stringify(list)); } catch {}
    await syncToSheets(devices, sensors, list);
  };

  // ── Loading screen ─────────────────────────────────────────
  if (!loaded) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary" />
        <span className="text-white/50 text-sm font-sans">Loading device catalog…</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      {view === 'client' ? (
        <ClientDashboard
          devices={devices}
          sensors={sensors}
          accessories={accessories}
          onOpenDevPortal={() => setView('dev')}
          onGoHome={onGoHome}
          isSyncing={isSyncing}
          syncError={syncError}
          onForceSync={handleForceSync}
        />
      ) : (
        <DevPortal
          devices={devices}
          sensors={sensors}
          accessories={accessories}
          onUpdateDevices={handleUpdateDevices}
          onUpdateSensors={handleUpdateSensors}
          onUpdateAccessories={handleUpdateAccessories}
          onClosePortal={() => setView('client')}
          onGoHome={onGoHome}
          isSyncing={isSyncing}
          syncError={syncError}
          onForceSync={handleForceSync}
        />
      )}
    </div>
  );
}
