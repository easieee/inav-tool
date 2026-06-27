import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  getAllRows,
  appendRow,
  updateRowById,
  deleteRowById,
  initializeSheets
} from '../lib/sheetsAPI';
import { generateId, todayStr } from '../lib/utils';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [jobOrders, setJobOrders] = useState([]);
  const [jobHistory, setJobHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);

  const addLog = useCallback((type, title, description) => {
    setAuditLogs(prev => [{
      id: Date.now().toString(36),
      type,
      title,
      description,
      timestamp: new Date()
    }, ...prev].slice(0, 60));
  }, []);

  useEffect(() => {
    addLog('system', 'System Initialized', 'Technician Scheduler loaded successfully.');
  }, []);

  const spreadsheetId = import.meta.env.VITE_SPREADSHEET_ID;
  const SESSION_KEY = 'techscheduler_session';

  /* ─────────────────────────────── DATA LOAD ─────────────────────────────── */

  const loadData = useCallback(async (token) => {
    if (!token || !spreadsheetId) return;
    setLoading(true);
    try {
      await initializeSheets(spreadsheetId, token);
      const [techs, orders, history] = await Promise.all([
        getAllRows(spreadsheetId, 'Technicians', token),
        getAllRows(spreadsheetId, 'JobOrders', token),
        getAllRows(spreadsheetId, 'JobHistory', token)
      ]);
      setTechnicians(techs);
      setJobOrders(orders);
      setJobHistory(history);
    } catch (err) {
      toast.error('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [spreadsheetId]);

  /* ─────────────────────────────── AUTH ──────────────────────────────────── */

  const login = useCallback(async (userInfo, token) => {
    const sessionUser = { ...userInfo, accessToken: token };
    setUser(sessionUser);
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser)); } catch {}
    addLog('system', 'User Logged In', `${userInfo.name} signed in via Google.`);
    await loadData(token);
  }, [loadData, addLog, SESSION_KEY]);

  const logout = useCallback(() => {
    try { localStorage.removeItem(SESSION_KEY); } catch {}
    setUser(null);
    setTechnicians([]);
    setJobOrders([]);
    setJobHistory([]);
    setAuditLogs([]);
  }, [SESSION_KEY]);

  // Restore session on page refresh
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (!saved) return;
      const savedUser = JSON.parse(saved);
      if (!savedUser?.accessToken) return;
      setUser(savedUser);
      loadData(savedUser.accessToken).catch(() => {
        // Token expired or revoked — clear stored session
        try { localStorage.removeItem(SESSION_KEY); } catch {}
        setUser(null);
        toast('Session expired — please sign in again.', { icon: '🔑' });
      });
    } catch {
      try { localStorage.removeItem(SESSION_KEY); } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally once on mount

  /* ─────────────────────────── TECHNICIANS ───────────────────────────────── */

  const addTechnician = useCallback(async (data) => {
    if (!user) return;
    const tech = {
      id: generateId(),
      name: data.name,
      email: data.email || '',
      phone: data.phone || '',
      points: 0,
      createdAt: new Date().toISOString()
    };
    try {
      await appendRow(spreadsheetId, 'Technicians', tech, user.accessToken);
      await loadData(user.accessToken);
      addLog('tech', 'Technician Added', `${tech.name} was registered as a technician.`);
      toast.success('Technician added!');
    } catch (err) {
      toast.error('Failed to add technician: ' + err.message);
    }
  }, [user, spreadsheetId, loadData, addLog]);

  const updateTechnician = useCallback(async (id, data) => {
    if (!user) return;
    try {
      await updateRowById(spreadsheetId, 'Technicians', id, data, user.accessToken);
      await loadData(user.accessToken);
      toast.success('Technician updated!');
    } catch (err) {
      toast.error('Failed to update: ' + err.message);
    }
  }, [user, spreadsheetId, loadData]);

  /** Internal helper — update points without reloading all data */
  const _adjustPoints = useCallback(async (techId, delta) => {
    const tech = technicians.find(t => t.id === techId);
    if (!tech || !user) return;
    const newPoints = (tech.points || 0) + delta;
    await updateRowById(spreadsheetId, 'Technicians', techId, { points: newPoints }, user.accessToken);
  }, [user, technicians, spreadsheetId]);

  /* ─────────────────────────── JOB ORDERS ───────────────────────────────── */

  const addJobOrder = useCallback(async (data) => {
    if (!user) return;
    const job = {
      id: generateId(),
      title: data.title,
      description: data.description || '',
      client: data.client,
      location: data.location,
      device: data.device,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      technicianIds: Array.isArray(data.technicianIds) ? data.technicianIds : [],
      status: 'active',
      createdBy: user.name,
      createdByEmail: user.email,
      createdAt: new Date().toISOString(),
      isBackJob: 'false',
      originalJobId: ''
    };
    try {
      await appendRow(spreadsheetId, 'JobOrders', job, user.accessToken);
      await loadData(user.accessToken);
      addLog('job', 'Job Order Created', `"${job.title}" was created by ${user.name}.`);
      toast.success('Job order created!');
    } catch (err) {
      toast.error('Failed to create job: ' + err.message);
    }
  }, [user, spreadsheetId, loadData, addLog]);

  const updateJobOrder = useCallback(async (id, data) => {
    if (!user) return;
    try {
      await updateRowById(spreadsheetId, 'JobOrders', id, data, user.accessToken);
      await loadData(user.accessToken);
      toast.success('Job order updated!');
    } catch (err) {
      toast.error('Failed to update job: ' + err.message);
    }
  }, [user, spreadsheetId, loadData]);

  const deleteJobOrder = useCallback(async (id) => {
    if (!user) return;
    try {
      await deleteRowById(spreadsheetId, 'JobOrders', id, user.accessToken);
      await loadData(user.accessToken);
      toast.success('Job order deleted.');
    } catch (err) {
      toast.error('Failed to delete: ' + err.message);
    }
  }, [user, spreadsheetId, loadData]);

  /**
   * Mark a regular job as DONE:
   *  - Copies job to JobHistory
   *  - Clears it from JobOrders
   *  - Awards +5 points to each assigned technician
   */
  const markJobDone = useCallback(async (id) => {
    if (!user) return;
    const job = jobOrders.find(j => j.id === id);
    if (!job) return;
    setLoading(true);
    try {
      const histEntry = {
        ...job,
        completedAt: new Date().toISOString(),
        isBackJob: job.isBackJob || 'false',
        originalJobId: job.originalJobId || ''
      };
      await appendRow(spreadsheetId, 'JobHistory', histEntry, user.accessToken);
      await deleteRowById(spreadsheetId, 'JobOrders', id, user.accessToken);

      // +5 for each technician
      for (const techId of (job.technicianIds || [])) {
        await _adjustPoints(techId, 5);
      }

      await loadData(user.accessToken);
      addLog('job', 'Job Completed', `"${job.title}" marked done. +5 points awarded to each technician.`);
      toast.success('Job completed! +5 pts per technician.');
    } catch (err) {
      toast.error('Failed to mark done: ' + err.message);
      setLoading(false);
    }
  }, [user, jobOrders, spreadsheetId, _adjustPoints, loadData, addLog]);

  /**
   * Create a Back-Job from a history entry:
   *  - Creates new JobOrders entry (isBackJob=true) with assigned technicians
   *  - Deducts -2 pts from original technicians
   */
  const createBackJob = useCallback(async (historyId, newTechIds, overrides = {}) => {
    if (!user) return;
    const orig = jobHistory.find(h => h.id === historyId);
    if (!orig) return;
    setLoading(true);
    try {
      const backJob = {
        id: generateId(),
        title: orig.title + ' (Back-Job)',
        description: orig.description,
        client: orig.client,
        location: orig.location,
        device: orig.device,
        date: overrides.date || todayStr(),
        startTime: overrides.startTime || orig.startTime,
        endTime: overrides.endTime || orig.endTime,
        technicianIds: newTechIds,
        status: 'active',
        createdBy: user.name,
        createdByEmail: user.email,
        createdAt: new Date().toISOString(),
        isBackJob: 'true',
        originalJobId: historyId
      };
      await appendRow(spreadsheetId, 'JobOrders', backJob, user.accessToken);

      // -2 for original technicians
      const origTechIds = Array.isArray(orig.technicianIds) ? orig.technicianIds : [];
      for (const techId of origTechIds) {
        await _adjustPoints(techId, -2);
      }

      await loadData(user.accessToken);
      addLog('backjob', 'Back-Job Created', `Back-job created from "${orig.title}". Original technicians penalized -2 pts.`);
      toast.success('Back-job created! -2 pts deducted from original technicians.');
    } catch (err) {
      toast.error('Failed to create back-job: ' + err.message);
      setLoading(false);
    }
  }, [user, jobHistory, spreadsheetId, _adjustPoints, loadData, addLog]);

  const value = {
    user,
    technicians,
    jobOrders,
    jobHistory,
    auditLogs,
    loading,
    spreadsheetId,
    login,
    logout,
    loadData,
    addTechnician,
    updateTechnician,
    addJobOrder,
    updateJobOrder,
    deleteJobOrder,
    markJobDone,
    createBackJob
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
