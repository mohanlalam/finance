import React, { useState, useCallback } from 'react';
import { Insurance, DocumentMetadata, PortfolioName } from '../types/portfolio';
import { formatINR, getDocumentUrl } from '../utils/formatters';
import { Plus, Trash2, Edit2, Shield, ShieldAlert, FileText, Calendar, Clock, X, StickyNote } from 'lucide-react';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';

interface PortfolioOption {
  name: string;
  label: string;
}

interface InsuranceViewProps {
  insurances: Insurance[];
  documents: DocumentMetadata[];
  portfolioName: PortfolioName;
  portfolioOptions: PortfolioOption[];
  onAdd: (assetType: string, portfolioName: string, payload: Record<string, unknown>) => Promise<void>;
  onUpdate: (assetType: string, id: string, payload: Record<string, unknown>) => Promise<void>;
  onDelete: (assetType: string, id: string) => Promise<void>;
  autoOpenAddModal?: boolean;
}

const TYPE_OPTIONS: Array<Insurance['insurance_type']> = ['health', 'term', 'life', 'motor', 'other'];

const TYPE_STYLES: Record<Insurance['insurance_type'], { bg: string; text: string; ring: string }> = {
  health: { bg: 'bg-rose-50 dark:bg-rose-950/20', text: 'text-rose-700 dark:text-rose-400', ring: 'ring-rose-200 dark:ring-rose-800' },
  term: { bg: 'bg-blue-50 dark:bg-blue-950/20', text: 'text-blue-700 dark:text-blue-400', ring: 'ring-blue-200 dark:ring-blue-800' },
  life: { bg: 'bg-purple-50 dark:bg-purple-950/20', text: 'text-purple-700 dark:text-purple-400', ring: 'ring-purple-200 dark:ring-purple-800' },
  motor: { bg: 'bg-orange-50 dark:bg-orange-950/20', text: 'text-orange-700 dark:text-orange-400', ring: 'ring-orange-200 dark:ring-orange-800' },
  other: { bg: 'bg-slate-50 dark:bg-slate-900/40', text: 'text-slate-700 dark:text-slate-400', ring: 'ring-slate-200 dark:ring-slate-800' },
};

function daysUntil(date?: string): number | null {
  if (!date) return null;
  const t = new Date(date).getTime();
  if (isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / (1000 * 3600 * 24));
}

export default React.memo(function InsuranceView({
  insurances,
  documents,
  portfolioName,
  portfolioOptions,
  onAdd,
  onUpdate,
  onDelete,
  autoOpenAddModal,
}: InsuranceViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Insurance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formPortfolio, setFormPortfolio] = useState(() => portfolioName);
  const [insuranceType, setInsuranceType] = useState<Insurance['insurance_type']>('health');
  const [provider, setProvider] = useState('');
  const [policyName, setPolicyName] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [sumAssured, setSumAssured] = useState('');
  const [premiumAmount, setPremiumAmount] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [notes, setNotes] = useState('');

  // Confirm-delete state
  const [confirmDelete, setConfirmDelete] = useState<Insurance | null>(null);

  const totalCoverage = insurances.reduce((s, i) => s + Number(i.sum_assured), 0);
  const totalPremium = insurances.reduce((s, i) => s + Number(i.premium_amount), 0);
  const upcomingRenewals = insurances.filter((i) => {
    const d = daysUntil(i.renewal_date);
    return d !== null && d >= 0 && d <= 60;
  }).length;

  const handleOpenAdd = useCallback(() => {
    setEditing(null);
    setFormPortfolio(portfolioName);
    setInsuranceType('health');
    setProvider('');
    setPolicyName('');
    setPolicyNumber('');
    setSumAssured('');
    setPremiumAmount('');
    setRenewalDate('');
    setNotes('');
    setError('');
    setShowModal(true);
  }, [portfolioName]);

  React.useEffect(() => {
    if (autoOpenAddModal) {
      handleOpenAdd();
    }
  }, [autoOpenAddModal, handleOpenAdd]);

  function handleOpenEdit(i: Insurance) {
    setEditing(i);
    setFormPortfolio(portfolioName);
    setInsuranceType(i.insurance_type);
    setProvider(i.provider);
    setPolicyName(i.policy_name);
    setPolicyNumber(i.policy_number ?? '');
    setSumAssured(String(i.sum_assured));
    setPremiumAmount(String(i.premium_amount));
    setRenewalDate(i.renewal_date ?? '');
    setNotes(i.notes ?? '');
    setError('');
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!provider || !policyName || !sumAssured || !premiumAmount) {
      setError('Provider, policy name, sum assured, and premium are required.');
      return;
    }
    setLoading(true);
    setError('');
    const payload = {
      insuranceType,
      provider,
      policyName,
      policyNumber: policyNumber || null,
      sumAssured: parseFloat(sumAssured),
      premiumAmount: parseFloat(premiumAmount),
      renewalDate: renewalDate || null,
      notes: notes || null,
    };
    try {
      if (editing) {
        await onUpdate('insurance', editing.id, payload);
      } else {
        await onAdd('insurance', formPortfolio, payload);
      }
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await onDelete('insurance', id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-tr from-rose-500 to-pink-600 rounded-2xl p-5 text-white shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs text-rose-100 font-semibold uppercase tracking-wider">Total Coverage</p>
            <p className="text-2xl font-bold mt-1">{formatINR(totalCoverage)}</p>
            <p className="text-xs text-rose-200 mt-2">{insurances.length} active policies</p>
          </div>
          <Shield size={40} className="opacity-20 shrink-0" />
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Annual Premium</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{formatINR(totalPremium)}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Total outflow per year</p>
          </div>
          <Calendar size={40} className="text-blue-500/20 shrink-0" />
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Renewals in 60d</p>
            <p className={`text-2xl font-bold mt-1 ${upcomingRenewals > 0 ? 'text-amber-600 dark:text-amber-450' : 'text-slate-800 dark:text-slate-100'}`}>{upcomingRenewals}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Action needed soon</p>
          </div>
          <ShieldAlert size={40} className="text-amber-500/20 shrink-0" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Insurance Policies</h3>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={13} />
            Add Policy
          </button>
        </div>

        {insurances.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-950/30 dark:to-pink-950/30 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <Shield size={36} className="text-rose-400 dark:text-rose-500" />
            </div>
            <h4 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-1.5">No Insurance Policies Yet</h4>
            <p className="text-sm text-slate-400 dark:text-slate-500 mb-6 max-w-xs mx-auto">
              Register health, term, life, or motor policies to track coverage, premiums, and renewal deadlines.
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-rose-500/20"
            >
              <Plus size={15} />
              Add Your First Policy
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {insurances.map((i) => {
              const days = daysUntil(i.renewal_date);
              const isUrgent = days !== null && days >= 0 && days <= 30;
              const isWarn = days !== null && days > 30 && days <= 60;
              const isExpired = days !== null && days < 0;
              const style = TYPE_STYLES[i.insurance_type];
              const docs = documents.filter((d) => d.asset_type === 'insurance' && d.asset_id === i.id);

              return (
                <div key={i.id} className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl ${style.bg} ${style.text} flex items-center justify-center shrink-0`}>
                        <Shield size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{i.policy_name}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text} capitalize`}>
                            {i.insurance_type}
                          </span>
                          {isUrgent && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center gap-1">
                              <Clock size={10} /> {days}d to renew
                            </span>
                          )}
                          {isWarn && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex items-center gap-1">
                              <Clock size={10} /> {days}d to renew
                            </span>
                          )}
                          {isExpired && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/40 text-red-750 dark:text-red-400">
                              Expired
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          {i.provider}{i.policy_number ? ` · ${i.policy_number}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 md:text-right">
                      <div>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Sum Assured</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{formatINR(Number(i.sum_assured))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Premium / year</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{formatINR(Number(i.premium_amount))}</p>
                        {i.renewal_date && <p className="text-[10px] text-slate-450 dark:text-slate-500">Renew: {i.renewal_date}</p>}
                      </div>
                      <div className="col-span-2 sm:col-span-1 flex items-center justify-start md:justify-end gap-2">
                        {docs.map((doc) => (
                          <a
                            key={doc.id}
                            href={getDocumentUrl(doc.file_path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-800 transition-colors"
                            title={doc.name}
                          >
                            <FileText size={14} />
                          </a>
                        ))}
                        <button
                          onClick={() => handleOpenEdit(i)}
                          className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-blue-650 dark:hover:text-blue-450 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(i)}
                          className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-red-500 hover:border-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                  {i.notes && (
                    <p className="mt-2 text-xs text-slate-400 dark:text-slate-500 flex items-start gap-1.5">
                      <StickyNote size={11} className="shrink-0 mt-0.5" />
                      <span className="italic">{i.notes}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => !loading && setShowModal(false)}
        ariaLabel={editing ? 'Edit Insurance Policy' : 'Add Insurance Policy'}
        preventClose={loading}
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {editing ? 'Edit Insurance Policy' : 'Add Insurance Policy'}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Health, term, life, or motor cover</p>
          </div>
          <button
            onClick={() => !loading && setShowModal(false)}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 transition-colors"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Portfolio</label>
            <select
              value={formPortfolio}
              onChange={(e) => setFormPortfolio(e.target.value)}
              disabled={!!editing}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-350 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-450 transition-colors disabled:opacity-50"
            >
              {portfolioOptions.map((o) => (
                <option key={o.name} value={o.name}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Type</label>
              <select
                value={insuranceType}
                onChange={(e) => setInsuranceType(e.target.value as Insurance['insurance_type'])}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-355 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-450 transition-colors capitalize"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Provider</label>
              <input
                type="text"
                placeholder="e.g. HDFC Ergo"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-750 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-450 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Policy Name</label>
            <input
              type="text"
              placeholder="e.g. Optima Secure Family"
              value={policyName}
              onChange={(e) => setPolicyName(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-750 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-455 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Policy Number</label>
            <input
              type="text"
              placeholder="e.g. POL-10928374"
              value={policyNumber}
              onChange={(e) => setPolicyNumber(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-750 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-455 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Sum Assured (₹)</label>
              <input
                type="number"
                placeholder="0"
                value={sumAssured}
                onChange={(e) => setSumAssured(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-755 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-450 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Premium / year (₹)</label>
              <input
                type="number"
                placeholder="0"
                value={premiumAmount}
                onChange={(e) => setPremiumAmount(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-755 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-450 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Renewal Date</label>
            <input
              type="date"
              value={renewalDate}
              onChange={(e) => setRenewalDate(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-750 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-455 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Notes <span className="font-normal text-slate-400">(optional)</span></label>
            <textarea
              rows={2}
              placeholder="e.g. Family floater plan, covers 4 members"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-750 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-455 transition-colors resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-xl px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 font-semibold text-sm rounded-xl py-2.5 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-rose-600 text-white font-semibold text-sm rounded-xl py-2.5 hover:bg-rose-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : editing ? 'Save Changes' : 'Add Policy'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm delete dialog */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => { if (confirmDelete) void handleDelete(confirmDelete.id); }}
        title="Delete Insurance Policy"
        message={confirmDelete ? `Are you sure you want to delete "${confirmDelete.policy_name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
      />
    </div>
  );
});
