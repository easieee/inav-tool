import React, { useState, useMemo, useRef } from 'react';
import { format, addDays } from 'date-fns';
import { useApp } from '../context/AppContext.jsx';
import { formatTime, clamp, timeToMinutes, durationMinutes } from '../lib/utils.js';

const DAY_START = 7;   // 7 AM
const DAY_END = 20;    // 8 PM
const TOTAL_MINS = (DAY_END - DAY_START) * 60;

const TECH_COLORS = [
  { bar: 'bg-blue-500',   dot: 'bg-blue-400',   text: 'text-blue-300' },
  { bar: 'bg-emerald-500', dot: 'bg-emerald-400', text: 'text-emerald-300' },
  { bar: 'bg-violet-500', dot: 'bg-violet-400',  text: 'text-violet-300' },
  { bar: 'bg-amber-500',  dot: 'bg-amber-400',   text: 'text-amber-300' },
  { bar: 'bg-rose-500',   dot: 'bg-rose-400',    text: 'text-rose-300' },
  { bar: 'bg-cyan-500',   dot: 'bg-cyan-400',    text: 'text-cyan-300' },
  { bar: 'bg-pink-500',   dot: 'bg-pink-400',    text: 'text-pink-300' },
  { bar: 'bg-lime-500',   dot: 'bg-lime-400',    text: 'text-lime-300' },
];

function pct(timeStr) {
  const mins = clamp(timeToMinutes(timeStr, DAY_START), 0, TOTAL_MINS);
  return (mins / TOTAL_MINS) * 100;
}

function widthPct(startTime, endTime) {
  const dur = clamp(durationMinutes(startTime, endTime), 0, TOTAL_MINS);
  return (dur / TOTAL_MINS) * 100;
}

const TIME_LABELS = Array.from(
  { length: DAY_END - DAY_START + 1 },
  (_, i) => DAY_START + i
);

export default function CalendarSchedule() {
  const { technicians, jobOrders } = useApp();
  const [tooltip, setTooltip] = useState(null);
  const containerRef = useRef(null);

  const days = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(new Date(), i)),
  []);

  const getJobs = (techId, date) => {
    const ds = format(date, 'yyyy-MM-dd');
    return jobOrders.filter(j =>
      j.date === ds &&
      Array.isArray(j.technicianIds) &&
      j.technicianIds.includes(techId)
    );
  };

  const handleEnter = (e, job, techName, colorIdx) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    setTooltip({
      job,
      techName,
      colorIdx,
      x: rect.left - containerRect.left,
      y: rect.bottom - containerRect.top + 8
    });
  };

  if (technicians.length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-10 text-center">
        <p className="text-slate-400">No technicians yet. Add technicians to see the schedule.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: `${160 + days.length * 220}px` }}>

          {/* ── Header ── */}
          <thead>
            <tr className="border-b border-slate-700">
              <th className="sticky left-0 z-10 bg-slate-800 border-r border-slate-700 px-4 py-3 w-40 text-left">
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Technician</span>
              </th>
              {days.map(day => (
                <th key={day.toISOString()} className="border-r border-slate-700 px-3 pt-3 pb-1 min-w-[220px]">
                  {/* Date label */}
                  <div className={`text-sm font-semibold mb-1 ${
                    format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                      ? 'text-blue-400'
                      : 'text-white'
                  }`}>
                    {format(day, 'EEE, MMM d')}
                    {format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && (
                      <span className="ml-2 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full">Today</span>
                    )}
                  </div>
                  {/* Time ruler */}
                  <div className="relative h-4 flex items-end pb-1">
                    {TIME_LABELS.map((h, i) => (
                      <span
                        key={h}
                        className="absolute text-slate-500 text-[9px] leading-none"
                        style={{ left: `${(i / (TIME_LABELS.length - 1)) * 100}%`, transform: 'translateX(-50%)' }}
                      >
                        {h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`}
                      </span>
                    ))}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* ── Rows ── */}
          <tbody>
            {technicians.map((tech, idx) => {
              const color = TECH_COLORS[idx % TECH_COLORS.length];
              return (
                <tr key={tech.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                  {/* Tech name */}
                  <td className="sticky left-0 z-10 bg-slate-800 border-r border-slate-700 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${color.dot}`} />
                      <span className="text-white text-sm font-medium truncate max-w-[100px]">{tech.name}</span>
                    </div>
                  </td>

                  {/* Day cells */}
                  {days.map(day => {
                    const jobs = getJobs(tech.id, day);
                    return (
                      <td key={day.toISOString()} className="border-r border-slate-700 px-2 py-2.5">
                        {/* Timeline track */}
                        <div className="relative h-8 bg-slate-700/40 rounded-md overflow-visible">
                          {jobs.map(job => {
                            const left = pct(job.startTime || '07:00');
                            const w = Math.max(widthPct(job.startTime || '07:00', job.endTime || '08:00'), 4);
                            return (
                              <div
                                key={job.id}
                                className={`absolute top-0.5 bottom-0.5 ${color.bar} rounded cursor-pointer opacity-90 hover:opacity-100 hover:z-10 flex items-center justify-center overflow-hidden transition-opacity shadow-md`}
                                style={{ left: `${left}%`, width: `${w}%` }}
                                onMouseEnter={e => handleEnter(e, job, tech.name, idx)}
                                onMouseLeave={() => setTooltip(null)}
                              >
                                <span className="text-white text-[10px] font-semibold px-1 truncate select-none">
                                  {formatTime(job.startTime)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Tooltip ── */}
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="bg-slate-900 border border-slate-600 rounded-xl p-4 shadow-2xl w-72">
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="text-white font-semibold text-sm leading-tight">{tooltip.job.title}</h3>
              {(tooltip.job.isBackJob === 'true') && (
                <span className="shrink-0 text-[10px] bg-amber-700 text-amber-100 px-2 py-0.5 rounded-full">Back-Job</span>
              )}
            </div>
            <div className="space-y-1.5 text-xs">
              <Row label="Technician" value={tooltip.techName} />
              <Row label="Device" value={tooltip.job.device || '—'} />
              <Row label="Time" value={`${formatTime(tooltip.job.startTime)} – ${formatTime(tooltip.job.endTime)}`} />
              <Row label="Client" value={tooltip.job.client || '—'} />
              <Row label="Location" value={tooltip.job.location || '—'} />
              {tooltip.job.description && (
                <div>
                  <span className="text-slate-400">Notes: </span>
                  <span className="text-slate-300">{tooltip.job.description}</span>
                </div>
              )}
              <div className="pt-1.5 border-t border-slate-700 text-slate-500 text-[10px]">
                Created by {tooltip.job.createdBy}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="text-slate-400 shrink-0">{label}:</span>
      <span className="text-slate-200">{value}</span>
    </div>
  );
}
