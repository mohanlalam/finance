import { calculateXIRR, CashFlow } from '../domains/performance/calculations/xirr';
import { logger } from '../infrastructure/logging/logger';

let workerInstance: Worker | null = null;
let taskIdCounter = 0;
const pendingTasks = new Map<string, { resolve: (rate: number) => void; reject: (err: Error) => void }>();

export const FRAME_BUDGET_MS = 16.0; // 60 FPS frame duration threshold

/**
 * Executes calculateXIRR synchronously while logging frame-drop telemetry
 * if calculation duration exceeds the 16.0ms budget.
 */
export function calculateXIRRSyncWithTelemetry(cashflows: CashFlow[], label = 'sync-fallback'): number {
  const start = typeof performance !== 'undefined' ? performance.now() : 0;
  const rate = calculateXIRR(cashflows);
  if (start > 0 && typeof performance !== 'undefined') {
    const elapsed = performance.now() - start;
    if (elapsed > FRAME_BUDGET_MS) {
      logger.warn(
        `[XIRR Telemetry] Main-thread calculation exceeded ${FRAME_BUDGET_MS}ms budget (${label}): ${elapsed.toFixed(2)}ms for ${cashflows.length} cashflows`
      );
    }
  }
  return rate;
}

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
    return calculateXIRRSyncWithTelemetry(cashflows, 'no-worker-env');
  }

  return new Promise<number>((resolve) => {
    const taskId = `xirr_${++taskIdCounter}_${Date.now()}`;
    const timeout = setTimeout(() => {
      if (pendingTasks.has(taskId)) {
        pendingTasks.delete(taskId);
        // Fallback to synchronous calculation on timeout
        logger.warn(`[XIRR Worker] Worker calculation timed out for task ${taskId}; using sync fallback`);
        resolve(calculateXIRRSyncWithTelemetry(cashflows, 'worker-timeout'));
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
        logger.warn(`[XIRR Worker] Worker rejected task ${taskId}:`, { error: String(err) });
        resolve(calculateXIRRSyncWithTelemetry(cashflows, 'worker-rejected'));
      },
    });

    worker.postMessage({ taskId, cashflows });
  });
}
