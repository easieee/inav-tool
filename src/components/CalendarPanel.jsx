import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useApp } from '../context/AppContext.jsx';
import { Calendar } from 'lucide-react';
import { formatTime } from '../lib/utils.js';

/* ─── Constants ──────────────────────────────────────────────────────────── */
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_W          = 80;   // px per hour
const ROW_H           = 56;   // px per job row
const MIN_VISIBLE_ROWS = 6;   // always show at least 6 rows; more = scrollable

function fmtHour(h) {
  if (h === 0)  return '12 AM';
  if (h === 12) return '12 PM';
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

function timeToX(t = '00:00') {
  const [h, m] = t.split(':').map(Number);
  return (h + m / 60) * HOUR_W;
}

function durW(start = '00:00', end = '01:00') {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return Math.max((eh + em / 60) - (sh + sm / 60), 0.3) * HOUR_W;
}

/* ─── Job colour scheme ──────────────────────────────────────────────────── */
const TYPE_STYLE = {
  onsite:    { bar: 'bg-blue-500 hover:bg-blue-600',     label: 'text-white' },
  backjob:   { bar: 'bg-orange-400 hover:bg-orange-500', label: 'text-white' },
  completed: { bar: 'bg-emerald-500 hover:bg-emerald-600', label: 'text-white' },
};

/* ─── Tooltip row helper ─────────────────────────────────────────────────── */
function Row({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="text-slate-400 shrink-0 w-20 font-medium">{label}:</span>
      <span className="text-slate-700 leading-snug">{value}</span>
    </div>
  );
}

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function CalendarPanel({ date }) {
  const { technicians, jobOrders, jobHistory } = useApp();
  const [tooltip, setTooltip] = useState(null);

  const dateStr = format(date, 'yyyy-MM-dd');

  // All unique jobs for the selected day — one entry per job regardless of how many technicians
  const dayJobs = useMemo(() => {
    const active = jobOrders
      .filter(j => j.date === dateStr)
      .map(j => ({ ...j, _type: j.isBackJob === 'true' ? 'backjob' : 'onsite' }));

    const history = jobHistory
      .filter(j => j.date === dateStr)
      .map(j => ({ ...j, _type: 'completed' }));

    return [...active, ...history].sort((a, b) => {
      const [ah, am] = (a.startTime || '00:00').split(':').map(Number);
      const [bh, bm] = (b.startTime || '00:00').split(':').map(Number);
      return (ah * 60 + am) - (bh * 60 + bm);
    });
  }, [jobOrders, jobHistory, dateStr]);

  const getTechNames = (job) =>
    (job.technicianIds || [])
      .map(id => technicians.find(t => t.id === id)?.name)
      .filter(Boolean)
      .join(', ') || '—';

  const totalW = HOURS.length * HOUR_W;

  const handleEnter = (e, job) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.min(r.left, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 340);
    const y = r.bottom + 10;
    setTooltip({ job, techNames: getTechNames(job), x, y });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

      {/* ── Panel header ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-500" />
          <span className="font-semibold text-slate-700 text-sm">Technician Calendar Schedule</span>
          <span className="text-slate-400 text-sm">— {dateStr}</span>
        </div>
        <div className="flex items-center gap-5 text-[11px] font-semibold text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block" /> ONSITE
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-400 inline-block" /> BACK-JOB
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" /> COMPLETED
          </span>
        </div>
      </div>

      {/* ── Calendar body ── */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: totalW }}>

          {/* Time ruler — always visible, never vertically scrolled */}
          <div className="flex border-b border-slate-100 bg-slate-50/70">
            <div className="flex" style={{ width: totalW }}>
              {HOURS.map(h => (
                <div
                  key={h}
                  style={{ width: HOUR_W, minWidth: HOUR_W }}
                  className="border-r border-slate-100 text-center py-2 shrink-0"
                >
                  <span className="text-[10px] text-slate-400 font-medium">{fmtHour(h)}</span>
                </div>
              ))}
            </div>
          </div>

          {/*
           * Job rows:
           * – Always occupies exactly MIN_VISIBLE_ROWS × ROW_H height
           * – If more than MIN_VISIBLE_ROWS jobs exist, a scrollbar appears
           * – If fewer, empty ghost rows fill the remaining space
           * This keeps the panels below the calendar perfectly stable.
           */}
          <div
            style={{
              height: ROW_H * MIN_VISIBLE_ROWS,
              overflowY: 'auto',
              overflowX: 'visible',
            }}
          >
            {dayJobs.length === 0 ? (
              // Empty state fills the full fixed height
              <div
                className="flex items-center justify-center text-slate-400 text-sm"
                style={{ height: ROW_H * MIN_VISIBLE_ROWS }}
              >
                No jobs scheduled for this day.
              </div>
            ) : (
              <>
                {dayJobs.map(job => {
                  const s = TYPE_STYLE[job._type];
                  return (
                    <div
                      key={job.id + job._type}
                      className="flex border-b border-slate-50 last:border-0 hover:bg-blue-50/20 transition-colors"
                      style={{ height: ROW_H }}
                    >
                      {/* Timeline track */}
                      <div className="relative flex" style={{ width: totalW, height: ROW_H }}>
                        {/* Grid lines */}
                        {HOURS.map(h => (
                          <div
                            key={h}
                            style={{ width: HOUR_W, minWidth: HOUR_W }}
                            className="h-full border-r border-slate-50 shrink-0"
                          />
                        ))}

                        {/* Single job bar */}
                        <div
                          className={`absolute rounded-lg cursor-pointer flex flex-col justify-center px-3 overflow-hidden shadow-sm transition-colors ${s.bar}`}
                          style={{
                            left:   timeToX(job.startTime),
                            width:  Math.max(durW(job.startTime, job.endTime), 56),
                            top:    7,
                            bottom: 7,
                          }}
                          onMouseEnter={e => handleEnter(e, job)}
                          onMouseLeave={() => setTooltip(null)}
                        >
                          <span className={`text-xs font-semibold truncate leading-none ${s.label}`}>
                            {job.title}
                          </span>
                          <span className={`text-[11px] opacity-80 truncate leading-none mt-0.5 ${s.label}`}>
                            {job.startTime} – {job.endTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Ghost rows to fill minimum height when fewer than MIN_VISIBLE_ROWS jobs */}
                {dayJobs.length < MIN_VISIBLE_ROWS &&
                  Array.from({ length: MIN_VISIBLE_ROWS - dayJobs.length }, (_, i) => (
                    <div
                      key={`ghost-${i}`}
                      className="border-b border-slate-50"
                      style={{ height: ROW_H, width: totalW }}
                    />
                  ))
                }
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Tooltip ── */}
      {tooltip && (
        <div
          className="fixed z-50 bg-white border border-slate-200 rounded-xl shadow-xl w-80 pointer-events-none overflow-hidden"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {/* Coloured header strip */}
          <div className={`px-4 py-3 ${
            tooltip.job._type === 'backjob'   ? 'bg-orange-500' :
            tooltip.job._type === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'
          }`}>
            <p className="text-white font-bold text-sm leading-tight">{tooltip.job.title}</p>
            <p className="text-white/80 text-xs mt-0.5">
              {formatTime(tooltip.job.startTime)} – {formatTime(tooltip.job.endTime)}
            </p>
          </div>

          {/* Details */}
          <div className="px-4 py-3 space-y-2 text-xs">
            <Row label="Client"        value={tooltip.job.client   || '—'} />
            <Row label="Location"      value={tooltip.job.location || '—'} />
            <Row label="Device"        value={tooltip.job.device   || '—'} />
            <Row label="Technician/s"  value={tooltip.techNames} />
            {tooltip.job.description && (
              <Row label="Notes" value={tooltip.job.description} />
            )}
            <div className="pt-2 mt-1 border-t border-slate-100 text-slate-400">
              Created by{' '}
              <span className="font-semibold text-slate-600">{tooltip.job.createdBy || '—'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
