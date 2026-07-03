import React, { useState } from 'react';
import { X, Trash2, Phone, Mail, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

export default function TechnicianDetailModal({ tech, onClose, colorClass }) {
  const { jobHistory, deleteTechnician, canManageData } = useApp();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const techJobs     = jobHistory.filter(h => (h.technicianIds || []).includes(tech.id));
  const completedJobs = techJobs.filter(h => h.isBackJob !== 'true');
  const backJobs      = techJobs.filter(h => h.isBackJob === 'true');
  const sorted        = [...techJobs].sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0));

  const initials = tech.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const handleDelete = async () => {
    setDeleting(true);
    await deleteTechnician(tech.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-brand-darker/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-brand-card border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-full ${colorClass} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
              {initials}
            </div>
            <div>
              <h2 className="text-white font-bold text-base leading-none">{tech.name}</h2>
              <p className="text-white/40 text-xs mt-1">{tech.email || 'No email on record'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-px bg-white/5 border-b border-white/10">
          <div className="bg-brand-card px-4 py-3.5 text-center">
            <p className="text-blue-400 font-bold text-xl leading-none">{tech.points ?? 0}</p>
            <p className="text-white/35 text-[10px] uppercase tracking-wider mt-1.5">Points</p>
          </div>
          <div className="bg-brand-card px-4 py-3.5 text-center">
            <p className="text-emerald-400 font-bold text-xl leading-none">{completedJobs.length}</p>
            <p className="text-white/35 text-[10px] uppercase tracking-wider mt-1.5">Jobs Done</p>
          </div>
          <div className="bg-brand-card px-4 py-3.5 text-center">
            <p className="text-orange-400 font-bold text-xl leading-none">{backJobs.length}</p>
            <p className="text-white/35 text-[10px] uppercase tracking-wider mt-1.5">Back-Jobs</p>
          </div>
        </div>

        {/* Contact info */}
        {(tech.phone || tech.email) && (
          <div className="px-5 py-3 border-b border-white/10 flex flex-wrap gap-5">
            {tech.phone && (
              <span className="flex items-center gap-1.5 text-xs text-white/50">
                <Phone className="h-3.5 w-3.5 shrink-0" /> {tech.phone}
              </span>
            )}
            {tech.email && (
              <span className="flex items-center gap-1.5 text-xs text-white/50">
                <Mail className="h-3.5 w-3.5 shrink-0" /> {tech.email}
              </span>
            )}
          </div>
        )}

        {/* Job history list */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-2.5 border-b border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
              Job History ({techJobs.length})
            </span>
          </div>
          {sorted.length === 0 ? (
            <p className="px-5 py-8 text-white/30 text-sm text-center">No job history yet.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {sorted.map(job => (
                <div key={job.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="shrink-0">
                    {job.isBackJob === 'true'
                      ? <RotateCcw className="h-3.5 w-3.5 text-orange-400" />
                      : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-xs font-semibold truncate">{job.title}</p>
                    <p className="text-white/35 text-[11px] mt-0.5">
                      {job.device || '—'} · {job.location || '—'}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    job.isBackJob === 'true'
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {job.isBackJob === 'true' ? 'Back-Job' : '+3 pts'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete section */}
        {canManageData && (
          <div className="p-5 border-t border-white/10">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-brand-primary/30 text-brand-primary/60 hover:bg-brand-primary/10 hover:text-brand-primary hover:border-brand-primary/50 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove Technician
              </button>
            ) : (
              <div className="bg-brand-primary/10 border border-brand-primary/30 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-start gap-2 text-xs text-brand-primary/90">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>
                    This will permanently remove <strong>{tech.name}</strong> from the system.
                    <p>Job history records will be preserved.</p>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    {deleting ? 'Removing…' : 'Confirm Remove'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 text-xs font-semibold py-2.5 rounded-lg border border-white/10 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
