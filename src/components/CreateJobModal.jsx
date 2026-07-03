import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { X } from 'lucide-react';
import { todayStr } from '../lib/utils.js';
import DatePickerField from './DatePickerField.jsx';
import TimePickerField from './TimePickerField.jsx';

const INPUT = 'w-full bg-brand-dark border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/25 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 text-sm';

function Label({ children, required }) {
  return (
    <label className="block text-white/50 text-sm font-medium mb-1.5">
      {children} {required && <span className="text-brand-primary">*</span>}
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-brand-card rounded-2xl w-full max-w-2xl border border-white/10 shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
          <h2 className="text-white font-semibold text-lg">Create Job Order</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
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
              <DatePickerField value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Start Time</Label>
                <TimePickerField value={form.startTime} onChange={v => setForm(f => ({ ...f, startTime: v }))} />
              </div>
              <div>
                <Label>End Time</Label>
                <TimePickerField value={form.endTime} onChange={v => setForm(f => ({ ...f, endTime: v }))} />
              </div>
            </div>
          </div>

          {/* Technician picker */}
          <div>
            <Label required>Assign Technician(s)</Label>
            {technicians.length === 0 ? (
              <p className="text-white/40 text-sm">No technicians found. Add technicians first.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {technicians.map(t => (
                  <label
                    key={t.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-colors text-sm ${
                      form.technicianIds.includes(t.id)
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                      : 'border-white/10 bg-brand-dark text-white/60 hover:border-white/20'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.technicianIds.includes(t.id)}
                      onChange={() => toggleTech(t.id)}
                      className="accent-brand-primary"
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
              className="flex-1 bg-white/5 hover:bg-white/10 text-white/50 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !form.title || !form.client || form.technicianIds.length === 0}
              className="flex-1 bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              {busy ? 'Creating…' : 'Create Job Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
