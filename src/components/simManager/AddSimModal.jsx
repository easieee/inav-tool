import { useState, useEffect } from 'react';
import { formatDate, addDays } from '../../lib/simDateUtils.js';
import { X, ShieldAlert, Cpu } from 'lucide-react';

export default function AddSimModal({
  isOpen,
  onClose,
  onSave,
  editingSim,
  promos,
  isPromoOnlyMode = false
}) {
  const [iccid, setIccid] = useState('');
  const [company, setCompany] = useState('');
  const [plate, setPlate] = useState('');
  const [imei, setImei] = useState('');
  const [model, setModel] = useState('');
  const [brand, setBrand] = useState('');
  const [sim, setSim] = useState('');
  const [regularBalance, setRegularBalance] = useState(0);
  const [loadDate, setLoadDate] = useState('');
  const [promo, setPromo] = useState('');
  const [promoExp, setPromoExp] = useState('');
  const [dateOfSubs, setDateOfSubs] = useState('');
  const [expirationOfSubs, setExpirationOfSubs] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingSim) {
      setIccid(editingSim.iccid);
      setCompany(editingSim.company || '');
      setPlate(editingSim.plate || '');
      setImei(editingSim.imei || '');
      setModel(editingSim.model || '');
      setBrand(editingSim.brand || '');
      setSim(editingSim.sim || '');
      setRegularBalance(editingSim.regularBalance || 0);
      setLoadDate(editingSim.loadDate ? formatDate(editingSim.loadDate) : '');
      setPromo(editingSim.promo || '');
      setPromoExp(editingSim.promoExp ? formatDate(editingSim.promoExp) : '');
      setDateOfSubs(editingSim.dateOfSubs ? formatDate(editingSim.dateOfSubs) : '');
      setExpirationOfSubs(editingSim.expirationOfSubs ? formatDate(editingSim.expirationOfSubs) : '');
    } else {
      // Clear forms for brand new entry
      setIccid('');
      setCompany('');
      setPlate('');
      setImei('');
      setModel('');
      setBrand('');
      setSim('');
      setRegularBalance(0);
      setLoadDate(formatDate(new Date()));
      setPromo('');
      setPromoExp('');
      setDateOfSubs(formatDate(new Date()));
      setExpirationOfSubs(formatDate(new Date(new Date().setFullYear(new Date().getFullYear() + 1))));
    }
    setError('');
  }, [editingSim, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!iccid.trim()) {
      setError('SIM ICCID is required.');
      return;
    }
    if (!sim.trim()) {
      setError('SIM Phone Number is required.');
      return;
    }

    onSave({
      iccid: iccid.trim(),
      company: company.trim() || 'Unassigned',
      plate: plate.trim(),
      imei: imei.trim(),
      model: model.trim(),
      brand: brand.trim(),
      sim: sim.trim(),
      regularBalance: parseFloat(regularBalance.toString()) || 0,
      loadDate: loadDate,
      daysRemaining: 0, // App will compute live
      promo: promo.trim(),
      promoExp: promoExp,
      daysRemainingPlatform: 0, // App will compute live
      dateOfSubs: dateOfSubs,
      expirationOfSubs: expirationOfSubs,
      lastUpdated: new Date().toISOString()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-[#1e293b] border border-[#334155] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-zoomIn"
        id="add-sim-modal"
      >
        <div className="px-6 py-4 bg-[#0f172a]/80 border-b border-[#334155] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-500" />
            <h3 className="text-base font-sans font-semibold text-white">
              {isPromoOnlyMode ? 'Register SIM Promo Plan' : editingSim ? 'Edit SIM Card Configuration' : 'Register New SIM Card'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="bg-red-950/40 border border-red-500/50 text-red-200 text-xs rounded-xl p-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isPromoOnlyMode ? (
            <div className="space-y-5">
              {/* Informative SIM summary bar */}
              <div className="bg-[#0f172a] p-4 rounded-xl border border-[#334155]/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block tracking-wider">SIM Target</span>
                  <span className="text-sm font-semibold text-white">{sim || 'N/A'}</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">ICCID: {iccid}</span>
                </div>
                {company && (
                  <div className="md:text-right">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block tracking-wider">Assigned Fleet</span>
                    <span className="text-xs font-semibold text-slate-300">{company} {plate ? `(${plate})` : ''}</span>
                  </div>
                )}
              </div>

              {/* Promo selection and automated expiration date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-amber-400 uppercase mb-1.5 font-bold tracking-wider">Select Promo Plan *</label>
                  <select
                    value={promo}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPromo(val);
                      if (val) {
                        const matched = promos.find(p => p.name === val);
                        if (matched) {
                          // Automatically calculate expiration from today
                          setPromoExp(formatDate(addDays(new Date(), matched.durationDays)));
                        }
                      } else {
                        setPromoExp('');
                      }
                    }}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer font-medium"
                    id="modal-promo-plan"
                    required
                  >
                    <option value="">-- Choose Promo --</option>
                    {promos.map(p => (
                      <option key={p.name} value={p.name}>
                        {p.name} ({p.durationDays} Days validity)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1.5 tracking-wider">Promo Expiration Date (Automated)</label>
                  <input
                    type="date"
                    value={promoExp}
                    onChange={(e) => setPromoExp(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    id="modal-promo-exp"
                    required
                  />
                  <p className="text-[9px] font-sans text-slate-500 mt-1">
                    * Automatically calculated based on selected plan's validity period.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ICCID (Unique Key - non-editable if editing) */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">ICCID (SIM Serial) *</label>
                <input
                  type="text"
                  disabled={!!editingSim}
                  placeholder="e.g. 89630000000001234567"
                  value={iccid}
                  onChange={(e) => setIccid(e.target.value)}
                  className={`w-full bg-[#0f172a] border border-[#334155] rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-blue-500 ${
                    editingSim ? 'opacity-60 cursor-not-allowed bg-slate-900' : ''
                  }`}
                  id="modal-iccid"
                />
              </div>

              {/* SIM Number */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">SIM Phone Number *</label>
                <input
                  type="text"
                  placeholder="e.g. +639171234567"
                  value={sim}
                  onChange={(e) => setSim(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  id="modal-sim"
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Fleet / Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Logistics Express"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  id="modal-company"
                />
              </div>

              {/* Plate */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Vehicle Plate Number</label>
                <input
                  type="text"
                  placeholder="e.g. ABC-1234"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  id="modal-plate"
                />
              </div>

              {/* IMEI */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Device IMEI</label>
                <input
                  type="text"
                  placeholder="15-digit IMEI"
                  value={imei}
                  onChange={(e) => setImei(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  id="modal-imei"
                />
              </div>

              {/* Model */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">GPS Tracker Model</label>
                <input
                  type="text"
                  placeholder="e.g. Teltonika FMB920"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  id="modal-model"
                />
              </div>

              {/* Brand */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Tracker Brand</label>
                <input
                  type="text"
                  placeholder="e.g. iNAV Fleet"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  id="modal-brand"
                />
              </div>

              {/* Regular Balance */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Regular Balance (₱)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={regularBalance}
                  onChange={(e) => setRegularBalance(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  id="modal-balance"
                />
              </div>

              {/* Load Date */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Load Date</label>
                <input
                  type="date"
                  value={loadDate}
                  onChange={(e) => setLoadDate(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  id="modal-loaddate"
                />
              </div>

              {/* Date of Subs */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Date of Subscription</label>
                <input
                  type="date"
                  value={dateOfSubs}
                  onChange={(e) => setDateOfSubs(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  id="modal-subs-date"
                />
              </div>

              {/* Expiration of Subs */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Platform Expiration Date</label>
                <input
                  type="date"
                  value={expirationOfSubs}
                  onChange={(e) => setExpirationOfSubs(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  id="modal-subs-exp"
                />
              </div>

              {/* Active Promo Plan (optional metadata override) */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Promo Plan</label>
                <select
                  value={promo}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPromo(val);
                    if (val) {
                      const matched = promos.find(p => p.name === val);
                      if (matched) {
                        // Automatically calculate expiration from today
                        setPromoExp(formatDate(addDays(new Date(), matched.durationDays)));
                      }
                    } else {
                      setPromoExp('');
                    }
                  }}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  id="modal-promo"
                >
                  <option value="">No Active Promo</option>
                  {promos.map(p => (
                    <option key={p.name} value={p.name}>
                      {p.name} ({p.durationDays} Days)
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Promo Expiration Date</label>
                <input
                  type="date"
                  value={promoExp}
                  onChange={(e) => setPromoExp(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  id="modal-promo-exp"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-[#334155]/60">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-sans font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-sans font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
              id="modal-save-btn"
            >
              {isPromoOnlyMode ? 'Submit Promo Registration' : 'Save SIM Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
