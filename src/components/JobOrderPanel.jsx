import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.jsx';
import {
  Plus, Edit2, Trash2, CheckCircle2, RotateCcw,
  ClipboardList, Clock, MapPin, Monitor, User, ChevronDown
} from 'lucide-react';
import { formatDate, formatTime } from '../lib/utils.js';
import CreateJobModal from './CreateJobModal.jsx';
import EditJobModal from './EditJobModal.jsx';
import DeleteConfirmModal from './DeleteConfirmModal.jsx';
import BackJobModal from './BackJobModal.jsx';

/* ─── Badge ─────────────────────────────────────────────────────────────── */
function Badge({ children, color = 'slate' }) {
  const colors = {
    blue: 'bg-blue-900/50 text-blue-300 border-blue-700/50',
    amber: 'bg-amber-900/50 text-amber-300 border-amber-700/50',
    emerald: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50',
    slate: 'bg-slate-700 text-slate-300 border-slate-600'
  };
  return (
    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colors[color]}`}>
      {children}
    </span>
  );
}

/* ─── Job Card ───────────────────────────────────────────────────────────── */
function JobCard({ job, isHistory = false }) {
  const { technicians, markJobDone, deleteJobOrder, createBackJob } = useApp();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showBackJob, setShowBackJob] = useState(false);

  const techNames = useMemo(() =>
    (job.technicianIds || []).map(id =>
      technicians.find(t => t.id === id)?.name || id
    ), [job.technicianIds, technicians]);

  const isBackJob = job.isBackJob === 'true';

  return (
    <div className={`bg-slate-800 border rounded-xl p-4 transition-colors hover:border-slate-600 ${
      isBackJob ? 'border-amber-700/40' : 'border-slate-700'
    }`}>
      {/* Title + badges */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-white font-semibold text-sm truncate">{job.title}</h3>
            {isBackJob && <Badge color="amber">Back-Job</Badge>}
            {isHistory && <Badge color="emerald">Completed</Badge>}
          </div>
          <p className="text-slate-500 text-[11px]">
            Created by {job.createdBy}
          </p>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mb-3">
        <Detail icon={Clock} label={`${formatDate(job.date)} · ${formatTime(job.startTime)} – ${formatTime(job.endTime)}`} />
        <Detail icon={User} label={techNames.length ? techNames.join(', ') : '—'} />
        <Detail icon={MapPin} label={job.location || '—'} />
        <Detail icon={Monitor} label={job.device || '—'} />
        {job.client && (
          <Detail icon={ClipboardList} label={`Client: ${job.client}`} />
        )}
        {isHistory && job.completedAt && (
          <Detail icon={CheckCircle2} label={`Done: ${formatDate(job.completedAt)}`} />
        )}
      </div>

      {job.description && (
        <p className="text-slate-400 text-xs bg-slate-700/40 rounded-lg px-3 py-2 mb-3 leading-relaxed">
          {job.description}
        </p>
      )}

      {/* Action buttons */}
      {!isHistory && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => markJobDone(job.id)}
            className="flex items-center gap-1.5 bg-emerald-700/30 hover:bg-emerald-700/50 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Mark Done
          </button>
          <button
            onClick={() => setShowEdit(true)}
            className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="flex items-center gap-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      )}

      {isHistory && (
        <button
          onClick={() => setShowBackJob(true)}
          className="flex items-center gap-1.5 bg-amber-700/30 hover:bg-amber-700/50 text-amber-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Create Back-Job
        </button>
      )}

      {showEdit && <EditJobModal isOpen job={job} onClose={() => setShowEdit(false)} />}
      {showDelete && (
        <DeleteConfirmModal
          isOpen
          title="Delete Job Order"
          message={`Delete "${job.title}"? This cannot be undone.`}
          onConfirm={() => { deleteJobOrder(job.id); setShowDelete(false); }}
          onCancel={() => setShowDelete(false)}
        />
      )}
      {showBackJob && (
        <BackJobModal
          isOpen
          historyJob={job}
          onClose={() => setShowBackJob(false)}
        />
      )}
    </div>
  );
}

function Detail({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-1.5 text-slate-400 min-w-0">
      <Icon className="h-3 w-3 shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  );
}

/* ─── Section ────────────────────────────────────────────────────────────── */
function Section({ title, count, badge, badgeColor, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-3 px-1 group"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-white font-semibold text-base">{title}</h2>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            badgeColor === 'blue' ? 'bg-blue-600 text-white' :
            badgeColor === 'amber' ? 'bg-amber-600 text-white' :
            'bg-slate-600 text-slate-200'
          }`}>{count}</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pb-6">
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── Panel ─────────────────────────────────────────────────────────────── */
export default function JobOrderPanel() {
  const { jobOrders, jobHistory } = useApp();
  const [showCreate, setShowCreate] = useState(false);

  const activeJobs = useMemo(() =>
    jobOrders.filter(j => j.isBackJob !== 'true'),
  [jobOrders]);

  const backJobs = useMemo(() =>
    jobOrders.filter(j => j.isBackJob === 'true'),
  [jobOrders]);

  const historyItems = useMemo(() =>
    [...jobHistory].sort((a, b) =>
      new Date(b.completedAt || 0) - new Date(a.completedAt || 0)
    ),
  [jobHistory]);

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Job Orders</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {activeJobs.length} active · {backJobs.length} back-jobs · {historyItems.length} history
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-900/30"
        >
          <Plus className="h-4 w-4" />
          New Job
        </button>
      </div>

      {/* Active Jobs */}
      <Section title="Active Jobs" count={activeJobs.length} badgeColor="blue" defaultOpen>
        {activeJobs.length === 0 ? (
          <div className="col-span-full bg-slate-800 border border-dashed border-slate-700 rounded-xl p-8 text-center">
            <p className="text-slate-400">No active jobs. Create one!</p>
          </div>
        ) : (
          activeJobs.map(j => <JobCard key={j.id} job={j} />)
        )}
      </Section>

      {/* Back-Jobs */}
      <Section title="Back-Jobs" count={backJobs.length} badgeColor="amber" defaultOpen={backJobs.length > 0}>
        {backJobs.length === 0 ? (
          <div className="col-span-full bg-slate-800 border border-dashed border-slate-700 rounded-xl p-6 text-center">
            <p className="text-slate-500 text-sm">No back-jobs at the moment.</p>
          </div>
        ) : (
          backJobs.map(j => <JobCard key={j.id} job={j} />)
        )}
      </Section>

      {/* Job History */}
      <Section title="Job History" count={historyItems.length} defaultOpen={false}>
        {historyItems.length === 0 ? (
          <div className="col-span-full bg-slate-800 border border-dashed border-slate-700 rounded-xl p-6 text-center">
            <p className="text-slate-500 text-sm">No completed jobs yet.</p>
          </div>
        ) : (
          historyItems.map(j => <JobCard key={j.id} job={j} isHistory />)
        )}
      </Section>

      <CreateJobModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
