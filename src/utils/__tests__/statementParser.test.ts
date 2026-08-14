import { describe, it, expect } from 'vitest';
import { parseBrokerStatement } from '../statementParser';

describe('statementParser', () => {
  it('parses Zerodha Console holdings CSV format correctly', () => {
    const csv = `Instrument,ISIN,Qty.,Avg. cost,Cur. val,P&L
TCS,INE467B01029,10,3500.50,38000,3000
INFY-EQ,INE009A01021,25,1450.00,37500,1250
Total,,,,75500,4250`;

    const result = parseBrokerStatement(csv, 'Ram');
    expect(result.broker).toBe('Zerodha Console');
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].symbol).toBe('TCS');
    expect(result.rows[0].shares).toBe(10);
    expect(result.rows[0].avg_cost).toBe(3500.5);
    expect(result.rows[0].notes).toBe('ISIN: INE467B01029');
    expect(result.rows[1].symbol).toBe('INFY'); // -EQ stripped
    expect(result.rows[1].shares).toBe(25);
  });

  it('parses Groww investments CSV format correctly', () => {
    const csv = `Stock Name,Symbol,Shares,Avg Price,Current Value
Reliance Industries,RELIANCE,15,₹2450.00,₹38000
HDFC Bank,HDFCBANK,50,₹1620.50,₹82000`;

    const result = parseBrokerStatement(csv, 'Priya');
    expect(result.broker).toBe('Groww Investments');
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].symbol).toBe('RELIANCE');
    expect(result.rows[0].shares).toBe(15);
    expect(result.rows[0].avg_cost).toBe(2450);
  });

  it('parses Generic CSV with fallback columns', () => {
    const csv = `ticker,quantity,buy_price
ITC,100,420
WIPRO,50,480`;

    const result = parseBrokerStatement(csv);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].symbol).toBe('ITC');
    expect(result.rows[0].shares).toBe(100);
    expect(result.rows[0].avg_cost).toBe(420);
  });

  it('handles empty input gracefully', () => {
    const result = parseBrokerStatement('');
    expect(result.rows).toHaveLength(0);
    expect(result.errors).toContain('File is empty');
  });
});
