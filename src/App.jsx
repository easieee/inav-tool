import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from './context/AppContext.jsx';
import TopBar from './components/TopBar.jsx';
import CalendarPanel from './components/CalendarPanel.jsx';
import TechPerformancePanel from './components/TechPerformancePanel.jsx';
import DispatchQueue from './components/DispatchQueue.jsx';
import AuditLog from './components/AuditLog.jsx';
import JobHistoryPanel from './components/JobHistoryPanel.jsx';
import AddTechnicianModal from './components/AddTechnicianModal.jsx';
import CreateJobModal from './components/CreateJobModal.jsx';

function AppContent() {
  const { user, loading } = useApp();
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [showAddTech, setShowAddTech] = useState(false);
  const [showCreateJob, setShowCreateJob] = useState(false);

  // Always start at the top when the dashboard loads or refreshes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const shiftDate = (days) =>
    setCalendarDate(d => { const n = new Date(d); n.setDate(n.getDate() + days); return n; });

  return (
    <div className="min-h-screen bg-slate-100">
      <TopBar
        calendarDate={calendarDate}
        onPrev={() => shiftDate(-1)}
        onNext={() => shiftDate(1)}
        onToday={() => setCalendarDate(new Date())}
        onAddTech={() => setShowAddTech(true)}
        onCreateJob={() => setShowCreateJob(true)}
      />

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          <span className="ml-3 text-slate-400 text-sm">Loading data…</span>
        </div>
      ) : (
        <div className="p-4 lg:p-5 space-y-4">
          <CalendarPanel date={calendarDate} />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
            <div className="lg:col-span-2 space-y-4">
              <TechPerformancePanel onAddTech={() => setShowAddTech(true)} />
              <AuditLog />
            </div>
            <div className="lg:col-span-3 space-y-4">
              <DispatchQueue onCreateJob={() => setShowCreateJob(true)} />
              <JobHistoryPanel />
            </div>
          </div>
        </div>
      )}

      <AddTechnicianModal isOpen={showAddTech} onClose={() => setShowAddTech(false)} />
      <CreateJobModal isOpen={showCreateJob} onClose={() => setShowCreateJob(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#fff',
            color: '#1e293b',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
        }}
      />
    </AppProvider>
  );
}
