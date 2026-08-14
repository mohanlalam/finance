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
    { label: 'Stocks', fullName: 'Stocks & ETFs', value: breakdown.stocks, color: '#387ed1' },
    { label: 'FD', fullName: 'Fixed Deposits', value: breakdown.fd, color: '#f59e0b' },
    { label: 'SIP', fullName: 'SIP Mutual Funds', value: breakdown.sip, color: '#00b074' },
    { label: 'Gold', fullName: 'Gold Holdings', value: breakdown.gold, color: '#eab308' },
    { label: 'RD', fullName: 'Recurring Deposits', value: breakdown.rd, color: '#f43f5e' },
    { label: 'Realty', fullName: 'Real Estate', value: breakdown.realEstate, color: '#8b5cf6' },
  ];
}
export default getBreakdownSlices;
