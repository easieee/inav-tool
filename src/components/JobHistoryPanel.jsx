import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { RotateCcw } from 'lucide-react';
import BackJobModal from './BackJobModal.jsx';

function HistoryCard({ job }) {
  const { technicians, canManageData } = useApp();
  const [showBackJob, setShowBackJob] = useState(false);

  const techNames = (job.technicianIds || [])
    .map(id => technicians.find(t => t.id === id)?.name || id)
    .filter(Boolean)
    .join(', ');

  const isBack = job.isBackJob === 'true';

  return (
    <div className="flex items-start gap-4 px-5 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
            isBack
              ? 'bg-amber-100 text-amber-600'
              : 'bg-emerald-100 text-emerald-600'
          }`}>
            {isBack ? 'Back-Job Done' : 'Completed'}
          </span>
        </div>
        <p className="font-semibold text-slate-800 text-sm leading-tight">{job.title}</p>
        <p className="text-slate-400 text-xs mt-0.5">
          Device: {job.device || '—'} · Assigned: {techNames || '—'}
        </p>
        <p className="text-slate-400 text-xs">
          Schedule: {job.startTime} – {job.endTime}
        </p>
      </div>

      {canManageData && (
        <button
          onClick={() => setShowBackJob(true)}
          className="shrink-0 flex items-center gap-1.5 border border-red-200 text-red-400 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          Create Back-Job
        </button>
      )}

      {canManageData && showBackJob && (
        <BackJobModal isOpen historyJob={job} onClose={() => setShowBackJob(false)} />
      )}
    </div>
  );
}

export default function JobHistoryPanel() {
  const { jobHistory } = useApp();

  const sorted = [...jobHistory].sort(
    (a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0)
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
          Completed Job History
        </span>
      </div>

      <div className="max-h-72 overflow-y-auto">
        {sorted.length === 0 ? (
          <p className="px-5 py-8 text-slate-400 text-sm text-center">
            No completed jobs yet. Mark a job as done to see it here.
          </p>
        ) : (
          sorted.map(job => <HistoryCard key={job.id} job={job} />)
        )}
      </div>
    </div>
  );
}
