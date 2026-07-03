import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function DeleteConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-brand-card rounded-2xl w-full max-w-sm border border-white/10 shadow-2xl">

        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-brand-primary" />
            <h2 className="text-white font-semibold">{title || 'Confirm Delete'}</h2>
          </div>
          <button onClick={onCancel} className="text-white/40 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-white/50 text-sm mb-5">{message || 'Are you sure you want to delete this?'}</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white/50 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              No, Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-brand-primary hover:bg-brand-primary/90 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
