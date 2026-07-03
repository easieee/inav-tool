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
import HomeDashboard from './components/HomeDashboard.jsx';
import DevicesApp from './components/devices/DevicesApp.jsx';

function AppContent({ onGoHome }) {
  const { loading } = useApp();
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
    <div className="min-h-screen bg-brand-darker">
      <TopBar
        calendarDate={calendarDate}
        onPrev={() => shiftDate(-1)}
        onNext={() => shiftDate(1)}
        onToday={() => setCalendarDate(new Date())}
        onAddTech={() => setShowAddTech(true)}
        onCreateJob={() => setShowCreateJob(true)}
        onGoHome={onGoHome}
      />
      <div className="h-16" />

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary" />
          <span className="ml-3 text-white/40 text-sm">Loading data…</span>
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

function AppInner({ screen, setScreen }) {
  if (screen === 'home') {
    return (
      <HomeDashboard
        onEnterScheduler={() => setScreen('scheduler')}
        onEnterDevices={() => setScreen('devices')}
      />
    );
  }
  if (screen === 'devices') {
    return <DevicesApp onGoHome={() => setScreen('home')} />;
  }
  return <AppContent onGoHome={() => setScreen('home')} />;
}

export default function App() {
  const [screen, setScreen] = useState('home');

  return (
    <AppProvider>
      <AppInner screen={screen} setScreen={setScreen} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1B263B',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#1B263B' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#1B263B' } }
        }}
      />
    </AppProvider>
  );
}
