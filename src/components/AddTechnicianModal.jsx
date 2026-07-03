import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { X } from 'lucide-react';

export default function AddTechnicianModal({ isOpen, onClose }) {
  const { addTechnician } = useApp();
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setBusy(true);
    await addTechnician(form);
    setBusy(false);
    setForm({ name: '', email: '', phone: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-brand-card rounded-2xl w-full max-w-md border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-white font-semibold text-lg">Add Technician</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-white/50 text-sm font-medium mb-1.5">
              Full Name <span className="text-brand-primary">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              required
              placeholder="e.g. Juan dela Cruz"
              className="w-full bg-brand-dark border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/25 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 text-sm"
            />
          </div>
          <div>
            <label className="block text-white/50 text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="juan@example.com"
              className="w-full bg-brand-dark border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/25 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 text-sm"
            />
          </div>
          <div>
            <label className="block text-white/50 text-sm font-medium mb-1.5">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={set('phone')}
              placeholder="+63 912 345 6789"
              className="w-full bg-brand-dark border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/25 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 text-sm"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white/50 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !form.name.trim()}
              className="flex-1 bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              {busy ? 'Adding…' : 'Add Technician'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
