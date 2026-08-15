import { calculateXIRR, CashFlow } from '../utils/performance';

self.onmessage = (e: MessageEvent<{ taskId?: string; cashflows: CashFlow[] }>) => {
  const { taskId, cashflows } = e.data || {};
  try {
    const rate = calculateXIRR(cashflows || []);
    self.postMessage({ taskId, rate });
  } catch (err) {
    self.postMessage({ taskId, error: err instanceof Error ? err.message : String(err) });
  }
};
