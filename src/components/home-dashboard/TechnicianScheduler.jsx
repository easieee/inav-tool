import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import TopBar from '../TopBar.jsx';
import CalendarPanel from '../CalendarPanel.jsx';
import TechPerformancePanel from '../TechPerformancePanel.jsx';
import DispatchQueue from '../DispatchQueue.jsx';
import AuditLog from '../AuditLog.jsx';
import JobHistoryPanel from '../JobHistoryPanel.jsx';
import AddTechnicianModal from '../AddTechnicianModal.jsx';
import CreateJobModal from '../CreateJobModal.jsx';

export default function TechnicianScheduler({ onGoHome }) {
  const { loading } = useApp();
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [showAddTech, setShowAddTech] = useState(false);
  const [showCreateJob, setShowCreateJob] = useState(false);

  // Always start at the top when the dashboard loads or refreshes.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const shiftDate = (days) =>
    setCalendarDate((d) => {
      const nextDate = new Date(d);
      nextDate.setDate(nextDate.getDate() + days);
      return nextDate;
    });

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
          <span className="ml-3 text-white/40 text-sm">Loading data...</span>
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