import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { UserPlus } from 'lucide-react';
import TechnicianDetailModal from './TechnicianDetailModal.jsx';
import { calculateTechPoints } from '../lib/utils.js';

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-cyan-500',
  'bg-violet-500', 'bg-pink-500', 'bg-orange-500', 'bg-rose-500',
];

export default function TechPerformancePanel({ onAddTech }) {
  const { technicians, jobHistory, canManageData } = useApp();
  const [selectedTech, setSelectedTech] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');

  const openModal = (tech, color) => {
    setSelectedTech(tech);
    setSelectedColor(color);
  };

  return (
    <>
    <div className="bg-brand-card rounded-xl border border-white/10 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
        <span className="text-[11px] font-bold uppercase tracking-widest text-white/40">
          Technician Performance
        </span>
        {canManageData && (
          <button
            onClick={onAddTech}
            className="flex items-center gap-1 text-blue-500 hover:text-blue-600 text-xs font-semibold transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" />
            + Add Tech
          </button>
        )}
      </div>

      {technicians.length === 0 ? (
        <p className="px-5 py-8 text-white/40 text-sm text-center">
          {canManageData
            ? 'No technicians yet. Click "+ Add Tech" to get started.'
            : 'No technicians available yet.'}
        </p>
      ) : (
        <div className="divide-y divide-white/5">
          {technicians.map((tech, idx) => {
            const initials = tech.name
              .split(' ')
              .map(w => w[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            const done = jobHistory.filter(
              h => (h.technicianIds || []).includes(tech.id) && h.isBackJob !== 'true'
            ).length;
            const backDone = jobHistory.filter(
              h => (h.technicianIds || []).includes(tech.id) && h.isBackJob === 'true'
            ).length;
            const hasHistory = done + backDone > 0;
            const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            const pts = calculateTechPoints(tech.id, jobHistory);

            return (
              <div
                key={tech.id}
                onClick={() => openModal(tech, color)}
                className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors cursor-pointer"
                title="Click to view details"
              >
                <div className={`h-9 w-9 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                  {initials}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm leading-none">{tech.name}</p>
                  <p className="text-white/40 text-xs mt-0.5">
                    Done: {done} | Back-Jobs: {backDone}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-blue-400 font-bold text-sm leading-none">
                    {pts} pts
                  </p>
                  {hasHistory && (
                    <p className="text-emerald-400 text-[10px] mt-0.5">+3 last job</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

    {selectedTech && (
      <TechnicianDetailModal
        tech={selectedTech}
        colorClass={selectedColor}
        onClose={() => setSelectedTech(null)}
      />
    )}
    </>
  );
}
