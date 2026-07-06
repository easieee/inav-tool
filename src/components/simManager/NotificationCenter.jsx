import { useState, useEffect } from 'react';
import { getSimExpiryAlerts } from '../../lib/simDateUtils.js';
import { Bell, AlertTriangle, X, ChevronRight } from 'lucide-react';

export default function NotificationCenter({ sims, onSelectSim }) {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const list = [];
    sims.forEach(sim => {
      const simAlerts = getSimExpiryAlerts(sim);
      simAlerts.forEach(alert => {
        list.push({ sim, alert });
      });
    });
    // Sort alerts by days left (expiring sooner first)
    list.sort((a, b) => a.alert.daysLeft - b.alert.daysLeft);
    setAlerts(list);
  }, [sims]);

  const criticalCount = alerts.length;

  return (
    <div className="relative">
      {/* Alert Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-all cursor-pointer ${
          criticalCount > 0
            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
            : 'bg-[#1e293b] text-slate-400 hover:bg-slate-700 hover:text-white border border-[#334155]'
        }`}
        title="View Expiry Alerts"
        id="btn-alert-bell"
      >
        <Bell className={`w-5 h-5 ${criticalCount > 0 ? 'animate-bounce' : ''}`} />
        {criticalCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-mono font-bold text-white shadow-sm ring-2 ring-[#0f172a]">
            {criticalCount}
          </span>
        )}
      </button>

      {/* Floating Panel */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="absolute right-0 mt-2 w-96 bg-[#1e293b] border border-[#334155] rounded-xl shadow-2xl z-50 overflow-hidden animate-slideDown animate-fadeIn"
            id="notification-panel"
          >
            <div className="px-4 py-3 border-b border-[#334155] bg-[#0f172a]/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                <span className="font-sans font-medium text-sm text-white">Expiry Warning Center</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-[#334155]/40 bg-[#1e293b]">
              {alerts.length > 0 ? (
                alerts.map(({ sim, alert }, index) => {
                  const isCritical = alert.daysLeft <= 1;
                  return (
                    <div
                      key={`${sim.iccid}-${alert.type}-${index}`}
                      className="p-4 hover:bg-slate-800/60 transition-all flex items-start gap-3 cursor-pointer group"
                      onClick={() => {
                        onSelectSim(sim.iccid);
                        setIsOpen(false);
                      }}
                      id={`alert-item-${sim.iccid}-${alert.type}`}
                    >
                      <div
                        className={`p-1.5 rounded-lg shrink-0 ${
                          isCritical ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {sim.plate || 'NO PLATE'} • {sim.company}
                          </span>
                          <span
                            className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isCritical ? 'bg-red-950/40 text-red-400 border border-red-500/20' : 'bg-amber-950/40 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {alert.daysLeft === 0 ? 'EXPIRED' : `${alert.daysLeft}d left`}
                          </span>
                        </div>
                        <p className="text-xs text-white font-sans mt-1 font-medium">
                          {alert.label}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          SIM: {sim.sim} • ICCID: ...{sim.iccid.slice(-6)}
                        </p>
                        <div className="mt-2 flex items-center text-[10px] text-blue-400 font-sans group-hover:text-blue-300 transition-colors">
                          Locate SIM card
                          <ChevronRight className="w-3 h-3 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <p className="text-sm">All SIM cards are fully active!</p>
                  <p className="text-xs text-slate-500 font-mono mt-1">No expiries within the 3-day window.</p>
                </div>
              )}
            </div>

            <div className="px-4 py-2.5 bg-[#0f172a]/60 border-t border-[#334155] text-center">
              <span className="text-[10px] font-mono text-slate-500 uppercase">
                Active alerts are updated dynamically
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
