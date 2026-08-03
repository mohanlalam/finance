import { Portfolio } from '../types/portfolio';
import { formatINR, formatPercent, getFDEffectiveValue } from './formatters';
import { estimateTodayPnL } from './portfolioCalcs';
import { getSIPEffectiveValue } from './sipUtils';
import { getRDEffectiveValue } from './rdUtils';

export function generatePDFReport(portfolios: Portfolio[], label: string = 'Family') {
  const totalInvested = portfolios.reduce((sum, p) => sum + p.totalInvested, 0);
  const totalCurrentValue = portfolios.reduce((sum, p) => sum + p.totalCurrentValue, 0);
  const totalPnL = portfolios.reduce((sum, p) => sum + p.totalPnL, 0);
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  
  const todayPnL = estimateTodayPnL(null, portfolios);

  const stocksValue = portfolios.reduce((sum, p) => sum + p.stocksValue, 0);
  const fdValue = portfolios.reduce((sum, p) => sum + p.fdValue, 0);
  const rdValue = portfolios.reduce((sum, p) => sum + p.rdValue, 0);
  const sipValue = portfolios.reduce((sum, p) => sum + p.sipValue, 0);
  const goldValue = portfolios.reduce((sum, p) => sum + p.goldValue, 0);
  const reValue = portfolios.reduce((sum, p) => sum + p.realEstateValue, 0);
  
  const equityValue = stocksValue + sipValue;
  const depositsValue = fdValue + rdValue;

  const sign = (val: number) => val >= 0 ? '+' : '';

  let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Portfolio Report - ${label}</title>
      <style>
        @media print {
          body { padding: 0 !important; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
          color: #333; 
          line-height: 1.5; 
          margin: 0; 
          padding: 20px 40px; 
          font-size: 12px; 
        }
        h1, h2, h3, h4 { margin-top: 0; }
        h1 { margin-bottom: 4px; font-size: 24px; color: #111; }
        h2 { color: #666; font-size: 14px; font-weight: normal; margin-bottom: 0; }
        h3 { border-bottom: 1px solid #eee; padding-bottom: 4px; margin-top: 24px; margin-bottom: 12px; color: #444; font-size: 16px; }
        
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11px; }
        th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; }
        th { background-color: #f8fafc; font-weight: 600; color: #475569; }
        tr:nth-child(even) { background-color: #fcfcfc; }
        
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .positive { color: #34C759; }
        .negative { color: #ff3b30; }
        
        .header { 
          border-bottom: 2px solid #333; 
          padding-bottom: 12px; 
          margin-bottom: 24px; 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-end; 
        }
        .header-meta { text-align: right; color: #666; font-size: 11px; }
        
        .summary-grid { 
          display: grid; 
          grid-template-columns: repeat(4, 1fr); 
          gap: 12px; 
          margin-bottom: 24px; 
        }
        .summary-box { 
          border: 1px solid #e2e8f0; 
          background-color: #f8fafc;
          padding: 12px; 
          border-radius: 6px; 
        }
        .summary-label { 
          font-size: 10px; 
          color: #64748b; 
          text-transform: uppercase; 
          font-weight: bold;
          letter-spacing: 0.5px;
          margin-bottom: 4px; 
        }
        .summary-value { font-size: 18px; font-weight: bold; color: #0f172a; }
        
        .alloc-table { width: 60%; }
        
        .footer {
          margin-top: 40px; 
          text-align: center; 
          font-size: 10px; 
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
          padding-top: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>Family Portfolio Tracker</h1>
          <h2>${label} Report</h2>
        </div>
        <div class="header-meta">
          Generated on: ${new Date().toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      
      <div class="summary-grid">
        <div class="summary-box">
          <div class="summary-label">Net Worth</div>
          <div class="summary-value">${formatINR(totalCurrentValue)}</div>
        </div>
        <div class="summary-box">
          <div class="summary-label">Total Invested</div>
          <div class="summary-value">${formatINR(totalInvested)}</div>
        </div>
        <div class="summary-box">
          <div class="summary-label">Total Return</div>
          <div class="summary-value ${totalPnL >= 0 ? 'positive' : 'negative'}">
            ${sign(totalPnL)}${formatINR(totalPnL)} (${sign(totalPnLPercent)}${totalPnLPercent.toFixed(2)}%)
          </div>
        </div>
        <div class="summary-box">
          <div class="summary-label">Today's Return</div>
          <div class="summary-value ${todayPnL >= 0 ? 'positive' : 'negative'}">
            ${sign(todayPnL)}${formatINR(todayPnL)}
          </div>
        </div>
      </div>
      
      <h3>Asset Allocation</h3>
      <table class="alloc-table">
        <tr>
          <th>Asset Class</th>
          <th class="text-right">Value</th>
          <th class="text-right">% of Total</th>
        </tr>
        ${[
          { label: 'Equity (Stocks & SIPs)', value: equityValue },
          { label: 'Fixed & Recurring Deposits', value: depositsValue },
          { label: 'Gold', value: goldValue },
          { label: 'Real Estate', value: reValue }
        ].filter(a => a.value > 0).sort((a, b) => b.value - a.value).map(a => `
          <tr>
            <td>${a.label}</td>
            <td class="text-right">${formatINR(a.value)}</td>
            <td class="text-right">${((a.value / totalCurrentValue) * 100).toFixed(1)}%</td>
          </tr>
        `).join('')}
      </table>
  `;

  // Stocks
  const allStocks = portfolios.flatMap(p => p.holdings.map(h => ({ ...h, portfolioLabel: p.label })));
  if (allStocks.length > 0) {
    html += `
      <h3>Stock Holdings</h3>
      <table>
        <tr>
          <th>Portfolio</th>
          <th>Ticker</th>
          <th>Name</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Avg Price</th>
          <th class="text-right">LTP</th>
          <th class="text-right">Current Value</th>
          <th class="text-right">P&L</th>
          <th class="text-right">P&L %</th>
        </tr>
        ${allStocks.map(h => `
          <tr>
            <td>${h.portfolioLabel}</td>
            <td><strong>${h.ticker}</strong></td>
            <td>${h.stockName}</td>
            <td class="text-right">${h.qty}</td>
            <td class="text-right">${formatINR(h.avgPrice)}</td>
            <td class="text-right">${formatINR(h.ltp)}</td>
            <td class="text-right"><strong>${formatINR(h.currentValue)}</strong></td>
            <td class="text-right ${h.unrealizedPnL >= 0 ? 'positive' : 'negative'}">
              ${sign(h.unrealizedPnL)}${formatINR(h.unrealizedPnL)}
            </td>
            <td class="text-right ${h.pnlPercent >= 0 ? 'positive' : 'negative'}">
              ${formatPercent(h.pnlPercent)}
            </td>
          </tr>
        `).join('')}
      </table>
    `;
  }

  // FDs
  const allFDs = portfolios.flatMap(p => p.fixedDeposits.map(f => ({ ...f, portfolioLabel: p.label })));
  if (allFDs.length > 0) {
    html += `
      <h3>Fixed Deposits</h3>
      <table>
        <tr>
          <th>Portfolio</th>
          <th>Bank</th>
          <th class="text-right">Principal</th>
          <th class="text-right">Rate</th>
          <th>Start Date</th>
          <th>Maturity Date</th>
          <th class="text-right">Current Value</th>
        </tr>
        ${allFDs.map(f => `
          <tr>
            <td>${f.portfolioLabel}</td>
            <td>${f.bank_name}</td>
            <td class="text-right">${formatINR(Number(f.principal_amount))}</td>
            <td class="text-right">${f.interest_rate}%</td>
            <td>${f.start_date}</td>
            <td>${f.maturity_date || 'N/A'}</td>
            <td class="text-right"><strong>${formatINR(getFDEffectiveValue(f))}</strong></td>
          </tr>
        `).join('')}
      </table>
    `;
  }
  
  // RDs
  const allRDs = portfolios.flatMap(p => (p.rdAccounts || []).map(r => ({ ...r, portfolioLabel: p.label })));
  if (allRDs.length > 0) {
    html += `
      <h3>Recurring Deposits</h3>
      <table>
        <tr>
          <th>Portfolio</th>
          <th>Bank</th>
          <th class="text-right">Monthly Deposit</th>
          <th class="text-right">Rate</th>
          <th>Maturity Date</th>
          <th class="text-right">Current Value</th>
        </tr>
        ${allRDs.map(r => `
          <tr>
            <td>${r.portfolioLabel}</td>
            <td>${r.bank_name}</td>
            <td class="text-right">${formatINR(Number(r.monthly_deposit))}</td>
            <td class="text-right">${r.interest_rate}%</td>
            <td>${r.maturity_date || 'N/A'}</td>
            <td class="text-right"><strong>${formatINR(getRDEffectiveValue(r))}</strong></td>
          </tr>
        `).join('')}
      </table>
    `;
  }
  
  // SIPs
  const allSIPs = portfolios.flatMap(p => (p.sipAccounts || []).map(s => ({ ...s, portfolioLabel: p.label })));
  if (allSIPs.length > 0) {
    html += `
      <h3>Mutual Fund SIPs</h3>
      <table>
        <tr>
          <th>Portfolio</th>
          <th>Scheme</th>
          <th class="text-right">Monthly SIP</th>
          <th class="text-right">Units</th>
          <th class="text-right">Live NAV</th>
          <th class="text-right">Current Value</th>
        </tr>
        ${allSIPs.map(s => `
          <tr>
            <td>${s.portfolioLabel}</td>
            <td>${s.fund_name}</td>
            <td class="text-right">${formatINR(Number(s.monthly_sip))}</td>
            <td class="text-right">${s.units || 0}</td>
            <td class="text-right">${s.liveNav ? formatINR(s.liveNav) : 'N/A'}</td>
            <td class="text-right"><strong>${formatINR(getSIPEffectiveValue(s))}</strong></td>
          </tr>
        `).join('')}
      </table>
    `;
  }

  // Gold
  const allGold = portfolios.flatMap(p => p.goldHoldings.map(g => ({ ...g, portfolioLabel: p.label })));
  if (allGold.length > 0) {
    html += `
      <h3>Gold Holdings</h3>
      <table>
        <tr>
          <th>Portfolio</th>
          <th>Item</th>
          <th>Purity</th>
          <th class="text-right">Weight (g)</th>
          <th class="text-right">Purchase Price</th>
          <th class="text-right">Current Valuation</th>
        </tr>
        ${allGold.map(g => `
          <tr>
            <td>${g.portfolioLabel}</td>
            <td>${g.item_name}</td>
            <td>${g.purity}</td>
            <td class="text-right">${g.weight_grams}</td>
            <td class="text-right">${formatINR(Number(g.purchase_price))}</td>
            <td class="text-right"><strong>${formatINR(Number(g.current_valuation))}</strong></td>
          </tr>
        `).join('')}
      </table>
    `;
  }

  // Real Estate
  const allRE = portfolios.flatMap(p => p.realEstate.map(r => ({ ...r, portfolioLabel: p.label })));
  if (allRE.length > 0) {
    html += `
      <h3>Real Estate</h3>
      <table>
        <tr>
          <th>Portfolio</th>
          <th>Property</th>
          <th>Type</th>
          <th>Location</th>
          <th class="text-right">Purchase Price</th>
          <th class="text-right">Current Valuation</th>
        </tr>
        ${allRE.map(r => `
          <tr>
            <td>${r.portfolioLabel}</td>
            <td>${r.property_name}</td>
            <td style="text-transform: capitalize;">${r.property_type}</td>
            <td>${r.location || '-'}</td>
            <td class="text-right">${formatINR(Number(r.purchase_price))}</td>
            <td class="text-right"><strong>${formatINR(Number(r.current_valuation))}</strong></td>
          </tr>
        `).join('')}
      </table>
    `;
  }

  // Insurance
  const allInsurance = portfolios.flatMap(p => p.insurances.map(i => ({ ...i, portfolioLabel: p.label })));
  if (allInsurance.length > 0) {
    html += `
      <h3>Insurance Policies</h3>
      <table>
        <tr>
          <th>Portfolio</th>
          <th>Policy Name</th>
          <th>Provider</th>
          <th>Type</th>
          <th class="text-right">Sum Assured</th>
          <th class="text-right">Premium</th>
          <th>Renewal Date</th>
        </tr>
        ${allInsurance.map(i => `
          <tr>
            <td>${i.portfolioLabel}</td>
            <td>${i.policy_name}</td>
            <td>${i.provider}</td>
            <td style="text-transform: capitalize;">${i.insurance_type}</td>
            <td class="text-right">${formatINR(Number(i.sum_assured))}</td>
            <td class="text-right">${formatINR(Number(i.premium_amount))}</td>
            <td>${i.renewal_date || 'N/A'}</td>
          </tr>
        `).join('')}
      </table>
    `;
  }

  html += `
      <div class="footer">
        <p>This report is auto-generated by Family Portfolio Tracker.</p>
        <p>Prices and valuations are approximate and subject to market risks. Not to be used for taxation purposes.</p>
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        }
      </script>
    </body>
    </html>
  `;
  
  return html;
}

export function openPDFReportInNewTab(portfolios: Portfolio[], label?: string) {
  const html = generatePDFReport(portfolios, label);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
