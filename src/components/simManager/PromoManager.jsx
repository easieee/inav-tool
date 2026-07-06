import { useState } from 'react';
import { Plus, Trash2, Tag, Calendar, Info } from 'lucide-react';

export default function PromoManager({ promos, onAddPromo, onDeletePromo, canManageData = true }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Promo name is required');
      return;
    }

    if (durationDays <= 0) {
      setError('Duration must be at least 1 day');
      return;
    }

    const exists = promos.some(p => p.name.toLowerCase() === name.trim().toLowerCase());
    if (exists) {
      setError('A promo with this name already exists');
      return;
    }

    onAddPromo({
      name: name.trim(),
      durationDays,
      description: description.trim()
    });

    setName('');
    setDurationDays(30);
    setDescription('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-sans font-medium text-white tracking-tight flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-500" />
            Promo Catalog Manager
          </h2>
        </div>
        {canManageData && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-sans text-sm font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-blue-900/30 cursor-pointer"
            id="btn-toggle-add-promo"
          >
            <Plus className="w-4 h-4" />
            {showAddForm ? 'Cancel' : 'New Promo'}
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 space-y-4 max-w-xl animate-fadeIn">
          <h3 className="text-sm font-medium text-white uppercase tracking-wider">Create New Promo Plan</h3>

          {error && (
            <div className="bg-red-900/20 border border-red-500/50 text-red-200 text-xs rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Promo Name</label>
              <input
                type="text"
                placeholder="e.g. UNLI DATA 599"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                id="promo-name-input"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Duration (Days)</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg py-2 px-3 pl-8 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  id="promo-duration-input"
                />
                <Calendar className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-500" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Description / Inclusions</label>
            <input
              type="text"
              placeholder="e.g. Unlimited data for 30 days, no speed cap"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              id="promo-desc-input"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-sans text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-sans text-xs font-medium py-2 px-4 rounded-lg transition-colors cursor-pointer"
              id="btn-save-promo"
            >
              Save Promo
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {promos.map((promo) => (
          <div
            key={promo.name}
            className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 flex flex-col justify-between hover:border-slate-500 transition-all group shadow-sm hover:shadow-md animate-fadeIn"
            id={`promo-card-${promo.name.replace(/\s+/g, '-').toLowerCase()}`}
          >
            <div>
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs text-blue-400 border border-blue-500/20 bg-blue-950/20 px-2 py-0.5 rounded">
                  {promo.durationDays} Days
                </span>
                <button
                  onClick={() => onDeletePromo(promo.name)}
                  className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded hover:bg-slate-800 opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                  title="Delete Promo"
                  id={`btn-delete-promo-${promo.name.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h4 className="text-base font-sans font-medium text-white mt-3">{promo.name}</h4>
              <p className="text-xs font-sans text-slate-400 mt-2 flex items-start gap-1">
                <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span>{promo.description || 'No description provided.'}</span>
              </p>
            </div>
          </div>
        ))}

        {promos.length === 0 && (
          <div className="col-span-full bg-[#1e293b]/30 border border-dashed border-[#334155] rounded-xl p-10 text-center animate-fadeIn">
            <Tag className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-sans text-slate-400">No promos configured yet.</p>
            <p className="text-xs font-mono text-slate-600 mt-1">Add a promo above to start assigning them to SIM cards.</p>
          </div>
        )}
      </div>
    </div>
  );
}
