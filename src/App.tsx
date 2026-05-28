import { useState, useEffect, useRef } from 'react';
import {
  Users, User, Heart, LayoutDashboard, RefreshCw, Wifi, WifiOff, AlertCircle, Plus, Loader2,
  TrendingUp, Landmark, Coins, Home as HomeIcon, Shield, FolderOpen, UserPlus, X, Pencil, Check,
} from 'lucide-react';
import Header from './components/Header';
import SummaryCards from './components/SummaryCards';
import PortfolioTable from './components/PortfolioTable';
import PieChart from './components/PieChart';
import BarChart from './components/BarChart';
import AddHoldingModal from './components/AddHoldingModal';
import FixedDepositView from './components/FixedDepositView';
import GoldHoldingView from './components/GoldHoldingView';
import RealEstateView from './components/RealEstateView';
import InsuranceView from './components/InsuranceView';
import DocumentVaultView from './components/DocumentVaultView';
import PinLockScreen from './components/PinLockScreen';
import { isPinConfigured, isSessionVerified } from './utils/auth';
import { Portfolio, PortfolioName } from './types/portfolio';
import { formatINR, formatPercent, pnlColor } from './utils/formatters';
import { usePortfolioData } from './hooks/usePortfolioData';

type AssetTab = 'stocks' | 'fd' | 'gold' | 'real_estate' | 'insurance' | 'documents';

const familyIcons: Record<string, React.ReactNode> = {
  personal: <User size={15} />,
  mother: <Heart size={15} />,
  wife: <Users size={15} />,
};

const familyColors: Record<string, string> = {
  personal: 'bg-blue-600 text-white',
  mother: 'bg-rose-500 text-white',
  wife: 'bg-teal-500 text-white',
};

const assetTabs: { id: AssetTab; label: string; icon: React.ReactNode }[] = [
  { id: 'stocks', label: 'Stocks & ETFs', icon: <TrendingUp size={13} /> },
  { id: 'fd', label: 'Fixed Deposits', icon: <Landmark size={13} /> },
  { id: 'gold', label: 'Gold', icon: <Coins size={13} /> },
  { id: 'real_estate', label: 'Real Estate', icon: <HomeIcon size={13} /> },
  { id: 'insurance', label: 'Insurance', icon: <Shield size={13} /> },
  { id: 'documents', label: 'Documents', icon: <FolderOpen size={13} /> },
];

function getPortfolioByName(portfolios: Portfolio[], name: PortfolioName): Portfolio | null {
  if (name === 'all') return null;
  return portfolios.find((p) => p.name === name) ?? null;
}

function estimateTodayPnL(portfolio: Portfolio | null, all: Portfolio[]): number {
  const holdings = portfolio ? portfolio.holdings : all.flatMap((p) => p.holdings);
  return holdings.reduce((sum, h) => sum + (h.todayPnLPercent / 100) * h.currentValue, 0);
}

function getFamilyColor(name: string): string {
  return familyColors[name] ?? 'bg-violet-600 text-white';
}

function getFamilyIcon(name: string): React.ReactNode {
  return familyIcons[name] ?? <UserPlus size={15} />;
}

function classBreakdown(portfolios: Portfolio[], scope: Portfolio | null) {
  const target = scope ? [scope] : portfolios;
  const stocks = target.reduce((s, p) => s + p.holdings.reduce((a, h) => a + h.currentValue, 0), 0);
  const fd = target.reduce((s, p) => s + p.fixedDeposits.reduce((a, f) => a + (f.status === 'matured' ? Number(f.maturity_amount) : Number(f.principal_amount)), 0), 0);
  const gold = target.reduce((s, p) => s + p.goldHoldings.reduce((a, g) => a + Number(g.current_valuation), 0), 0);
  const realEstate = target.reduce((s, p) => s + p.realEstate.reduce((a, r) => a + Number(r.current_valuation), 0), 0);
  const insuranceCover = target.reduce((s, p) => s + p.insurances.reduce((a, i) => a + Number(i.sum_assured), 0), 0);
  const insurancePremium = target.reduce((s, p) => s + p.insurances.reduce((a, i) => a + Number(i.premium_amount), 0), 0);
  return { stocks, fd, gold, realEstate, insuranceCover, insurancePremium };
}

export default function App() {
  const [pinVerified, setPinVerified] = useState(() => !isPinConfigured() || isSessionVerified());
  const [activeTab, setActiveTab] = useState<PortfolioName>('all');
  const [activeAsset, setActiveAsset] = useState<AssetTab>('stocks');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [newFamilyLabel, setNewFamilyLabel] = useState('');
  const [newFamilyName, setNewFamilyName] = useState('');
  const [addingFamily, setAddingFamily] = useState(false);
  const [addFamilyError, setAddFamilyError] = useState('');
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string; label: string } | null>(null);
  const [renameLabel, setRenameLabel] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState('');

  const { portfolios, loadStatus, loadError, priceStatus, lastUpdated, failedSymbols, load, refreshPrices, addPortfolio, renamePortfolio, addAsset, updateAsset, deleteAsset } = usePortfolioData();

  const refreshPricesRef = useRef(refreshPrices);
  useEffect(() => {
    refreshPricesRef.current = refreshPrices;
  }, [refreshPrices]);

  useEffect(() => {
    load();
    const interval = setInterval(() => {
      refreshPricesRef.current();
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const portfolio = getPortfolioByName(portfolios, activeTab);
  const todayPnL = estimateTodayPnL(portfolio, portfolios);

  const liveTotals = {
    totalInvested: portfolios.reduce((s, p) => s + p.totalInvested, 0),
    totalCurrentValue: portfolios.reduce((s, p) => s + p.totalCurrentValue, 0),
    totalPnL: portfolios.reduce((s, p) => s + p.totalPnL, 0),
    get totalPnLPercent() { return this.totalInvested > 0 ? (this.totalPnL / this.totalInvested) * 100 : 0; },
  };

  const summaryData = portfolio
    ? { totalInvested: portfolio.totalInvested, totalCurrentValue: portfolio.totalCurrentValue, totalPnL: portfolio.totalPnL, totalPnLPercent: portfolio.totalPnLPercent, label: portfolio.label }
    : { totalInvested: liveTotals.totalInvested, totalCurrentValue: liveTotals.totalCurrentValue, totalPnL: liveTotals.totalPnL, totalPnLPercent: liveTotals.totalPnLPercent, label: 'Family' };

  const breakdown = classBreakdown(portfolios, portfolio);
  const breakdownSlices = [
    { label: 'Stocks', fullName: 'Stocks & ETFs', value: breakdown.stocks, color: '#3b82f6' },
    { label: 'FD', fullName: 'Fixed Deposits', value: breakdown.fd, color: '#6366f1' },
    { label: 'Gold', fullName: 'Gold Holdings', value: breakdown.gold, color: '#f59e0b' },
    { label: 'Realty', fullName: 'Real Estate', value: breakdown.realEstate, color: '#10b981' },
  ];

  const isLoadingDB = loadStatus === 'loading';
  const isLoadingPrices = priceStatus === 'loading';
  const isLoading = isLoadingDB || isLoadingPrices;

  const portfolioOptionsForModal = portfolios.map((p) => ({ name: p.name, label: p.label }));

  const tableDeleteHandler = (holdingId: string) => deleteAsset('stock', holdingId);
  const tableUpdateHandler = (holdingId: string, qty: number, avgPrice: number) => {
    const amountInvested = qty * avgPrice;
    return updateAsset('stock', holdingId, { qty, avgPrice, amountInvested });
  };

  async function handleAddFamily(e: React.FormEvent) {
    e.preventDefault();
    if (!newFamilyLabel.trim()) {
      setAddFamilyError('Display label is required');
      return;
    }
    const computedName = (newFamilyName.trim() || newFamilyLabel.trim()).toLowerCase().replace(/\s+/g, '-');
    setAddingFamily(true);
    setAddFamilyError('');
    try {
      await addPortfolio(computedName, newFamilyLabel.trim());
      setShowAddFamily(false);
      setNewFamilyLabel('');
      setNewFamilyName('');
    } catch (err) {
      setAddFamilyError(err instanceof Error ? err.message : 'Failed to add family member');
    } finally {
      setAddingFamily(false);
    }
  }

  async function handleRenamePortfolio(e: React.FormEvent) {
    e.preventDefault();
    if (!renameTarget || !renameLabel.trim()) {
      setRenameError('Display name is required');
      return;
    }
    setRenaming(true);
    setRenameError('');
    try {
      await renamePortfolio(renameTarget.id, renameLabel.trim());
      setRenameTarget(null);
      setRenameLabel('');
    } catch (err) {
      setRenameError(err instanceof Error ? err.message : 'Failed to rename');
    } finally {
      setRenaming(false);
    }
  }

  // PIN Lock Gate
  if (!pinVerified) {
    return <PinLockScreen onUnlock={() => setPinVerified(true)} />;
  }

  if (loadStatus === 'idle' || isLoadingDB) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <p className="text-sm text-slate-400">Loading portfolio data...</p>
      </div>
    );
  }

  if (loadStatus === 'error') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-4">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-base font-semibold text-slate-700">Failed to load portfolio data</p>
        {loadError && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2 max-w-md text-center">{loadError}</p>
        )}
        <button onClick={load} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
          Try Again
        </button>
      </div>
    );
  }

  const visiblePortfolio = portfolio;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        totalCurrentValue={summaryData.totalCurrentValue}
        totalPnLPercent={summaryData.totalPnLPercent}
        totalPnL={summaryData.totalPnL}
        status={priceStatus}
        lastUpdated={lastUpdated}
        onRefresh={refreshPrices}
      />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {priceStatus === 'error' && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>Could not reach Yahoo Finance. Showing last known data. Check your connection and try refreshing.</span>
          </div>
        )}

        {priceStatus === 'success' && failedSymbols.length > 0 && (
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl px-4 py-3 text-sm">
            <AlertCircle size={16} className="shrink-0 text-slate-400" />
            <span>
              Some symbols did not resolve on Yahoo Finance and show avg price instead:{' '}
              <span className="font-semibold">{failedSymbols.join(', ')}</span>
            </span>
          </div>
        )}

        {/* Family Tabs Row */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${activeTab === 'all'
              ? 'bg-slate-800 text-white shadow-md scale-[1.02]'
              : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
          >
            <LayoutDashboard size={15} />
            <span>Family Overview</span>
          </button>

          {portfolios.map((p) => {
            const isActive = activeTab === p.name;
            return (
              <div key={p.name} className="relative group flex items-center">
                <button
                  onClick={() => setActiveTab(p.name)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${isActive
                    ? getFamilyColor(p.name) + ' shadow-md scale-[1.02]'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    }`}
                >
                  {getFamilyIcon(p.name)}
                  <span>{p.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${isActive ? 'bg-white/20 text-white' : p.totalPnL >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    {formatPercent(p.totalPnLPercent, 1)}
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenameTarget({ id: p.id, name: p.name, label: p.label });
                    setRenameLabel(p.label);
                    setRenameError('');
                  }}
                  className="ml-1 w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-150 text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100"
                  title={`Rename ${p.label}`}
                >
                  <Pencil size={12} />
                </button>
              </div>
            );
          })}

          <button
            onClick={() => { setShowAddFamily(true); setAddFamilyError(''); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            <UserPlus size={15} />
            Add Family Member
          </button>
        </div>

        {/* Family Overview - drill-down cards */}
        {activeTab === 'all' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolios.map((p) => (
              <button
                key={p.name}
                onClick={() => setActiveTab(p.name)}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-left hover:shadow-md hover:border-slate-200 transition-all duration-150 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{p.label}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.totalPnL >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    {formatPercent(p.totalPnLPercent, 1)}
                  </span>
                </div>
                <p className={`text-xl font-bold text-slate-800 mb-1 transition-opacity ${isLoadingPrices ? 'opacity-40' : ''}`}>
                  {formatINR(p.totalCurrentValue)}
                </p>
                <p className="text-xs text-slate-400">Invested: {formatINR(p.totalInvested)}</p>
                <p className={`text-sm font-semibold mt-1 ${pnlColor(p.totalPnL)}`}>
                  {p.totalPnL >= 0 ? '+' : ''}{formatINR(p.totalPnL)} P&L
                </p>
                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-1 text-[10px] text-slate-500">
                  <div>
                    <p className="text-slate-400">Stocks</p>
                    <p className="font-semibold">{p.holdings.length}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">FDs</p>
                    <p className="font-semibold">{p.fixedDeposits.length}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Properties</p>
                    <p className="font-semibold">{p.realEstate.length}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Wealth Mosaic for All view */}
        {activeTab === 'all' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                <TrendingUp size={12} /> STOCKS
              </div>
              <p className="text-base font-bold text-slate-800 mt-1">{formatINR(breakdown.stocks)}</p>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                <Landmark size={12} /> FDs
              </div>
              <p className="text-base font-bold text-slate-800 mt-1">{formatINR(breakdown.fd)}</p>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                <Coins size={12} /> GOLD
              </div>
              <p className="text-base font-bold text-slate-800 mt-1">{formatINR(breakdown.gold)}</p>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                <HomeIcon size={12} /> REAL ESTATE
              </div>
              <p className="text-base font-bold text-slate-800 mt-1">{formatINR(breakdown.realEstate)}</p>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                <Shield size={12} /> INSURANCE COVER
              </div>
              <p className="text-base font-bold text-slate-800 mt-1">{formatINR(breakdown.insuranceCover)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{formatINR(breakdown.insurancePremium)}/yr premium</p>
            </div>
          </div>
        )}

        <SummaryCards
          totalInvested={summaryData.totalInvested}
          totalCurrentValue={summaryData.totalCurrentValue}
          totalPnL={summaryData.totalPnL}
          totalPnLPercent={summaryData.totalPnLPercent}
          todayPnL={todayPnL}
          label={summaryData.label}
          isLoading={isLoading}
        />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <PieChart slices={breakdownSlices} title={`Asset Class Breakdown — ${summaryData.label}`} />
          <BarChart portfolios={activeTab === 'all' ? portfolios : (visiblePortfolio ? [visiblePortfolio] : [])} />
        </div>

        {/* Asset class tabs for selected member */}
        {visiblePortfolio && (
          <>
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
              {assetTabs.map((a) => {
                const isActive = activeAsset === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => setActiveAsset(a.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${isActive
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                  >
                    {a.icon}
                    {a.label}
                  </button>
                );
              })}
            </div>

            {activeAsset === 'stocks' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold text-slate-700">{visiblePortfolio.label} — Stocks & ETFs</h2>
                  <div className="flex items-center gap-2">
                    {priceStatus === 'success' && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                        <Wifi size={11} />
                        Live prices
                      </span>
                    )}
                    {priceStatus === 'error' && (
                      <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                        <WifiOff size={11} />
                        Snapshot data
                      </span>
                    )}
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                      {visiblePortfolio.holdings.length} stocks &bull; Click column to sort
                    </span>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                    >
                      <Plus size={13} />
                      Add Holding
                    </button>
                  </div>
                </div>

                <PortfolioTable
                  holdings={visiblePortfolio.holdings}
                  totalInvested={visiblePortfolio.holdings.reduce((s, h) => s + h.amountInvested, 0)}
                  totalCurrentValue={visiblePortfolio.holdings.reduce((s, h) => s + h.currentValue, 0)}
                  totalPnL={visiblePortfolio.holdings.reduce((s, h) => s + h.unrealizedPnL, 0)}
                  totalPnLPercent={(() => {
                    const inv = visiblePortfolio.holdings.reduce((s, h) => s + h.amountInvested, 0);
                    const pnl = visiblePortfolio.holdings.reduce((s, h) => s + h.unrealizedPnL, 0);
                    return inv > 0 ? (pnl / inv) * 100 : 0;
                  })()}
                  onDelete={tableDeleteHandler}
                  onUpdate={tableUpdateHandler}
                />
              </div>
            )}

            {activeAsset === 'fd' && (
              <FixedDepositView
                fixedDeposits={visiblePortfolio.fixedDeposits}
                documents={visiblePortfolio.documents}
                portfolioName={visiblePortfolio.name}
                onAdd={addAsset}
                onUpdate={updateAsset}
                onDelete={deleteAsset}
              />
            )}

            {activeAsset === 'gold' && (
              <GoldHoldingView
                goldHoldings={visiblePortfolio.goldHoldings}
                documents={visiblePortfolio.documents}
                portfolioName={visiblePortfolio.name}
                onAdd={addAsset}
                onUpdate={updateAsset}
                onDelete={deleteAsset}
              />
            )}

            {activeAsset === 'real_estate' && (
              <RealEstateView
                realEstate={visiblePortfolio.realEstate}
                documents={visiblePortfolio.documents}
                portfolioName={visiblePortfolio.name}
                onAdd={addAsset}
                onUpdate={updateAsset}
                onDelete={deleteAsset}
              />
            )}

            {activeAsset === 'insurance' && (
              <InsuranceView
                insurances={visiblePortfolio.insurances}
                documents={visiblePortfolio.documents}
                portfolioName={visiblePortfolio.name}
                onAdd={addAsset}
                onUpdate={updateAsset}
                onDelete={deleteAsset}
              />
            )}

            {activeAsset === 'documents' && (
              <DocumentVaultView
                portfolio={visiblePortfolio}
                portfolioName={visiblePortfolio.name}
                onAdd={addAsset}
                onDelete={deleteAsset}
              />
            )}
          </>
        )}

        {/* All portfolios — per-member asset views */}
        {activeTab === 'all' && (
          <>
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
              {assetTabs.map((a) => {
                const isActive = activeAsset === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => setActiveAsset(a.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${isActive
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                  >
                    {a.icon}
                    {a.label}
                  </button>
                );
              })}
            </div>

            {activeAsset === 'stocks' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold text-slate-700">All Stock Holdings</h2>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                  >
                    <Plus size={13} />
                    Add Holding
                  </button>
                </div>
                <div className="space-y-6">
                  {portfolios.map((p) => (
                    <div key={p.name}>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-sm font-bold text-slate-600">{p.label}</h3>
                        <div className="h-px flex-1 bg-slate-200" />
                        <span className={`text-xs font-bold ${pnlColor(p.totalPnL)}`}>
                          {formatPercent(p.totalPnLPercent, 2)} ({formatINR(p.totalPnL)})
                        </span>
                      </div>
                      {p.holdings.length === 0 ? (
                        <div className="bg-white border border-dashed border-slate-200 rounded-xl py-6 text-center text-xs text-slate-400">
                          No stock holdings yet.
                        </div>
                      ) : (
                        <PortfolioTable
                          holdings={p.holdings}
                          totalInvested={p.holdings.reduce((s, h) => s + h.amountInvested, 0)}
                          totalCurrentValue={p.holdings.reduce((s, h) => s + h.currentValue, 0)}
                          totalPnL={p.holdings.reduce((s, h) => s + h.unrealizedPnL, 0)}
                          totalPnLPercent={(() => {
                            const inv = p.holdings.reduce((s, h) => s + h.amountInvested, 0);
                            const pnl = p.holdings.reduce((s, h) => s + h.unrealizedPnL, 0);
                            return inv > 0 ? (pnl / inv) * 100 : 0;
                          })()}
                          onDelete={tableDeleteHandler}
                          onUpdate={tableUpdateHandler}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeAsset === 'fd' && (
              <div className="space-y-8">
                {portfolios.map((p) => (
                  <div key={p.name}>
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-sm font-bold text-slate-600">{p.label}</h3>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>
                    <FixedDepositView
                      fixedDeposits={p.fixedDeposits}
                      documents={p.documents}
                      portfolioName={p.name}
                      onAdd={addAsset}
                      onUpdate={updateAsset}
                      onDelete={deleteAsset}
                    />
                  </div>
                ))}
              </div>
            )}

            {activeAsset === 'gold' && (
              <div className="space-y-8">
                {portfolios.map((p) => (
                  <div key={p.name}>
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-sm font-bold text-slate-600">{p.label}</h3>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>
                    <GoldHoldingView
                      goldHoldings={p.goldHoldings}
                      documents={p.documents}
                      portfolioName={p.name}
                      onAdd={addAsset}
                      onUpdate={updateAsset}
                      onDelete={deleteAsset}
                    />
                  </div>
                ))}
              </div>
            )}

            {activeAsset === 'real_estate' && (
              <div className="space-y-8">
                {portfolios.map((p) => (
                  <div key={p.name}>
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-sm font-bold text-slate-600">{p.label}</h3>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>
                    <RealEstateView
                      realEstate={p.realEstate}
                      documents={p.documents}
                      portfolioName={p.name}
                      onAdd={addAsset}
                      onUpdate={updateAsset}
                      onDelete={deleteAsset}
                    />
                  </div>
                ))}
              </div>
            )}

            {activeAsset === 'insurance' && (
              <div className="space-y-8">
                {portfolios.map((p) => (
                  <div key={p.name}>
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-sm font-bold text-slate-600">{p.label}</h3>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>
                    <InsuranceView
                      insurances={p.insurances}
                      documents={p.documents}
                      portfolioName={p.name}
                      onAdd={addAsset}
                      onUpdate={updateAsset}
                      onDelete={deleteAsset}
                    />
                  </div>
                ))}
              </div>
            )}

            {activeAsset === 'documents' && (
              <div className="space-y-8">
                {portfolios.map((p) => (
                  <div key={p.name}>
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-sm font-bold text-slate-600">{p.label}</h3>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>
                    <DocumentVaultView
                      portfolio={p}
                      portfolioName={p.name}
                      onAdd={addAsset}
                      onDelete={deleteAsset}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Family Wealth Tracker
            {lastUpdated && (
              <span className="ml-2 text-slate-300">
                — Last updated: {lastUpdated.toLocaleTimeString('en-IN')}
              </span>
            )}
          </p>
          <button
            onClick={refreshPrices}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-500 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={12} className={isLoadingPrices ? 'animate-spin' : ''} />
            Refresh prices
          </button>
        </div>
      </footer>

      {showAddModal && (
        <AddHoldingModal
          onClose={() => setShowAddModal(false)}
          onAdd={async (data) => {
            await addAsset('stock', data.portfolioName, data as unknown as Record<string, unknown>);
          }}
          portfolioOptions={portfolioOptionsForModal}
          defaultPortfolio={activeTab === 'all' ? portfolioOptionsForModal[0]?.name : activeTab}
        />
      )}

      {showAddFamily && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !addingFamily && setShowAddFamily(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-800">Add Family Member</h3>
                <p className="text-xs text-slate-400 mt-0.5">A new portfolio shell will appear in the family tabs</p>
              </div>
              <button
                onClick={() => !addingFamily && setShowAddFamily(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddFamily} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Display Label</label>
                <input
                  type="text"
                  placeholder="e.g. Father's Portfolio"
                  value={newFamilyLabel}
                  onChange={(e) => setNewFamilyLabel(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Machine Key <span className="text-slate-400 font-normal">(optional, lowercase no spaces)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. father (auto-derived from label if empty)"
                  value={newFamilyName}
                  onChange={(e) => setNewFamilyName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
                />
              </div>

              {addFamilyError && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{addFamilyError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={addingFamily}
                  onClick={() => setShowAddFamily(false)}
                  className="flex-1 border border-slate-200 text-slate-600 font-semibold text-sm rounded-xl py-2.5 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingFamily}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold text-sm rounded-xl py-2.5 hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {addingFamily ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                  {addingFamily ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !renaming && setRenameTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-800">Rename Portfolio</h3>
                <p className="text-xs text-slate-400 mt-0.5">Change the display name for this family member</p>
              </div>
              <button
                onClick={() => !renaming && setRenameTarget(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleRenamePortfolio} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Display Name</label>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Father's Portfolio"
                  value={renameLabel}
                  onChange={(e) => setRenameLabel(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
                />
              </div>

              {renameError && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{renameError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={renaming}
                  onClick={() => setRenameTarget(null)}
                  className="flex-1 border border-slate-200 text-slate-600 font-semibold text-sm rounded-xl py-2.5 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renaming || !renameLabel.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold text-sm rounded-xl py-2.5 hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {renaming ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {renaming ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
