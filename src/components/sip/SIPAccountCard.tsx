import React from 'react';
import { SIPAccount, DocumentMetadata } from '../../types/portfolio';
import { formatINR, getDocumentUrl, formatPercent } from '../../utils/formatters';
import { getSIPInvestedAmount, getSIPEffectiveValue } from '../../utils/sipUtils';
import { FileText, Edit2, Trash2, StickyNote, Wifi } from 'lucide-react';

interface SIPAccountCardProps {
  account: SIPAccount;
  documents: DocumentMetadata[];
  onOpenEdit: (account: SIPAccount) => void;
  onConfirmDelete: (account: SIPAccount) => void;
}

export function SIPAccountCard({
  account,
  documents,
  onOpenEdit,
  onConfirmDelete,
}: SIPAccountCardProps) {
  const invested = getSIPInvestedAmount(account);
  const currentVal = getSIPEffectiveValue(account);
  const profitLoss = currentVal - invested;
  const plPercent = invested > 0 ? (profitLoss / invested) * 100 : 0;
  const isProfit = profitLoss >= 0;

  const linkedDocs = documents.filter(
    (d) => d.asset_type === 'sip' && d.asset_id === account.id
  );

  return (
    <div className="py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all px-4 sm:px-6 rounded-2xl border border-transparent hover:border-slate-100 dark:hover:border-slate-700/50">
      <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
        {/* Left Side: Meta & Dates */}
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" aria-hidden="true" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{account.fund_name}</h4>
            {account.mf_scheme_code ? (
              account.navIsStale ? (
                <span className="text-[10px] font-bold bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-500 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <Wifi size={10} className="text-amber-500 animate-pulse" /> Stale (AMFI Offline)
                </span>
              ) : (
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-500 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <Wifi size={10} /> Live
                </span>
              )
            ) : (
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-900/30 dark:text-slate-400 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                Manual
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 flex-wrap">
            <span>Started: <strong className="text-slate-500 dark:text-slate-400">{account.start_date}</strong></span>
            {account.next_sip_date && (
              <>
                <span className="hidden sm:inline">&bull;</span>
                <span>Next SIP: <strong className="text-slate-500 dark:text-slate-400">{account.next_sip_date}</strong></span>
              </>
            )}
            {account.units > 0 && (
              <>
                <span className="hidden sm:inline">&bull;</span>
                <span>Units: <strong className="text-slate-500 dark:text-slate-400">{account.units.toFixed(3)}</strong></span>
              </>
            )}
          </div>

          {account.notes && (
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-slate-50 dark:bg-slate-900/40 px-2.5 py-1 rounded-lg w-fit mt-1">
              <StickyNote size={11} className="text-slate-400" />
              {account.notes}
            </p>
          )}
        </div>

        {/* Center: Balances & CAGR */}
        <div className="flex items-center gap-6 sm:gap-10 text-right flex-wrap sm:flex-nowrap shrink-0">
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Monthly SIP</p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{formatINR(account.monthly_sip)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Expected CAGR</p>
            <p className="text-xs font-extrabold text-sky-650 dark:text-sky-400">+{account.expected_cagr}%</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Est. Invested</p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{formatINR(invested)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Current Value</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{formatINR(currentVal)}</p>
            {invested > 0 && (
              <p className={`text-[10px] font-bold mt-0.5 ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                {isProfit ? '+' : ''}{formatPercent(plPercent, 2)} ({formatINR(profitLoss)})
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Action Buttons & Attachments */}
        <div className="flex items-center gap-2 shrink-0">
          {linkedDocs.length > 0 && (
            <a
              href={getDocumentUrl(linkedDocs[0].file_path)}
              target="_blank"
              rel="noopener noreferrer"
              title={`View Attached Document: ${linkedDocs[0].name}`}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 transition-colors"
            >
              <FileText size={15} />
            </a>
          )}
          <button
            onClick={() => onOpenEdit(account)}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors hover:text-sky-600"
            aria-label="Edit SIP"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onConfirmDelete(account)}
            className="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center justify-center text-slate-400 dark:text-slate-500 transition-colors hover:text-red-600"
            aria-label="Delete SIP"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(
  SIPAccountCard,
  (prev, next) =>
    prev.account.id === next.account.id &&
    prev.account.monthly_sip === next.account.monthly_sip &&
    prev.account.expected_cagr === next.account.expected_cagr &&
    prev.account.units === next.account.units &&
    prev.account.start_date === next.account.start_date &&
    prev.account.next_sip_date === next.account.next_sip_date &&
    prev.account.fallback_valuation === next.account.fallback_valuation &&
    prev.account.navIsStale === next.account.navIsStale &&
    prev.account.notes === next.account.notes &&
    prev.documents.length === next.documents.length
);
