import { useState, useEffect } from 'react';
import { formatDate, addDays } from '../../lib/simDateUtils.js';
import { CreditCard, Shield, Send, CheckCircle2, UserPlus, Info, Check, X, Tag, Clock, AlertCircle, Coins } from 'lucide-react';

export default function LoadRequestForm({
  sims,
  promos,
  loadRequests,
  preselectedIccid,
  onRequestLoad,
  onConfirmLoad,
  onRejectLoad,
  onEditSim,
  canManageData = true
}) {
  const [isManual, setIsManual] = useState(false);
  const [selectedIccid, setSelectedIccid] = useState('');

  // Existing SIM search/select
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Manual Form State
  const [manualIccid, setManualIccid] = useState('');
  const [manualCompany, setManualCompany] = useState('');
  const [manualPlate, setManualPlate] = useState('');
  const [manualImei, setManualImei] = useState('');
  const [manualModel, setManualModel] = useState('');
  const [manualBrand, setManualBrand] = useState('');
  const [manualSim, setManualSim] = useState('');
  const [manualRegBalance, setManualRegBalance] = useState(0);
  const [manualLoadDate, setManualLoadDate] = useState(formatDate(new Date()));
  const [manualDateOfSubs, setManualDateOfSubs] = useState(formatDate(new Date()));
  const [manualExpirationOfSubs, setManualExpirationOfSubs] = useState(formatDate(addDays(new Date(), 365)));

  // Load Request State
  const [loadType, setLoadType] = useState('Regular');
  const [regularAmount, setRegularAmount] = useState(100);
  const [selectedPromoName, setSelectedPromoName] = useState('');
  const [notes, setNotes] = useState('');

  // Filter for request list
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredRequests = loadRequests.filter(req => {
    if (statusFilter === 'All') return true;
    return req.status === statusFilter;
  });

  // Status & Feedback
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    if (preselectedIccid) {
      setSelectedIccid(preselectedIccid);
      setIsManual(false);
      const preSim = sims.find(s => s.iccid === preselectedIccid);
      if (preSim) {
        setSearchQuery(`${preSim.sim} (${preSim.plate || 'No Plate'})`);
      }
      setIsFormOpen(true);
    }
  }, [preselectedIccid, sims]);

  useEffect(() => {
    if (promos.length > 0 && !selectedPromoName) {
      setSelectedPromoName(promos[0].name);
    }
  }, [promos, selectedPromoName]);

  const filteredSims = sims.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      s.sim.toLowerCase().includes(q) ||
      s.plate.toLowerCase().includes(q) ||
      s.company.toLowerCase().includes(q) ||
      s.iccid.toLowerCase().includes(q)
    );
  });

  const handleSelectExisting = (sim) => {
    setSelectedIccid(sim.iccid);
    setSearchQuery(`${sim.sim} (${sim.plate || 'No Plate'})`);
    setShowDropdown(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validations
    if (isManual) {
      if (!manualIccid.trim()) {
        setErrorMsg('ICCID is required for manual entry.');
        return;
      }
      if (sims.some(s => s.iccid === manualIccid.trim())) {
        setErrorMsg('A SIM card with this ICCID already exists. Please select it from the list instead.');
        return;
      }
      if (!manualSim.trim()) {
        setErrorMsg('SIM number is required.');
        return;
      }
    } else {
      if (!selectedIccid) {
        setErrorMsg('Please search and select a SIM card from the list.');
        return;
      }
    }

    let val = '';
    if (loadType === 'Regular') {
      if (regularAmount <= 0) {
        setErrorMsg('Please specify a positive load amount.');
        return;
      }
      val = regularAmount.toString();
    } else {
      if (!selectedPromoName) {
        setErrorMsg('Please select a promo plan.');
        return;
      }
      val = selectedPromoName;
    }

    // Build the SIM payload for manual creation or existing reference
    const simData = isManual
      ? {
          iccid: manualIccid.trim(),
          company: manualCompany.trim() || 'Unassigned',
          plate: manualPlate.trim(),
          imei: manualImei.trim(),
          model: manualModel.trim(),
          brand: manualBrand.trim(),
          sim: manualSim.trim(),
          regularBalance: parseFloat(manualRegBalance.toString()) || 0,
          loadDate: manualLoadDate,
          promo: loadType === 'Promo' ? val : '',
          promoExp: '', // Calculated dynamically inside SimManagerApp
          dateOfSubs: manualDateOfSubs,
          expirationOfSubs: manualExpirationOfSubs,
        }
      : { iccid: selectedIccid };

    onRequestLoad({
      isManual,
      simData,
      loadType,
      amountOrPromoName: val,
      notes: notes.trim(),
    });

    // Reset forms
    setSuccessMsg(`Load request for ${isManual ? manualSim : 'selected SIM'} has been created with status "Pending". Please see the request list below to confirm once loaded.`);

    if (isManual) {
      setManualIccid('');
      setManualCompany('');
      setManualPlate('');
      setManualImei('');
      setManualModel('');
      setManualBrand('');
      setManualSim('');
      setManualRegBalance(0);
    } else {
      setSelectedIccid('');
      setSearchQuery('');
    }
    setNotes('');
    setIsFormOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header and Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1e293b]/40 border border-[#334155]/60 rounded-2xl p-6 shadow-lg">
        <div>
          <h2 className="text-xl font-sans font-medium text-white tracking-tight flex items-center gap-2">
            <Coins className="w-5 h-5 text-blue-500" />
            SIM Load & Top-up Requests
          </h2>
        </div>

        {canManageData && (
          <button
            type="button"
            onClick={() => {
              setIsFormOpen(true);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-xs font-sans font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-900/20 hover:shadow-blue-900/30 shrink-0 self-start sm:self-center"
            id="btn-open-load-modal"
          >
            <CreditCard className="w-4 h-4" />
            Request SIM Load & Top-up
          </button>
        )}
      </div>

      {successMsg && (
        <div className="bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 text-sm rounded-xl p-4 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>{successMsg}</div>
        </div>
      )}

      {/* Load Request Form Modal Overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="relative bg-[#1e293b] border border-[#334155] rounded-2xl max-w-4xl w-full p-6 md:p-8 shadow-2xl max-h-[95vh] overflow-y-auto space-y-6 animate-scaleUp">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#334155] pb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-sans font-semibold text-white">
                  Create Load & Top-up Request
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                id="btn-close-load-modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-950/40 border border-red-500/50 text-red-200 text-sm rounded-xl p-4 animate-fadeIn">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* Left Column: SIM Selection & Parameters */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center justify-between border-b border-[#334155] pb-3">
                  <h3 className="text-sm font-mono font-bold text-blue-400 uppercase tracking-wider">
                    1. Choose SIM Target
                  </h3>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isManual}
                      onChange={(e) => {
                        setIsManual(e.target.checked);
                        setErrorMsg('');
                      }}
                      className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      id="toggle-manual-sim"
                    />
                    <span className="text-xs font-sans text-slate-300 font-medium">SIM is not on the list</span>
                  </label>
                </div>

          {!isManual ? (
            <div className="relative">
              <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Search SIM Card</label>
              <input
                type="text"
                placeholder="Search by SIM number, plate, or company..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                  if (!e.target.value) setSelectedIccid('');
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                id="search-sim-autocomplete"
              />

              {showDropdown && searchQuery && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                  <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-[#1e293b] border border-[#334155] rounded-xl shadow-2xl z-20 divide-y divide-[#334155]/60">
                    {filteredSims.length > 0 ? (
                      filteredSims.map(sim => (
                        <div
                          key={sim.iccid}
                          onClick={() => handleSelectExisting(sim)}
                          className="p-3 hover:bg-slate-800/60 cursor-pointer transition-colors text-left"
                        >
                          <div className="font-sans text-sm text-white font-medium">{sim.sim}</div>
                          <div className="flex justify-between items-center text-xs text-slate-400 font-mono mt-0.5">
                            <span>Plate: {sim.plate || 'No Plate'} • {sim.company}</span>
                            <span className="text-[10px] text-slate-500">ICCID: ...{sim.iccid.slice(-6)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-500 font-mono">
                        No matches found. Toggle "SIM is not on the list" above to add it manually.
                      </div>
                    )}
                  </div>
                </>
              )}
              {selectedIccid && (
                <div className="mt-2 text-xs font-mono text-slate-400 flex items-center gap-1.5 bg-[#0f172a] p-2.5 rounded-lg border border-[#334155]">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span>SIM selected securely: ICCID {selectedIccid}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 bg-[#0f172a]/40 border border-[#334155] p-5 rounded-xl animate-fadeIn">
              <div className="flex items-center gap-2 mb-2 text-white font-sans text-sm font-semibold">
                <UserPlus className="w-4 h-4 text-blue-500" />
                New SIM Registration Details
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">ICCID *</label>
                  <input
                    type="text"
                    placeholder="20-digit SIM ICCID"
                    value={manualIccid}
                    onChange={(e) => setManualIccid(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                    id="manual-iccid"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">SIM Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. +639171234567"
                    value={manualSim}
                    onChange={(e) => setManualSim(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                    id="manual-sim"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Company</label>
                  <input
                    type="text"
                    placeholder="e.g. Logistics Express"
                    value={manualCompany}
                    onChange={(e) => setManualCompany(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                    id="manual-company"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Plate Number</label>
                  <input
                    type="text"
                    placeholder="e.g. ABC-1234"
                    value={manualPlate}
                    onChange={(e) => setManualPlate(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                    id="manual-plate"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">IMEI</label>
                  <input
                    type="text"
                    placeholder="15-digit IMEI"
                    value={manualImei}
                    onChange={(e) => setManualImei(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                    id="manual-imei"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Device Model</label>
                  <input
                    type="text"
                    placeholder="e.g. Teltonika FMB920"
                    value={manualModel}
                    onChange={(e) => setManualModel(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                    id="manual-model"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Device Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. Ruptela"
                    value={manualBrand}
                    onChange={(e) => setManualBrand(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                    id="manual-brand"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Initial Regular Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={manualRegBalance}
                    onChange={(e) => setManualRegBalance(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                    id="manual-balance"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Load Date</label>
                  <input
                    type="date"
                    value={manualLoadDate}
                    onChange={(e) => setManualLoadDate(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    id="manual-loaddate"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Date of Subscription</label>
                  <input
                    type="date"
                    value={manualDateOfSubs}
                    onChange={(e) => setManualDateOfSubs(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    id="manual-subsdate"
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Expiration of Subscription</label>
                  <input
                    type="date"
                    value={manualExpirationOfSubs}
                    onChange={(e) => setManualExpirationOfSubs(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    id="manual-subs-exp"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Loading Setup */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-sm font-mono font-bold text-blue-400 uppercase tracking-wider border-b border-[#334155] pb-3">
              2. Load Configuration
            </h3>

            {/* Loading Fields */}
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Load Amount (Regular)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[50, 100, 200, 300, 500, 1000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setRegularAmount(amt)}
                      className={`py-2 text-xs font-mono rounded-lg border transition-all cursor-pointer ${
                        regularAmount === amt
                          ? 'bg-blue-950/40 text-blue-400 border-blue-500'
                          : 'bg-[#0f172a] text-slate-300 border-[#334155] hover:border-slate-500'
                      }`}
                    >
                      ₱{amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  placeholder="Enter custom amount"
                  value={regularAmount}
                  onChange={(e) => setRegularAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg py-2.5 px-3 mt-3 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="bg-[#0f172a]/40 border border-[#334155] p-3 rounded-lg text-[11px] font-sans text-slate-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Loading regular balance automatically resets the SIM's 90-day deactivation countdown starting from today.</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Transaction Notes</label>
              <textarea
                placeholder="Write specific notes or loading instructions..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-sans text-sm font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mt-6 shadow-lg shadow-blue-900/20 hover:shadow-blue-900/30 cursor-pointer"
            id="btn-submit-load-request"
          >
            <Send className="w-4 h-4" />
            Submit Load Request
          </button>
          <p className="text-[10px] font-sans text-slate-500 text-center mt-2 leading-relaxed">
            *Submitting creates a "Pending" load request. Once loaded, confirm it in the table below.
          </p>
        </div>
      </form>
          </div>
        </div>
      )}

      {/* Load Requests List */}
      <div className="bg-[#1e293b]/40 border border-[#334155]/60 rounded-2xl p-6 md:p-8 shadow-xl space-y-6 animate-fadeIn mt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#334155] pb-4">
          <div>
            <h3 className="text-lg font-sans font-medium text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Recent SIM Load & Registration Requests
            </h3>
            <p className="text-xs font-sans text-slate-400 mt-1">
              Verify pending regular loads or promo requests. Confirm once you have loaded the SIM to apply it to the fleet ledger.
            </p>
          </div>

          {/* Filter options */}
          <div className="flex items-center gap-1.5 p-1 bg-[#0f172a] border border-[#334155] rounded-xl self-start">
            {['All', 'Pending', 'Completed', 'Rejected'].map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-all cursor-pointer ${
                  statusFilter === f
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* List render */}
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-[#0f172a]/30 rounded-xl border border-dashed border-[#334155] animate-fadeIn">
            <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm font-sans text-slate-400">No requests found matching "{statusFilter}".</p>
          </div>
        ) : (
          <div className="overflow-x-auto animate-fadeIn">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#334155]/60 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pl-2">ID & Date</th>
                  <th className="pb-3">SIM Target</th>
                  <th className="pb-3">Type & Load</th>
                  <th className="pb-3">Notes</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]/40 text-sm">
                {filteredRequests.map(req => {
                  const matchedSim = sims.find(s => s.iccid === req.iccid);
                  return (
                    <tr key={req.id} className="hover:bg-slate-800/20 group">
                      {/* ID & Date */}
                      <td className="py-4 pl-2 font-mono">
                        <div className="font-semibold text-white text-xs">{req.id}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {new Date(req.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>

                      {/* SIM Target */}
                      <td className="py-4">
                        <div className="font-semibold text-white">{req.sim}</div>
                        <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap gap-1">
                          <span>Plate: <strong className="text-slate-300 font-medium">{req.plate || 'N/A'}</strong></span>
                          <span className="text-slate-600">•</span>
                          <span>{req.company}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          ICCID: ...{req.iccid.slice(-6)}
                        </div>
                      </td>

                      {/* Type & Load */}
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                          req.type === 'Regular'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}>
                          {req.type}
                        </span>
                        <div className="text-sm font-semibold text-white mt-1">{req.amountOrPromo}</div>
                      </td>

                      {/* Notes */}
                      <td className="py-4 max-w-xs truncate text-xs text-slate-300" title={req.notes}>
                        {req.notes || <span className="text-slate-600 font-mono">No notes</span>}
                      </td>

                      {/* Status */}
                      <td className="py-4">
                        {req.status === 'Pending' && (
                          <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded-lg text-xs font-semibold animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            Pending
                          </span>
                        )}
                        {req.status === 'Completed' && (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-lg text-xs font-semibold">
                            <Check className="w-3.5 h-3.5" />
                            Completed
                          </span>
                        )}
                        {req.status === 'Rejected' && (
                          <span className="inline-flex items-center gap-1 bg-slate-500/10 text-slate-400 border border-slate-500/20 px-2 py-1 rounded-lg text-xs font-semibold">
                            <X className="w-3.5 h-3.5" />
                            Rejected
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 text-right pr-2">
                        {req.status === 'Pending' && canManageData && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => onConfirmLoad(req.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                              title="Confirm SIM loaded successfully"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Confirm Loaded
                            </button>
                            <button
                              type="button"
                              onClick={() => onRejectLoad(req.id)}
                              className="bg-slate-800 hover:bg-red-950 hover:text-red-400 text-slate-400 hover:text-red-300 px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                              title="Reject request"
                            >
                              <X className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        )}

                        {req.status === 'Completed' && req.type === 'Regular' && (
                          <div className="flex flex-col md:flex-row items-end md:items-center justify-end gap-1.5">
                            {matchedSim ? (
                              <button
                                type="button"
                                onClick={() => onEditSim(matchedSim)}
                                className="bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 text-blue-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                                title="Edit SIM card to register Promo plan"
                              >
                                <Tag className="w-3.5 h-3.5 shrink-0" />
                                Edit & Register Promo
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-500 italic">SIM not found in master</span>
                            )}
                          </div>
                        )}

                        {req.status === 'Completed' && req.type === 'Promo' && (
                          <span className="text-xs text-slate-500 italic">Promo Active</span>
                        )}

                        {req.status === 'Rejected' && (
                          <span className="text-xs text-slate-500">No actions</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
