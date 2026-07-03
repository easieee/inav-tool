import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { format } from 'date-fns';

const DOT = {
  system:  'bg-white/30',
  tech:    'bg-blue-400',
  job:     'bg-emerald-400',
  backjob: 'bg-orange-400',
};

export default function AuditLog() {
  const { auditLogs } = useApp();

  return (
    <div className="bg-brand-card rounded-xl border border-white/10 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-white/10">
        <span className="text-[11px] font-bold uppercase tracking-widest text-white/40">
          System Audit Logs
        </span>
      </div>

      <div className="max-h-56 overflow-y-auto divide-y divide-white/5">
        {auditLogs.length === 0 ? (
          <p className="px-5 py-6 text-white/40 text-sm text-center">No events yet.</p>
        ) : (
          auditLogs.map(log => (
            <div key={log.id} className="flex gap-3 px-5 py-3 hover:bg-white/5 transition-colors">
              <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${DOT[log.type] || 'bg-white/20'}`} />
              <div className="min-w-0">
                <p className="text-white/80 text-xs font-semibold">{log.title}</p>
                <p className="text-white/40 text-[11px] mt-0.5 leading-relaxed">{log.description}</p>
                <p className="text-white/25 text-[10px] mt-1 flex items-center gap-1.5">
                  {format(new Date(log.timestamp), 'MMM d · hh:mm aa')}
                  {log.user && <><span className="opacity-50">·</span><span className="text-white/40 font-medium">{log.user}</span></>}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
