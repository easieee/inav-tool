import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { X } from 'lucide-react';
import { todayStr } from '../lib/utils.js';

const INPUT = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 text-sm';

function Label({ children, required }) {
  return (
    <label className="block text-slate-600 text-sm font-medium mb-1.5">
      {children} {required && <span className="text-red-400">*</span>}
    </label>
  );
}

export default function CreateJobModal({ isOpen, onClose }) {
  const { addJobOrder, technicians } = useApp();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: '',
    client: '',
    location: '',
    device: '',
    date: todayStr(),
    startTime: '09:00',
    endTime: '11:00',
    technicianIds: [],
    description: ''
  });

  if (!isOpen) return null;

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const toggleTech = id => setForm(f => ({
    ...f,
    technicianIds: f.technicianIds.includes(id)
      ? f.technicianIds.filter(x => x !== id)
      : [...f.technicianIds, id]
  }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title || !form.client || !form.date || form.technicianIds.length === 0) return;
    setBusy(true);
    await addJobOrder(form);
    setBusy(false);
    setForm({
      title: '', client: '', location: '', device: '',
      date: todayStr(), startTime: '09:00', endTime: '11:00',
      technicianIds: [], description: ''
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl border border-slate-200 shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <h2 className="text-slate-800 font-semibold text-lg">Create Job Order</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label required>Job Title</Label>
              <input type="text" value={form.title} onChange={set('title')} required placeholder="e.g. CCTV Installation" className={INPUT} />
            </div>

            <div>
              <Label required>Client</Label>
              <input type="text" value={form.client} onChange={set('client')} required placeholder="Client name" className={INPUT} />
            </div>
            <div>
              <Label>Device to Install</Label>
              <input type="text" value={form.device} onChange={set('device')} placeholder="e.g. 4-Channel NVR" className={INPUT} />
            </div>

            <div className="col-span-2">
              <Label>Location</Label>
              <input type="text" value={form.location} onChange={set('location')} placeholder="Full address" className={INPUT} />
            </div>

            <div>
              <Label required>Date</Label>
              <input type="date" value={form.date} onChange={set('date')} required className={INPUT} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Start Time</Label>
                <input type="time" value={form.startTime} onChange={set('startTime')} className={INPUT} />
              </div>
              <div>
                <Label>End Time</Label>
                <input type="time" value={form.endTime} onChange={set('endTime')} className={INPUT} />
              </div>
            </div>
          </div>

          {/* Technician picker */}
          <div>
            <Label required>Assign Technician(s)</Label>
            {technicians.length === 0 ? (
              <p className="text-slate-500 text-sm">No technicians found. Add technicians first.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {technicians.map(t => (
                  <label
                    key={t.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-colors text-sm ${
                      form.technicianIds.includes(t.id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.technicianIds.includes(t.id)}
                      onChange={() => toggleTech(t.id)}
                      className="accent-blue-500"
                    />
                    <span className="truncate">{t.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Description / Notes (optional)</Label>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={3}
              placeholder="Any additional notes…"
              className={INPUT + ' resize-none'}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !form.title || !form.client || form.technicianIds.length === 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              {busy ? 'Creating…' : 'Create Job Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
