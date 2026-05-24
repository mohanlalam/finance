import { useState } from 'react';
import { RealEstate, DocumentMetadata, PortfolioName } from '../types/portfolio';
import { formatINR, formatPercent, pnlColor, getDocumentUrl } from '../utils/formatters';
import { Plus, Trash2, Edit2, Home, MapPin, TrendingUp, Building2, FileText } from 'lucide-react';

interface RealEstateViewProps {
  realEstate: RealEstate[];
  documents: DocumentMetadata[];
  portfolioName: PortfolioName;
  onAdd: (assetType: string, portfolioName: string, payload: Record<string, unknown>) => Promise<void>;
  onUpdate: (assetType: string, id: string, payload: Record<string, unknown>) => Promise<void>;
  onDelete: (assetType: string, id: string) => Promise<void>;
}

const TYPE_OPTIONS: Array<RealEstate['property_type']> = ['apartment', 'house', 'plot', 'commercial'];

export default function RealEstateView({
  realEstate,
  documents,
  portfolioName,
  onAdd,
  onUpdate,
  onDelete,
}: RealEstateViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<RealEstate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [propertyName, setPropertyName] = useState('');
  const [propertyType, setPropertyType] = useState<RealEstate['property_type']>('apartment');
  const [location, setLocation] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentValuation, setCurrentValuation] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');

  const totalPurchase = realEstate.reduce((s, r) => s + Number(r.purchase_price), 0);
  const totalCurrent = realEstate.reduce((s, r) => s + Number(r.current_valuation), 0);
  const totalMonthlyRent = realEstate.reduce((s, r) => s + Number(r.monthly_rent), 0);
  const annualRent = totalMonthlyRent * 12;
  const totalGain = totalCurrent - totalPurchase;
  const yieldPct = totalCurrent > 0 ? (annualRent / totalCurrent) * 100 : 0;

  function handleOpenAdd() {
    setEditing(null);
    setPropertyName('');
    setPropertyType('apartment');
    setLocation('');
    setPurchasePrice('');
    setCurrentValuation('');
    setPurchaseDate('');
    setMonthlyRent('');
    setError('');
    setShowModal(true);
  }

  function handleOpenEdit(r: RealEstate) {
    setEditing(r);
    setPropertyName(r.property_name);
    setPropertyType(r.property_type);
    setLocation(r.location ?? '');
    setPurchasePrice(String(r.purchase_price));
    setCurrentValuation(String(r.current_valuation));
    setPurchaseDate(r.purchase_date ?? '');
    setMonthlyRent(String(r.monthly_rent));
    setError('');
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!propertyName || !purchasePrice || !currentValuation) {
      setError('Property name, purchase price, and current valuation are required.');
      return;
    }
    setLoading(true);
    setError('');
    const payload = {
      propertyName,
      propertyType,
      location: location || null,
      purchasePrice: parseFloat(purchasePrice),
      currentValuation: parseFloat(currentValuation),
      purchaseDate: purchaseDate || null,
      monthlyRent: monthlyRent ? parseFloat(monthlyRent) : 0,
    };
    try {
      if (editing) {
        await onUpdate('real_estate', editing.id, payload);
      } else {
        await onAdd('real_estate', portfolioName === 'all' ? 'personal' : portfolioName, payload);
      }
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this real estate property?')) return;
    try {
      await onDelete('real_estate', id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-gradient-to-tr from-emerald-600 to-teal-600 rounded-2xl p-5 text-white shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-100 font-semibold uppercase tracking-wider">Portfolio Value</p>
            <p className="text-2xl font-bold mt-1">{formatINR(totalCurrent)}</p>
            <p className="text-xs text-emerald-200 mt-2">{realEstate.length} properties</p>
          </div>
          <Building2 size={40} className="opacity-20 shrink-0" />
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Capital Appreciation</p>
            <p className={`text-2xl font-bold mt-1 ${pnlColor(totalGain)}`}>{formatINR(totalGain)}</p>
            <p className="text-xs text-slate-400 mt-2">vs cost basis</p>
          </div>
          <TrendingUp size={40} className="text-emerald-500/20 shrink-0" />
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Monthly Rent</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{formatINR(totalMonthlyRent)}</p>
            <p className="text-xs text-slate-400 mt-2">{formatINR(annualRent)}/yr</p>
          </div>
          <Home size={40} className="text-blue-500/20 shrink-0" />
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Rental Yield</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{yieldPct.toFixed(2)}%</p>
            <p className="text-xs text-slate-400 mt-2">Annual / current value</p>
          </div>
          <MapPin size={40} className="text-amber-500/20 shrink-0" />
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Properties</h3>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={13} />
            Add Property
          </button>
        </div>

        {realEstate.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Building2 size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-semibold">No properties tracked</p>
            <p className="text-xs mt-1">Add your first property to start tracking value & rent.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {realEstate.map((r) => {
              const gain = Number(r.current_valuation) - Number(r.purchase_price);
              const gainPct = Number(r.purchase_price) > 0 ? (gain / Number(r.purchase_price)) * 100 : 0;
              const propertyYield = Number(r.current_valuation) > 0 ? ((Number(r.monthly_rent) * 12) / Number(r.current_valuation)) * 100 : 0;
              const docs = documents.filter((d) => d.asset_type === 'real_estate' && d.asset_id === r.id);
              return (
                <div key={r.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Home size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-800">{r.property_name}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 capitalize">
                            {r.property_type}
                          </span>
                        </div>
                        {r.location && (
                          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                            <MapPin size={11} /> {r.location}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 md:text-right">
                      <div>
                        <p className="text-xs text-slate-400">Purchase</p>
                        <p className="text-sm font-bold text-slate-800">{formatINR(Number(r.purchase_price))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Current</p>
                        <p className={`text-sm font-bold ${pnlColor(gain)}`}>{formatINR(Number(r.current_valuation))}</p>
                        <p className={`text-[10px] ${pnlColor(gain)}`}>{formatPercent(gainPct)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Rent/mo</p>
                        <p className="text-sm font-bold text-slate-800">{formatINR(Number(r.monthly_rent))}</p>
                        <p className="text-[10px] text-slate-400">{propertyYield.toFixed(2)}% yield</p>
                      </div>
                      <div className="col-span-2 sm:col-span-1 flex items-center justify-start md:justify-end gap-2">
                        {docs.map((doc) => (
                          <a
                            key={doc.id}
                            href={getDocumentUrl(doc.file_path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-colors"
                            title={doc.name}
                          >
                            <FileText size={14} />
                          </a>
                        ))}
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {editing ? 'Edit Property' : 'Add Property'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Track property value, rent, and yield</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Property Name</label>
                <input
                  type="text"
                  placeholder="e.g. 2BHK Apartment (Whitefield)"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Type</label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value as RealEstate['property_type'])}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors capitalize"
                  >
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Location</label>
                  <input
                    type="text"
                    placeholder="City, State"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Purchase Price (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Current Valuation (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={currentValuation}
                    onChange={(e) => setCurrentValuation(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Purchase Date</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Monthly Rent (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors"
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-slate-200 text-slate-600 font-semibold text-sm rounded-xl py-2.5 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-emerald-600 text-white font-semibold text-sm rounded-xl py-2.5 hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editing ? 'Save Changes' : 'Add Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
