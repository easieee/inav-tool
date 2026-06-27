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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md border border-slate-200 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-slate-800 font-semibold text-lg">Add Technician</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              required
              placeholder="e.g. Juan dela Cruz"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 text-sm"
            />
          </div>
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="juan@example.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 text-sm"
            />
          </div>
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={set('phone')}
              placeholder="+63 912 345 6789"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 text-sm"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !form.name.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              {busy ? 'Adding…' : 'Add Technician'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
