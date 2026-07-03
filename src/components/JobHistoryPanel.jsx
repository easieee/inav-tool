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
    <div className="flex items-start gap-4 px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
            isBack
              ? 'bg-amber-500/20 text-amber-400'
              : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            {isBack ? 'Back-Job Done' : 'Completed'}
          </span>
        </div>
        <p className="font-semibold text-white text-sm leading-tight">{job.title}</p>
        <p className="text-white/40 text-xs mt-0.5">
          Device: {job.device || '—'} · Assigned: {techNames || '—'}
        </p>
        <p className="text-white/40 text-xs">
          Schedule: {job.startTime} – {job.endTime}
        </p>
      </div>

      {canManageData && (
        <button
          onClick={() => setShowBackJob(true)}
          className="shrink-0 flex items-center gap-1.5 border border-brand-primary/30 text-brand-primary/70 hover:bg-brand-primary/10 hover:text-brand-primary px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
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
    <div className="bg-brand-card rounded-xl border border-white/10 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-white/10">
        <span className="text-[11px] font-bold uppercase tracking-widest text-white/40">
          Completed Job History
        </span>
      </div>

      <div className="max-h-72 overflow-y-auto">
        {sorted.length === 0 ? (
          <p className="px-5 py-8 text-white/40 text-sm text-center">
            No completed jobs yet. Mark a job as done to see it here.
          </p>
        ) : (
          sorted.map(job => <HistoryCard key={job.id} job={job} />)
        )}
      </div>
    </div>
  );
}
