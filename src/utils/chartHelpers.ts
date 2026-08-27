import { ASSET_COLORS } from './assetColors';

export interface ChartSlice {
  label: string;
  fullName: string;
  value: number;
  color: string;
}

/**
 * Returns breakdown slices ordered with alternating warm/cool hues
 * (Stocks/Blue -> Gold/Yellow -> FD/Cyan -> RD/Rust -> SIP/Violet -> Realty/Green)
 * to eliminate adjacent gradient sweeps on donut and bar rings.
 */
export function getBreakdownSlices(breakdown: {
  stocks: number;
  fd: number;
  rd: number;
  sip: number;
  gold: number;
  realEstate: number;
}): ChartSlice[] {
  return [
    { label: 'Stocks', fullName: 'Stocks & ETFs', value: breakdown.stocks, color: ASSET_COLORS.stocks },
    { label: 'Gold', fullName: 'Gold Holdings', value: breakdown.gold, color: ASSET_COLORS.gold },
    { label: 'FD', fullName: 'Fixed Deposits', value: breakdown.fd, color: ASSET_COLORS.fd },
    { label: 'RD', fullName: 'Recurring Deposits', value: breakdown.rd, color: ASSET_COLORS.rd },
    { label: 'SIP', fullName: 'SIP Mutual Funds', value: breakdown.sip, color: ASSET_COLORS.sip },
    { label: 'Realty', fullName: 'Real Estate', value: breakdown.realEstate, color: ASSET_COLORS.realEstate },
  ];
}
export default getBreakdownSlices;
