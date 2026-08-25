import {
  IPortfolioRepository,
  DBPortfolioData,
} from '../../../domains/portfolio/repositories/IPortfolioRepository';
import {
  Portfolio,
  Holding,
  FixedDeposit,
  RDAccount,
  SIPAccount,
  GoldHolding,
  RealEstate,
  Insurance,
  DocumentMetadata,
  AssetPayload,
} from '../../../types/portfolio';
import { NetWorthSnapshot } from '../../../domains/portfolio/calculations/netWorth';
import { invokeFunction, AppApiError } from '../../../utils/apiClient';
import { getFDInvestedAmount, getFDEffectiveValue } from '../../../utils/formatters';
import { getRDInvestedAmount, getRDEffectiveValue } from '../../..//domains/assets/rd/calculations/rdCompounding';
import { getSIPInvestedAmount, getSIPEffectiveValue } from '../../../domains/assets/sip/calculations/sipValuation';
import { RepositoryError, ValidationError } from '../../../shared/errors/AppError';
import { sortPortfolios } from '../../../domains/portfolio/calculations/portfolioOrdering';


interface DBHolding {
  id: string;
  portfolio_id: string;
  sno: number;
  stock_name: string;
  ticker: string;
  yahoo_symbol: string;
  qty: number;
  avg_price: number;
  week_low_52: number;
  week_high_52: number;
  amount_invested: number;
  cached_ltp?: number | null;
  cached_today_pct?: number | null;
  created_at?: string;
}

interface DBPortfolio {
  id: string;
  name: string;
  label: string;
  created_at?: string;
}

interface DBData {
  portfolios?: DBPortfolio[];
  holdings?: DBHolding[];
  fixed_deposits?: FixedDeposit[];
  rd_accounts?: RDAccount[];
  sip_accounts?: SIPAccount[];
  gold_holdings?: GoldHolding[];
  real_estate?: RealEstate[];
  insurances?: Insurance[];
  documents?: DocumentMetadata[];
  net_worth_history?: NetWorthSnapshot[];
}

const VALID_ASSET_TYPES = new Set([
  'stock',
  'stocks',
  'holding',
  'holdings',
  'fd',
  'fixed_deposit',
  'fixed_deposits',
  'rd',
  'rd_account',
  'rd_accounts',
  'sip',
  'sip_account',
  'sip_accounts',
  'gold',
  'gold_holding',
  'gold_holdings',
  'real_estate',
  'insurance',
  'insurances',
  'document',
  'documents',
  'portfolio',
  'portfolios',
]);

function validateMutationInput(assetType: string, id?: string, payload?: Record<string, unknown>) {
  if (!VALID_ASSET_TYPES.has(assetType)) {
    throw new ValidationError(`Invalid asset type '${assetType}'`);
  }
  if (id !== undefined && (!id || typeof id !== 'string' || !id.trim())) {
    throw new ValidationError('Valid Asset ID is required for mutation');
  }
  if (payload) {
    for (const [key, val] of Object.entries(payload)) {
      if (typeof val === 'number' && (isNaN(val) || !isFinite(val))) {
        throw new ValidationError(`Invalid number for field '${key}'`);
      }
    }
  }
}

function dbToHolding(h: DBHolding): Holding {
  const ltp = h.cached_ltp !== undefined && h.cached_ltp !== null ? Number(h.cached_ltp) : h.avg_price;
  const todayPnLPercent =
    h.cached_today_pct !== undefined && h.cached_today_pct !== null ? Number(h.cached_today_pct) : 0;
  const currentValue = h.qty * ltp;
  const unrealizedPnL = currentValue - h.amount_invested;
  const pnlPercent = h.amount_invested > 0 ? (unrealizedPnL / h.amount_invested) * 100 : 0;

  return {
    id: h.id || h.ticker || String(h.sno),
    sno: h.sno,
    stockName: h.stock_name,
    ticker: h.ticker,
    yahooSymbol: h.yahoo_symbol,
    qty: h.qty,
    avgPrice: h.avg_price,
    weekLow52: h.week_low_52,
    weekHigh52: h.week_high_52,
    ltp,
    amountInvested: h.amount_invested,
    unrealizedPnL,
    pnlPercent,
    todayPnLPercent,
    currentValue,
    created_at: h.created_at,
  };
}

function recalcPortfolioTotals(
  holdings: Holding[],
  fds: FixedDeposit[],
  rdAccounts: RDAccount[],
  sipAccounts: SIPAccount[],
  gold: GoldHolding[],
  realEstate: RealEstate[]
) {
  let stockInvested = 0;
  let stockCurrent = 0;
  for (let i = 0; i < holdings.length; i++) {
    const h = holdings[i];
    stockInvested += h.amountInvested;
    stockCurrent += h.currentValue;
  }

  let fdInvested = 0;
  let fdCurrent = 0;
  for (let i = 0; i < fds.length; i++) {
    const f = fds[i];
    fdInvested += getFDInvestedAmount(f);
    fdCurrent += getFDEffectiveValue(f);
  }

  let rdInvested = 0;
  let rdCurrent = 0;
  for (let i = 0; i < rdAccounts.length; i++) {
    const r = rdAccounts[i];
    rdInvested += getRDInvestedAmount(r);
    rdCurrent += getRDEffectiveValue(r);
  }

  let sipInvested = 0;
  let sipCurrent = 0;
  for (let i = 0; i < sipAccounts.length; i++) {
    const s = sipAccounts[i];
    sipInvested += getSIPInvestedAmount(s);
    sipCurrent += getSIPEffectiveValue(s);
  }

  let goldInvested = 0;
  let goldCurrent = 0;
  for (let i = 0; i < gold.length; i++) {
    const g = gold[i];
    goldInvested += Number(g.purchase_price) || 0;
    goldCurrent += Number(g.current_valuation) || 0;
  }

  let reInvested = 0;
  let reCurrent = 0;
  for (let i = 0; i < realEstate.length; i++) {
    const r = realEstate[i];
    reInvested += Number(r.purchase_price) || 0;
    reCurrent += Number(r.current_valuation) || 0;
  }

  const totalInvested =
    stockInvested + fdInvested + rdInvested + sipInvested + goldInvested + reInvested;
  const totalCurrentValue =
    stockCurrent + fdCurrent + rdCurrent + sipCurrent + goldCurrent + reCurrent;
  const totalPnL = totalCurrentValue - totalInvested;
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  return {
    totalInvested,
    totalCurrentValue,
    totalPnL,
    totalPnLPercent,
    stocksValue: stockCurrent,
    fdValue: fdCurrent,
    rdValue: rdCurrent,
    sipValue: sipCurrent,
    goldValue: goldCurrent,
    realEstateValue: reCurrent,
  };
}

function buildPortfolio(
  dbP: DBPortfolio,
  holdings: Holding[],
  fds: FixedDeposit[],
  rdAccounts: RDAccount[],
  sipAccounts: SIPAccount[],
  gold: GoldHolding[],
  realEstate: RealEstate[],
  insurances: Insurance[],
  docs: DocumentMetadata[]
): Portfolio {
  const fdsWithTs = fds.map((f) => {
    const ts = f.maturityDateTs ?? (f.maturity_date ? new Date(f.maturity_date).getTime() : NaN);
    return {
      ...f,
      maturityDateTs: isNaN(ts) ? undefined : ts,
    };
  });

  const insurancesWithTs = insurances.map((i) => {
    const ts = i.renewalDateTs ?? (i.renewal_date ? new Date(i.renewal_date).getTime() : NaN);
    return {
      ...i,
      renewalDateTs: isNaN(ts) ? undefined : ts,
    };
  });

  const docsWithTs = docs.map((d) => {
    const ts = d.expiryDateTs ?? (d.expiry_date ? new Date(d.expiry_date).getTime() : NaN);
    return {
      ...d,
      expiryDateTs: isNaN(ts) ? undefined : ts,
    };
  });

  const totals = recalcPortfolioTotals(
    holdings,
    fdsWithTs,
    rdAccounts,
    sipAccounts,
    gold,
    realEstate
  );

  return {
    id: dbP.id,
    name: dbP.name,
    label: dbP.label,
    created_at: dbP.created_at,
    holdings,
    fixedDeposits: fdsWithTs,
    rdAccounts,
    sipAccounts,
    goldHoldings: gold,
    realEstate,
    insurances: insurancesWithTs,
    documents: docsWithTs,
    ...totals,
  };
}

export class SupabasePortfolioRepository implements IPortfolioRepository {
  async fetchAllData(): Promise<DBPortfolioData> {
    try {
      const data = await invokeFunction<DBData>('holdings-crud?action=list');
      if (!data) {
        return { portfolios: [], netWorthHistory: [] };
      }

      const dbPortfolios = data.portfolios || [];
      const dbHoldings = data.holdings || [];
      const dbFDs = data.fixed_deposits || [];
      const dbRDs = data.rd_accounts || [];
      const dbSIPs = data.sip_accounts || [];
      const dbGold = data.gold_holdings || [];
      const dbRealEstate = data.real_estate || [];
      const dbInsurances = data.insurances || [];
      const dbDocs = data.documents || [];
      const netWorthHistory = data.net_worth_history || [];

      // Group entities by portfolio_id
      const holdingsByPid = new Map<string, Holding[]>();
      dbHoldings.forEach((h) => {
        const list = holdingsByPid.get(h.portfolio_id) || [];
        list.push(dbToHolding(h));
        holdingsByPid.set(h.portfolio_id, list);
      });

      const fdsByPid = new Map<string, FixedDeposit[]>();
      dbFDs.forEach((f) => {
        const list = fdsByPid.get(f.portfolio_id) || [];
        list.push(f);
        fdsByPid.set(f.portfolio_id, list);
      });

      const rdsByPid = new Map<string, RDAccount[]>();
      dbRDs.forEach((r) => {
        const list = rdsByPid.get(r.portfolio_id) || [];
        list.push(r);
        rdsByPid.set(r.portfolio_id, list);
      });

      const sipsByPid = new Map<string, SIPAccount[]>();
      dbSIPs.forEach((s) => {
        const list = sipsByPid.get(s.portfolio_id) || [];
        list.push(s);
        sipsByPid.set(s.portfolio_id, list);
      });

      const goldByPid = new Map<string, GoldHolding[]>();
      dbGold.forEach((g) => {
        const list = goldByPid.get(g.portfolio_id) || [];
        list.push(g);
        goldByPid.set(g.portfolio_id, list);
      });

      const reByPid = new Map<string, RealEstate[]>();
      dbRealEstate.forEach((re) => {
        const list = reByPid.get(re.portfolio_id) || [];
        list.push(re);
        reByPid.set(re.portfolio_id, list);
      });

      const insByPid = new Map<string, Insurance[]>();
      dbInsurances.forEach((i) => {
        const list = insByPid.get(i.portfolio_id) || [];
        list.push(i);
        insByPid.set(i.portfolio_id, list);
      });

      const docsByPid = new Map<string, DocumentMetadata[]>();
      dbDocs.forEach((d) => {
        const list = docsByPid.get(d.portfolio_id) || [];
        list.push(d);
        docsByPid.set(d.portfolio_id, list);
      });

      const portfolios: Portfolio[] = sortPortfolios(
        dbPortfolios.map((p) =>
          buildPortfolio(
            p,
            holdingsByPid.get(p.id) || [],
            fdsByPid.get(p.id) || [],
            rdsByPid.get(p.id) || [],
            sipsByPid.get(p.id) || [],
            goldByPid.get(p.id) || [],
            reByPid.get(p.id) || [],
            insByPid.get(p.id) || [],
            docsByPid.get(p.id) || []
          )
        )
      );

      return { portfolios, netWorthHistory };
    } catch (err) {
      if (err instanceof AppApiError) throw err;
      throw new RepositoryError('Failed to fetch portfolio data from Supabase', err);
    }
  }

  async addPortfolio(name: string, label: string): Promise<void> {
    const trimmedName = (name || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const trimmedLabel = (label || '').trim();
    if (!trimmedName || !trimmedLabel) {
      throw new ValidationError('Portfolio name and label are required');
    }
    if (trimmedLabel.length > 50) {
      throw new ValidationError('Portfolio label cannot exceed 50 characters');
    }

    try {
      await invokeFunction<unknown>('holdings-crud?action=add_portfolio', {
        method: 'POST',
        body: { name: trimmedName, label: trimmedLabel },
      });
    } catch (err) {
      if (err instanceof AppApiError) throw err;
      throw new RepositoryError('Failed to add portfolio', err);
    }
  }

  async renamePortfolio(id: string, newLabel: string): Promise<void> {
    const trimmedLabel = (newLabel || '').trim();
    if (!id || !trimmedLabel) {
      throw new ValidationError('Portfolio ID and non-empty label are required');
    }
    if (trimmedLabel.length > 50) {
      throw new ValidationError('Portfolio label cannot exceed 50 characters');
    }

    try {
      await invokeFunction<unknown>('holdings-crud?action=update', {
        method: 'PATCH',
        body: {
          asset_type: 'portfolio',
          id,
          label: trimmedLabel,
        },
      });
    } catch (err) {
      if (err instanceof AppApiError) throw err;
      throw new RepositoryError('Failed to rename portfolio', err);
    }
  }

  async deletePortfolio(id: string): Promise<void> {
    if (!id) throw new ValidationError('Portfolio ID is required for deletion');
    try {
      await invokeFunction<unknown>('holdings-crud?action=delete', {
        method: 'DELETE',
        body: {
          asset_type: 'portfolio',
          id,
        },
      });
    } catch (err) {
      if (err instanceof AppApiError) throw err;
      throw new RepositoryError('Failed to delete portfolio', err);
    }
  }

  async addAsset(
    assetType: string,
    portfolioName: string,
    payload: AssetPayload
  ): Promise<{ id?: string } | undefined> {
    const recordPayload = (payload as unknown) as Record<string, unknown>;
    validateMutationInput(assetType, undefined, recordPayload);
    if (!portfolioName || !portfolioName.trim()) {
      throw new ValidationError('Target portfolio name is required');
    }

    try {
      const finalPayload = { ...payload } as Record<string, unknown>;
      const res = await invokeFunction<{ data?: { id?: string } }>('holdings-crud?action=add', {
        method: 'POST',
        body: {
          asset_type: assetType,
          portfolioName,
          ...finalPayload,
        },
      });
      return res?.data;
    } catch (err) {
      if (err instanceof AppApiError) throw err;
      throw new RepositoryError(`Failed to add ${assetType}`, err);
    }
  }

  async updateAsset(
    assetType: string,
    id: string,
    payload: Partial<AssetPayload>
  ): Promise<void> {
    const recordPayload = (payload as unknown) as Record<string, unknown>;
    validateMutationInput(assetType, id, recordPayload);

    try {
      const finalPayload = { ...payload } as Record<string, unknown>;
      await invokeFunction<unknown>('holdings-crud?action=update', {
        method: 'PATCH',
        body: {
          asset_type: assetType,
          id,
          ...finalPayload,
        },
      });
    } catch (err) {
      if (err instanceof AppApiError) throw err;
      throw new RepositoryError(`Failed to update ${assetType}`, err);
    }
  }

  async deleteAsset(assetType: string, id: string): Promise<void> {
    validateMutationInput(assetType, id);
    try {
      await invokeFunction<unknown>('holdings-crud?action=delete', {
        method: 'DELETE',
        body: {
          asset_type: assetType,
          id,
        },
      });
    } catch (err) {
      if (err instanceof AppApiError) throw err;
      throw new RepositoryError(`Failed to delete ${assetType}`, err);
    }
  }
}

export const supabasePortfolioRepository = new SupabasePortfolioRepository();
