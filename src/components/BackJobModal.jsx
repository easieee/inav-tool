import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { X, RotateCcw } from 'lucide-react';
import { todayStr } from '../lib/utils.js';
import DatePickerField from './DatePickerField.jsx';
import TimePickerField from './TimePickerField.jsx';

const INPUT = 'w-full bg-brand-dark border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/25 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 text-sm';

export default function BackJobModal({ isOpen, historyJob, onClose }) {
  const { createBackJob, technicians } = useApp();
  const [busy, setBusy] = useState(false);
  const [selectedTechs, setSelectedTechs] = useState([]);
  const [date, setDate] = useState(todayStr());
  const [startTime, setStartTime] = useState(historyJob?.startTime || '09:00');
  const [endTime, setEndTime] = useState(historyJob?.endTime || '11:00');

  if (!isOpen || !historyJob) return null;

  const toggleTech = id => setSelectedTechs(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );

  const handleSubmit = async e => {
    e.preventDefault();
    if (selectedTechs.length === 0) return;
    setBusy(true);
    await createBackJob(historyJob.id, selectedTechs, { date, startTime, endTime });
    setBusy(false);
    onClose();
  };

  const origTechNames = (Array.isArray(historyJob.technicianIds) ? historyJob.technicianIds : [])
    .map(id => technicians.find(t => t.id === id)?.name || id)
    .join(', ');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-brand-card rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl">

        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-amber-400" />
            <h2 className="text-white font-semibold text-lg">Create Back-Job</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Original job info */}
          <div className="bg-amber-950/30 border border-amber-700/40 rounded-xl p-3 text-sm">
            <p className="text-amber-300 font-semibold mb-1">{historyJob.title}</p>
            <p className="text-amber-200/60 text-xs">
              Original technicians: <span className="font-medium text-amber-200/80">{origTechNames || '—'}</span>
            </p>
            <p className="text-amber-200/50 text-xs mt-0.5">
              Each original technician will receive <strong className="text-red-400">-5 pts</strong> for this back-job.
            </p>
          </div>

          {/* Date & time */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">Date</label>
              <DatePickerField value={date} onChange={setDate} />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">Start</label>
              <TimePickerField value={startTime} onChange={setStartTime} />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">End</label>
              <TimePickerField value={endTime} onChange={setEndTime} />
            </div>
          </div>

          {/* Assign technicians */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">
              Assign Technician(s) <span className="text-brand-primary">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {technicians.map(t => (
                <label
                  key={t.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-colors text-sm ${
                    selectedTechs.includes(t.id)
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                      : 'border-white/10 bg-brand-dark text-white/60 hover:border-white/20'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTechs.includes(t.id)}
                    onChange={() => toggleTech(t.id)}
                    className="accent-brand-primary"
                  />
                  <span className="truncate">{t.name}</span>
                  <span className="ml-auto text-xs text-emerald-400 font-medium shrink-0">+3 pts</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white/50 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || selectedTechs.length === 0}
              className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              {busy ? 'Creating…' : 'Create Back-Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
