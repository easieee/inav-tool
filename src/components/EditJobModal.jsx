import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { X } from 'lucide-react';

const INPUT = 'w-full bg-brand-dark border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/25 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 text-sm';

function Label({ children }) {
  return <label className="block text-white/50 text-sm font-medium mb-1.5">{children}</label>;
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-brand-card rounded-2xl w-full max-w-2xl border border-white/10 shadow-2xl max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
          <h2 className="text-white font-semibold text-lg">Edit Job Order</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
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
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                      : 'border-white/10 bg-brand-dark text-white/60 hover:border-white/20'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={techIds.includes(t.id)}
                    onChange={() => toggleTech(t.id)}
                    className="accent-brand-primary"
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
              className="flex-1 bg-white/5 hover:bg-white/10 text-white/50 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              {busy ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
