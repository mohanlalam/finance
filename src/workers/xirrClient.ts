import { calculateXIRR, CashFlow } from '../domains/performance/calculations/xirr';

let workerInstance: Worker | null = null;
let taskIdCounter = 0;
const pendingTasks = new Map<string, { resolve: (rate: number) => void; reject: (err: Error) => void }>();

function getWorker(): Worker | null {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    return null;
  }
  if (!workerInstance) {
    try {
      workerInstance = new Worker(new URL('./xirr.worker.ts', import.meta.url), { type: 'module' });
      workerInstance.onmessage = (e: MessageEvent<{ taskId?: string; rate?: number; error?: string }>) => {
        const { taskId, rate, error } = e.data || {};
        if (taskId && pendingTasks.has(taskId)) {
          const deferred = pendingTasks.get(taskId)!;
          pendingTasks.delete(taskId);
          if (error) {
            deferred.reject(new Error(error));
          } else {
            deferred.resolve(rate ?? 0);
          }
        }
      };
      workerInstance.onerror = (err) => {
        // Reject all pending tasks and fallback to sync on error
        for (const [id, deferred] of pendingTasks.entries()) {
          deferred.reject(new Error(`Worker error: ${err.message}`));
          pendingTasks.delete(id);
        }
        workerInstance?.terminate();
        workerInstance = null;
      };
    } catch {
      workerInstance = null;
    }
  }
  return workerInstance;
}

/**
 * Calculates XIRR off the main thread using Web Worker, with seamless sync fallback.
 */
export async function calculateXIRRAsync(cashflows: CashFlow[]): Promise<number> {
  const worker = getWorker();
  if (!worker) {
    // Synchronous fallback in non-worker environments (JSDOM/Node/unsupported browsers)
    return calculateXIRR(cashflows);
  }

  return new Promise<number>((resolve) => {
    const taskId = `xirr_${++taskIdCounter}_${Date.now()}`;
    const timeout = setTimeout(() => {
      if (pendingTasks.has(taskId)) {
        pendingTasks.delete(taskId);
        // Fallback to synchronous calculation on timeout
        resolve(calculateXIRR(cashflows));
      }
    }, 2000);

    pendingTasks.set(taskId, {
      resolve: (rate) => {
        clearTimeout(timeout);
        resolve(rate);
      },
      reject: (err) => {
        clearTimeout(timeout);
        // Fallback to sync on worker reject
        console.warn('[xirr worker fallback]', err);
        resolve(calculateXIRR(cashflows));
      },
    });

    worker.postMessage({ taskId, cashflows });
  });
}
