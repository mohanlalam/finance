import { calculateXIRR, CashFlow } from '../utils/performance';

self.onmessage = (e: MessageEvent<{ cashflows: CashFlow[] }>) => {
  const { cashflows } = e.data;
  try {
    const result = calculateXIRR(cashflows);
    self.postMessage({ result });
  } catch (err) {
    self.postMessage({ error: err instanceof Error ? err.message : String(err) });
  }
};
