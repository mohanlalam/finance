export interface ChartSlice {
  label: string;
  fullName: string;
  value: number;
  color: string;
}

export function getBreakdownSlices(breakdown: {
  stocks: number;
  fd: number;
  rd: number;
  sip: number;
  gold: number;
  realEstate: number;
}): ChartSlice[] {
  return [
    { label: 'Stocks', fullName: 'Stocks & ETFs', value: breakdown.stocks, color: '#3b82f6' },
    { label: 'FD', fullName: 'Fixed Deposits', value: breakdown.fd, color: '#6366f1' },
    { label: 'RD', fullName: 'Recurring Deposits', value: breakdown.rd, color: '#ec4899' },
    { label: 'SIP', fullName: 'SIP Mutual Funds', value: breakdown.sip, color: '#0ea5e9' },
    { label: 'Gold', fullName: 'Gold Holdings', value: breakdown.gold, color: '#f59e0b' },
    { label: 'Realty', fullName: 'Real Estate', value: breakdown.realEstate, color: '#10b981' },
  ];
}
export default getBreakdownSlices;
