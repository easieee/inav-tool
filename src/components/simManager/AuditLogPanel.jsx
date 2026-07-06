import { format } from 'date-fns';
import { History } from 'lucide-react';

const DOT = {
  register: 'bg-blue-400',
  load:     'bg-purple-400',
  promo:    'bg-emerald-400',
};

export default function AuditLogPanel({ auditLogs }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-sans font-medium text-white tracking-tight flex items-center gap-2">
        <History className="w-5 h-5 text-blue-500" />
        Activity Log
      </h2>

      <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden animate-fadeIn">
        <div className="max-h-[560px] overflow-y-auto divide-y divide-[#334155]/40">
          {auditLogs.length === 0 ? (
            <p className="px-5 py-10 text-slate-500 text-sm text-center font-sans">No activity recorded yet.</p>
          ) : (
            auditLogs.map(log => (
              <div key={log.id} className="flex gap-3 px-5 py-4 hover:bg-slate-800/40 transition-colors">
                <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${DOT[log.type] || 'bg-slate-500'}`} />
                <div className="min-w-0">
                  <p className="text-white text-xs font-sans font-semibold">{log.title}</p>
                  <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed font-sans">{log.description}</p>
                  <p className="text-slate-500 text-[10px] mt-1.5 flex items-center gap-1.5 font-mono">
                    {format(new Date(log.timestamp), 'MMM d, yyyy · hh:mm aa')}
                    {log.user && <><span className="opacity-50">•</span><span className="text-slate-400 font-medium">{log.user}</span></>}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
