import { calculateXIRR, CashFlow } from '../domains/performance/calculations/xirr';


self.onmessage = (e: MessageEvent<{ taskId?: string; cashflows: CashFlow[] }>) => {
  const { taskId, cashflows } = e.data || {};
  try {
    const rate = calculateXIRR(cashflows || []);
    self.postMessage({ taskId, rate });
  } catch (err) {
    self.postMessage({ taskId, error: err instanceof Error ? err.message : String(err) });
  }
};
