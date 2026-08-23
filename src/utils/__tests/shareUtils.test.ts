import { describe, it, expect, vi } from 'vitest';
import { shareHolding, sharePortfolioSummary } from '../shareUtils';
import { Holding } from '../../types/portfolio';

describe('shareUtils', () => {
  it('formats holding text with single plus sign for gains without duplicate ++', async () => {
    let capturedText = '';
    const mockWriteText = vi.fn().mockImplementation((text: string) => {
      capturedText = text;
      return Promise.resolve();
    });

    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
      share: undefined,
    });

    const holding: Holding = {
      id: '1',
      sno: 1,
      stockName: 'Tata Motors',
      ticker: 'TATAMOTORS',
      yahooSymbol: 'TATAMOTORS.NS',
      qty: 10,
      avgPrice: 500,
      ltp: 600,
      amountInvested: 5000,
      currentValue: 6000,
      unrealizedPnL: 1000,
      pnlPercent: 20,
      todayPnLPercent: 0,
    };

    await shareHolding(holding);

    expect(capturedText).toContain('+₹1,000.00 (+20.00%)');
    expect(capturedText).not.toContain('++');
  });

  it('formats portfolio summary with single plus sign without duplicate ++', async () => {
    let capturedText = '';
    const mockWriteText = vi.fn().mockImplementation((text: string) => {
      capturedText = text;
      return Promise.resolve();
    });

    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
      share: undefined,
    });

    const summary = {
      name: 'Family Portfolio',
      totalValue: 500000,
      totalPnL: 50000,
      totalPnLPercent: 11.11,
    };

    await sharePortfolioSummary(summary);

    expect(capturedText).toContain('+₹50,000.00 (+11.11%)');
    expect(capturedText).not.toContain('++');
  });
});
