import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { X } from 'lucide-react';

const INPUT = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 text-sm';

function Label({ children }) {
  return <label className="block text-slate-600 text-sm font-medium mb-1.5">{children}</label>;
}

export default function EditJobModal({ isOpen, job, onClose }) {
  const { updateJobOrder, technicians } = useApp();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ ...job });

  useEffect(() => {
    if (job) setForm({ ...job });
  }, [job]);

  if (!isOpen || !job) return null;

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const toggleTech = id => setForm(f => ({
    ...f,
    technicianIds: Array.isArray(f.technicianIds)
      ? f.technicianIds.includes(id)
        ? f.technicianIds.filter(x => x !== id)
        : [...f.technicianIds, id]
      : [id]
  }));

  const techIds = Array.isArray(form.technicianIds) ? form.technicianIds : [];

  const handleSubmit = async e => {
    e.preventDefault();
    setBusy(true);
    await updateJobOrder(job.id, {
      title: form.title,
      client: form.client,
      location: form.location,
      device: form.device,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      technicianIds: techIds,
      description: form.description
    });
    setBusy(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl border border-slate-200 shadow-2xl max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <h2 className="text-slate-800 font-semibold text-lg">Edit Job Order</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Job Title</Label>
              <input type="text" value={form.title || ''} onChange={set('title')} required className={INPUT} />
            </div>
            <div>
              <Label>Client</Label>
              <input type="text" value={form.client || ''} onChange={set('client')} className={INPUT} />
            </div>
            <div>
              <Label>Device to Install</Label>
              <input type="text" value={form.device || ''} onChange={set('device')} className={INPUT} />
            </div>
            <div className="col-span-2">
              <Label>Location</Label>
              <input type="text" value={form.location || ''} onChange={set('location')} className={INPUT} />
            </div>
            <div>
              <Label>Date</Label>
              <input type="date" value={form.date || ''} onChange={set('date')} className={INPUT} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Start Time</Label>
                <input type="time" value={form.startTime || ''} onChange={set('startTime')} className={INPUT} />
              </div>
              <div>
                <Label>End Time</Label>
                <input type="time" value={form.endTime || ''} onChange={set('endTime')} className={INPUT} />
              </div>
            </div>
          </div>

          {/* Technician picker */}
          <div>
            <Label>Assign Technician(s)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {technicians.map(t => (
                <label
                  key={t.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-colors text-sm ${
                    techIds.includes(t.id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={techIds.includes(t.id)}
                    onChange={() => toggleTech(t.id)}
                    className="accent-blue-500"
                  />
                  <span className="truncate">{t.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label>Description / Notes</Label>
            <textarea
              value={form.description || ''}
              onChange={set('description')}
              rows={3}
              className={INPUT + ' resize-none'}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              {busy ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
