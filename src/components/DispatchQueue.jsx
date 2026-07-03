import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { format } from 'date-fns';
import { CheckCircle2, Edit2, Trash2, Plus, Monitor, MapPin, User } from 'lucide-react';
import EditJobModal from './EditJobModal.jsx';
import DeleteConfirmModal from './DeleteConfirmModal.jsx';

function JobRow({ job }) {
  const { technicians, markJobDone, deleteJobOrder, canManageData } = useApp();
  const [showEdit,   setShowEdit]   = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [marking,   setMarking]   = useState(false);

  const isBackJob = job.isBackJob === 'true';

  const techNames = (job.technicianIds || [])
    .map(id => technicians.find(t => t.id === id)?.name || id)
    .filter(Boolean)
    .join(', ');

  const handleMarkDone = async () => {
    setMarking(true);
    await markJobDone(job.id);
  };

  return (
    <div className={`flex items-start gap-4 px-5 py-4 border-b border-white/5 last:border-0 transition-colors hover:bg-white/5 ${isBackJob ? 'bg-orange-500/5' : ''}`}>

      {/* Status + time */}
      <div className="shrink-0 w-24 text-right">
        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
          isBackJob
            ? 'bg-orange-500/20 text-orange-400'
            : 'bg-blue-500/20 text-blue-400'
        }`}>
          {isBackJob ? 'Back-Job' : 'Pending'}
        </span>
        <p className="text-white/40 text-[11px] mt-1 font-medium">
          {job.startTime} – {job.endTime}
        </p>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white text-sm mb-1 leading-tight">{job.title}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-white/40">
          {job.device   && <span className="flex items-center gap-1"><Monitor className="h-3 w-3 shrink-0" />{job.device}</span>}
          {job.location && <span className="flex items-center gap-1"><MapPin   className="h-3 w-3 shrink-0" />{job.location}</span>}
          {techNames    && <span className="flex items-center gap-1"><User     className="h-3 w-3 shrink-0" />Assigned: {techNames}</span>}
        </div>
      </div>

      {/* Actions */}
      {canManageData && (
        <div className="shrink-0 flex items-center gap-2">
          <button
            onClick={() => setShowEdit(true)}
            className="text-xs text-blue-500 hover:text-blue-700 font-semibold transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="text-xs text-red-400 hover:text-red-600 font-semibold transition-colors"
          >
            Delete
          </button>
          <button
            onClick={handleMarkDone}
            disabled={marking}
            className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {marking ? '…' : 'Mark Done'}
          </button>
        </div>
      )}

      {canManageData && showEdit && (
        <EditJobModal isOpen job={job} onClose={() => setShowEdit(false)} />
      )}
      {canManageData && showDelete && (
        <DeleteConfirmModal
          isOpen
          title="Delete Job Order"
          message={`Delete "${job.title}"? This cannot be undone.`}
          onConfirm={() => { deleteJobOrder(job.id); setShowDelete(false); }}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  );
}

export default function DispatchQueue({ onCreateJob }) {
  const { jobOrders, canManageData } = useApp();
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayCount = jobOrders.filter(j => j.date === today).length;

  return (
    <div className="bg-brand-card rounded-xl border border-white/10 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
        <span className="text-[11px] font-bold uppercase tracking-widest text-white/40">
          Active Dispatch Queue
        </span>
        {todayCount > 0 && (
          <span className="bg-brand-primary/20 text-brand-primary text-[10px] font-bold px-2.5 py-0.5 rounded-full">
            {todayCount} Active Today
          </span>
        )}
      </div>

      {jobOrders.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-white/40 text-sm mb-3">No active job orders.</p>
          {canManageData && (
            <button
              onClick={onCreateJob}
              className="inline-flex items-center gap-1.5 bg-brand-primary hover:bg-brand-primary/90 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Job Order
            </button>
          )}
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          {jobOrders.map(job => <JobRow key={job.id} job={job} />)}
        </div>
      )}
    </div>
  );
}
