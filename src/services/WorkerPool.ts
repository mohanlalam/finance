/**
 * WorkerPool service manager.
 * Provides persistent background Web Worker singletons for CPU-heavy financial math calculations
 * (Newton-Raphson XIRR solvers).
 * Eliminates 15-40ms thread creation overhead per calculation tick.
 */

type WorkerTaskCallback = (data: any) => void;

class FinancialWorkerPool {
  private xirrWorker: Worker | null = null;
  private xirrCallbacks = new Map<string, WorkerTaskCallback>();

  private getXirrWorker(): Worker | null {
    if (typeof window === 'undefined' || !window.Worker) return null;
    if (!this.xirrWorker) {
      try {
        this.xirrWorker = new Worker(new URL('../workers/xirr.worker.ts', import.meta.url), { type: 'module' });
        this.xirrWorker.onmessage = (e) => {
          const { taskId, rate } = e.data || {};
          if (taskId && this.xirrCallbacks.has(taskId)) {
            const cb = this.xirrCallbacks.get(taskId)!;
            this.xirrCallbacks.delete(taskId);
            cb(rate);
          }
        };
        this.xirrWorker.onerror = (err) => {
          console.warn('[WorkerPool xirr error]:', err);
        };
      } catch (err) {
        console.warn('[WorkerPool xirr init error]:', err);
        this.xirrWorker = null;
      }
    }
    return this.xirrWorker;
  }

  public runXirrAsync(payload: any): Promise<number | null> | null {
    const worker = this.getXirrWorker();
    if (!worker) return null;

    return new Promise((resolve) => {
      const taskId = Math.random().toString(36).substring(7);
      this.xirrCallbacks.set(taskId, resolve);
      worker.postMessage({ taskId, ...payload });
    });
  }
}

export const workerPool = new FinancialWorkerPool();
export default workerPool;
