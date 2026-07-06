import { useState } from 'react';
import { calculateRegularBalanceDaysRemaining, calculatePromoDaysRemaining, calculatePlatformDaysRemaining, formatDate } from '../../lib/simDateUtils.js';
import { Search, Grid, Table, AlertTriangle, ShieldAlert, Zap, Edit2, Trash2, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

export default function SimList({ sims, onEditSim, onDeleteSim, onSelectForLoad }) {
  const [viewType, setViewType] = useState('table');
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortField, setSortField] = useState('daysRemaining');
  const [sortAsc, setSortAsc] = useState(true);

  // Get list of unique companies for filter
  const companies = ['All', ...Array.from(new Set(sims.map(s => s.company).filter(Boolean)))];

  // Helper to handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Helper to render remaining days badge with appropriate color
  const renderRemainingBadge = (days, type) => {
    let label = '';
    if (type === 'regular') label = `${days} days left (Balance)`;
    else if (type === 'promo') label = `${days} days left (Promo)`;
    else label = `${days} days left (Platform)`;

    if (days === 0) {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-red-950/40 text-red-500 border border-red-500/20">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          EXPIRED
        </span>
      );
    } else if (days <= 3) {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/40 text-amber-500 border border-amber-500/20 animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {label}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-950/30 text-emerald-400 border border-emerald-500/10">
          {label}
        </span>
      );
    }
  };

  // Filter & Sort logic
  const processedSims = sims
    .map(sim => {
      // Re-calculate live values
      const regularRemaining = calculateRegularBalanceDaysRemaining(sim.loadDate);
      const promoRemaining = sim.promoExp ? calculatePromoDaysRemaining(sim.promoExp) : 0;
      const platformRemaining = sim.expirationOfSubs ? calculatePlatformDaysRemaining(sim.expirationOfSubs) : 0;

      return {
        ...sim,
        daysRemaining: regularRemaining,
        daysRemainingPlatform: platformRemaining
      };
    })
    .filter(sim => {
      // 1. Search Query
      const q = search.toLowerCase();
      const matchesSearch =
        sim.sim.toLowerCase().includes(q) ||
        sim.plate.toLowerCase().includes(q) ||
        sim.imei.toLowerCase().includes(q) ||
        sim.model.toLowerCase().includes(q) ||
        sim.brand.toLowerCase().includes(q) ||
        sim.iccid.toLowerCase().includes(q) ||
        sim.company.toLowerCase().includes(q);

      // 2. Company Filter
      const matchesCompany = companyFilter === 'All' || sim.company === companyFilter;

      // 3. Status Filter
      let matchesStatus = true;
      if (statusFilter === 'Expiring') {
        matchesStatus = sim.daysRemaining <= 3 || (sim.promoExp && calculatePromoDaysRemaining(sim.promoExp) <= 3) || sim.daysRemainingPlatform <= 3;
      } else if (statusFilter === 'Active') {
        matchesStatus = sim.daysRemaining > 3 && (!sim.promoExp || calculatePromoDaysRemaining(sim.promoExp) > 3) && sim.daysRemainingPlatform > 3;
      } else if (statusFilter === 'Deactivated') {
        matchesStatus = sim.daysRemaining === 0 || sim.daysRemainingPlatform === 0;
      }

      return matchesSearch && matchesCompany && matchesStatus;
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

  return (
    <div className="space-y-4">
      {/* Search and Filters panel */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm animate-fadeIn">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Smart Search: Plate, SIM, ICCID, Company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-2 px-3 pl-9 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
            id="smart-search-input"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center justify-end">
          {/* Company dropdown */}
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="bg-[#0f172a] border border-[#334155] rounded-xl py-1.5 px-3 text-[11px] text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
              id="company-filter"
            >
              {companies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Status buttons */}
          <div className="flex bg-[#0f172a] rounded-lg border border-[#334155] p-0.5">
            {['All', 'Active', 'Expiring', 'Deactivated'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`py-1 px-2.5 rounded text-[10px] font-sans font-medium transition-all cursor-pointer ${
                  statusFilter === status
                    ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Layout Toggle buttons */}
          <div className="flex items-center border border-[#334155] bg-[#0f172a] rounded-lg p-0.5 ml-2">
            <button
              onClick={() => setViewType('table')}
              className={`p-1.5 rounded transition-all cursor-pointer ${viewType === 'table' ? 'bg-blue-500/10 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
              title="Spreadsheet Table View"
              id="btn-layout-table"
            >
              <Table className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewType('grid')}
              className={`p-1.5 rounded transition-all cursor-pointer ${viewType === 'grid' ? 'bg-blue-500/10 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
              title="Compact Bento Grid View"
              id="btn-layout-grid"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main SIM Cards Render */}
      {processedSims.length > 0 ? (
        viewType === 'table' ? (
          /* Professional Spreadsheet Table View */
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden shadow-lg animate-fadeIn">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#334155] bg-[#0f172a]/40 text-[10px] font-mono text-[#94a3b8] uppercase tracking-wider">
                    <th className="py-3 px-4 font-semibold">
                      <button onClick={() => handleSort('sim')} className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
                        SIM / ICCID <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4 font-semibold">
                      <button onClick={() => handleSort('plate')} className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
                        Plate / Company <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4 font-semibold">
                      <button onClick={() => handleSort('imei')} className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
                        Device / Model <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4 font-semibold text-right">
                      <button onClick={() => handleSort('regularBalance')} className="flex items-center gap-1 hover:text-white transition-colors ml-auto cursor-pointer">
                        Regular Balance <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4 font-semibold">
                      <button onClick={() => handleSort('daysRemaining')} className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
                        Countdown Status (90d) <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4 font-semibold">
                      Promo / Expiry
                    </th>
                    <th className="py-3 px-4 font-semibold">
                      Subscription / Platform
                    </th>
                    <th className="py-3 px-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]/40 text-xs text-slate-300">
                  {processedSims.map((sim) => {
                    const promoRemaining = sim.promoExp ? calculatePromoDaysRemaining(sim.promoExp) : 0;
                    return (
                      <tr key={sim.iccid} className="hover:bg-slate-800/60 transition-colors">
                        {/* SIM & ICCID */}
                        <td className="py-3 px-4">
                          <div className="font-sans text-sm text-white font-semibold">{sim.sim}</div>
                          <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                            ICCID: {sim.iccid}
                          </div>
                        </td>

                        {/* PLATE & COMPANY */}
                        <td className="py-3 px-4">
                          <div className="font-sans font-medium text-white">{sim.plate || 'N/A'}</div>
                          <div className="font-mono text-[10px] text-slate-400 mt-0.5">{sim.company}</div>
                        </td>

                        {/* DEVICE & MODEL */}
                        <td className="py-3 px-4">
                          <div className="font-sans text-slate-300">{sim.model || 'N/A'}</div>
                          <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                            IMEI: {sim.imei || 'N/A'} ({sim.brand || 'N/A'})
                          </div>
                        </td>

                        {/* BALANCE */}
                        <td className="py-3 px-4 text-right">
                          <div className="font-mono font-medium text-white">₱{sim.regularBalance.toFixed(2)}</div>
                          <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                            Loaded: {sim.loadDate ? formatDate(sim.loadDate) : 'Never'}
                          </div>
                        </td>

                        {/* REGULAR BALANCE COUNTDOWN (90d) */}
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {renderRemainingBadge(sim.daysRemaining, 'regular')}
                            <div className="text-[9px] text-slate-500 font-mono">
                              Deactivates 90 days after load
                            </div>
                          </div>
                        </td>

                        {/* PROMO */}
                        <td className="py-3 px-4">
                          {sim.promo ? (
                            <div className="space-y-1">
                              <div className="font-sans text-white font-medium">{sim.promo}</div>
                              {renderRemainingBadge(promoRemaining, 'promo')}
                            </div>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">No active promo</span>
                          )}
                        </td>

                        {/* PLATFORM SUBSCRIPTION */}
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="text-slate-300 font-mono text-[11px]">
                              Exp: {sim.expirationOfSubs ? formatDate(sim.expirationOfSubs) : 'N/A'}
                            </div>
                            {renderRemainingBadge(sim.daysRemainingPlatform, 'platform')}
                          </div>
                        </td>

                        {/* ACTIONS */}
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onSelectForLoad(sim.iccid)}
                              className="p-1.5 bg-blue-600/10 border border-blue-500/30 hover:bg-blue-600 hover:text-white rounded text-blue-400 transition-all cursor-pointer"
                              title="Request Load ⚡"
                              id={`btn-load-sim-${sim.iccid}`}
                            >
                              <Zap className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onEditSim(sim)}
                              className="p-1.5 bg-[#1e293b] hover:bg-slate-700 border border-[#334155] rounded text-slate-300 transition-all cursor-pointer"
                              title="Edit SIM Info"
                              id={`btn-edit-sim-${sim.iccid}`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteSim(sim.iccid)}
                              className="p-1.5 bg-[#1e293b] hover:bg-red-950/50 hover:text-red-400 hover:border-red-900/50 border border-[#334155] rounded text-slate-500 transition-all cursor-pointer"
                              title="Delete SIM"
                              id={`btn-delete-sim-${sim.iccid}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Compact Bento Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn">
            {processedSims.map((sim) => {
              const promoRemaining = sim.promoExp ? calculatePromoDaysRemaining(sim.promoExp) : 0;
              return (
                <div
                  key={sim.iccid}
                  className="bento-card relative overflow-hidden flex flex-col justify-between"
                  id={`sim-card-${sim.iccid}`}
                >
                  <div className="space-y-4">
                    {/* Upper row */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-[10px] text-blue-400 font-bold uppercase tracking-wider block">
                          {sim.company}
                        </span>
                        <h4 className="text-base font-sans font-semibold text-white mt-0.5">{sim.sim}</h4>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-xs text-white font-bold bg-[#0f172a] px-2 py-1 rounded-lg border border-[#334155]">
                          {sim.plate || 'No Plate'}
                        </span>
                      </div>
                    </div>

                    {/* Expiries Status Column */}
                    <div className="space-y-2 pt-2 border-t border-[#334155]/40">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Regular Bal.</span>
                        <div className="text-right">
                          <span className="font-mono text-xs text-white block">₱{sim.regularBalance.toFixed(2)}</span>
                          {renderRemainingBadge(sim.daysRemaining, 'regular')}
                        </div>
                      </div>

                      {sim.promo && (
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-slate-500 uppercase">Promo ({sim.promo})</span>
                          <div className="text-right">
                            {renderRemainingBadge(promoRemaining, 'promo')}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Subscription</span>
                        <div className="text-right">
                          {renderRemainingBadge(sim.daysRemainingPlatform, 'platform')}
                        </div>
                      </div>
                    </div>

                    {/* Hardware Info Section */}
                    <div className="text-[10px] font-mono text-slate-500 bg-[#0f172a]/50 p-2.5 rounded-lg space-y-0.5 border border-[#334155]/40">
                      <div>Model: <span className="text-slate-300">{sim.model || 'N/A'}</span></div>
                      <div>Brand: <span className="text-slate-300">{sim.brand || 'N/A'}</span></div>
                      <div>IMEI: <span className="text-slate-300">{sim.imei || 'N/A'}</span></div>
                      <div>ICCID: <span className="text-slate-300">{sim.iccid}</span></div>
                    </div>
                  </div>

                  {/* Quick Card Footer Action */}
                  <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[#334155]/40">
                    <button
                      onClick={() => onSelectForLoad(sim.iccid)}
                      className="flex items-center gap-1.5 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-sans text-xs font-semibold rounded-lg transition-all shadow-md cursor-pointer"
                      id={`btn-load-sim-card-${sim.iccid}`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Request Load
                    </button>
                    <button
                      onClick={() => onEditSim(sim)}
                      className="p-1.5 bg-[#1e293b] border border-[#334155] hover:bg-slate-700 rounded-lg text-slate-300 transition-all cursor-pointer"
                      id={`btn-edit-sim-card-${sim.iccid}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteSim(sim.iccid)}
                      className="p-1.5 bg-[#1e293b] hover:bg-red-950/50 hover:text-red-400 border border-[#334155] rounded-lg text-slate-500 transition-all cursor-pointer"
                      id={`btn-delete-sim-card-${sim.iccid}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="bg-[#1e293b]/30 border border-dashed border-[#334155] rounded-2xl p-16 text-center animate-fadeIn">
          <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-base font-sans text-slate-300">No SIM cards match your search or filters.</p>
          <p className="text-xs font-mono text-slate-500 mt-1.5">Try refining your smart search terms or change your filter status.</p>
        </div>
      )}
    </div>
  );
}
