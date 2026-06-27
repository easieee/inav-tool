import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { UserPlus, Star, CheckCircle, AlertCircle, X } from 'lucide-react';
import { formatDate } from '../lib/utils.js';
import AddTechnicianModal from './AddTechnicianModal.jsx';

/* ─── Tech Detail Pop-over ──────────────────────────────────────────────── */
function TechDetail({ tech, jobHistory, onClose }) {
  const done = jobHistory.filter(h =>
    Array.isArray(h.technicianIds) &&
    h.technicianIds.includes(tech.id) &&
    h.isBackJob !== 'true'
  ).length;
  const backDone = jobHistory.filter(h =>
    Array.isArray(h.technicianIds) &&
    h.technicianIds.includes(tech.id) &&
    h.isBackJob === 'true'
  ).length;

  return (
    <div className="absolute inset-0 z-10 bg-slate-900/95 rounded-xl p-4 flex flex-col">
      <button
        onClick={e => { e.stopPropagation(); onClose(); }}
        className="absolute top-3 right-3 text-slate-400 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg uppercase shrink-0">
          {tech.name?.[0]}
        </div>
        <div>
          <p className="text-white font-semibold">{tech.name}</p>
          <p className="text-slate-400 text-xs">{tech.email || 'No email'}</p>
        </div>
      </div>

      {tech.phone && <p className="text-slate-400 text-xs mb-3">📞 {tech.phone}</p>}

      <div className="grid grid-cols-3 gap-2 mt-auto">
        <div className="bg-slate-800 rounded-lg p-2 text-center">
          <Star className="h-4 w-4 text-amber-400 mx-auto mb-1" />
          <p className="text-white font-bold text-lg">{tech.points ?? 0}</p>
          <p className="text-slate-400 text-[10px]">Points</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-2 text-center">
          <CheckCircle className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
          <p className="text-white font-bold text-lg">{done}</p>
          <p className="text-slate-400 text-[10px]">Jobs Done</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-2 text-center">
          <AlertCircle className="h-4 w-4 text-amber-400 mx-auto mb-1" />
          <p className="text-white font-bold text-lg">{backDone}</p>
          <p className="text-slate-400 text-[10px]">Back-Jobs</p>
        </div>
      </div>

      <p className="text-slate-600 text-[10px] mt-2 text-center">
        Member since {formatDate(tech.createdAt)}
      </p>
    </div>
  );
}

/* ─── Tech Card ─────────────────────────────────────────────────────────── */
function TechCard({ tech }) {
  const { jobHistory } = useApp();
  const [open, setOpen] = useState(false);

  const done = jobHistory.filter(h =>
    Array.isArray(h.technicianIds) && h.technicianIds.includes(tech.id) && h.isBackJob !== 'true'
  ).length;

  return (
    <div
      className="relative bg-slate-800 border border-slate-700 rounded-xl p-4 cursor-pointer hover:border-blue-500/60 hover:bg-slate-750 transition-all overflow-hidden select-none"
      style={{ minHeight: 160 }}
      onClick={() => setOpen(o => !o)}
    >
      {/* Avatar */}
      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold text-xl uppercase mb-3">
        {tech.name?.[0]}
      </div>

      <p className="text-white font-semibold truncate">{tech.name}</p>
      <p className="text-slate-400 text-xs truncate mb-3">{tech.email || 'No email'}</p>

      <div className="flex gap-3 items-center">
        <span className="flex items-center gap-1 text-amber-400 text-sm font-bold">
          <Star className="h-3.5 w-3.5" /> {tech.points ?? 0}
        </span>
        <span className="flex items-center gap-1 text-emerald-400 text-xs">
          <CheckCircle className="h-3 w-3" /> {done} done
        </span>
      </div>

      <p className="text-slate-600 text-[10px] mt-2">Click for details</p>

      {open && (
        <TechDetail tech={tech} jobHistory={jobHistory} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}

/* ─── Panel ─────────────────────────────────────────────────────────────── */
export default function TechnicianPanel() {
  const { technicians } = useApp();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Technicians</h1>
          <p className="text-slate-400 text-sm mt-0.5">{technicians.length} registered</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-900/30"
        >
          <UserPlus className="h-4 w-4" />
          Add Technician
        </button>
      </div>

      {/* Grid */}
      {technicians.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 border-dashed rounded-xl p-12 text-center">
          <UserPlus className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No technicians yet</p>
          <p className="text-slate-500 text-sm mt-1">Click "Add Technician" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {technicians.map(tech => <TechCard key={tech.id} tech={tech} />)}
        </div>
      )}

      <AddTechnicianModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
