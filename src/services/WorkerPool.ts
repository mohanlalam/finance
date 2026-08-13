/**
 * WorkerPool service manager.
 * Provides persistent background Web Worker singletons for CPU-heavy financial math calculations
 * (Health Scoring, Newton-Raphson XIRR, and Asset Rebalancing).
 * Eliminates 15-40ms thread creation overhead per calculation tick.
 */

type WorkerTaskCallback = (data: any) => void;

class FinancialWorkerPool {
  private healthWorker: Worker | null = null;
  private rebalanceWorker: Worker | null = null;
  private xirrWorker: Worker | null = null;

  private healthCallbacks = new Map<string, WorkerTaskCallback>();
  private rebalanceCallbacks = new Map<string, WorkerTaskCallback>();
  private xirrCallbacks = new Map<string, WorkerTaskCallback>();

  private getHealthWorker(): Worker | null {
    if (typeof window === 'undefined' || !window.Worker) return null;
    if (!this.healthWorker) {
      try {
        this.healthWorker = new Worker(new URL('../workers/healthScore.worker.ts', import.meta.url), { type: 'module' });
        this.healthWorker.onmessage = (e) => {
          const { taskId, result } = e.data || {};
          if (taskId && this.healthCallbacks.has(taskId)) {
            const cb = this.healthCallbacks.get(taskId)!;
            this.healthCallbacks.delete(taskId);
            cb(result);
          }
        };
        this.healthWorker.onerror = (err) => {
          console.warn('[WorkerPool healthScore error]:', err);
        };
      } catch (err) {
        console.warn('[WorkerPool healthScore init error]:', err);
        this.healthWorker = null;
      }
    }
    return this.healthWorker;
  }

  private getRebalanceWorker(): Worker | null {
    if (typeof window === 'undefined' || !window.Worker) return null;
    if (!this.rebalanceWorker) {
      try {
        this.rebalanceWorker = new Worker(new URL('../workers/rebalancing.worker.ts', import.meta.url), { type: 'module' });
        this.rebalanceWorker.onmessage = (e) => {
          const { taskId, result } = e.data || {};
          if (taskId && this.rebalanceCallbacks.has(taskId)) {
            const cb = this.rebalanceCallbacks.get(taskId)!;
            this.rebalanceCallbacks.delete(taskId);
            cb(result);
          }
        };
        this.rebalanceWorker.onerror = (err) => {
          console.warn('[WorkerPool rebalancing error]:', err);
        };
      } catch (err) {
        console.warn('[WorkerPool rebalancing init error]:', err);
        this.rebalanceWorker = null;
      }
    }
    return this.rebalanceWorker;
  }

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

  public runHealthScoreAsync(payload: any): Promise<any> | null {
    const worker = this.getHealthWorker();
    if (!worker) return null;

    return new Promise((resolve) => {
      const taskId = Math.random().toString(36).substring(7);
      this.healthCallbacks.set(taskId, resolve);
      worker.postMessage({ taskId, ...payload });
    });
  }

  public runRebalancingAsync(payload: any): Promise<any> | null {
    const worker = this.getRebalanceWorker();
    if (!worker) return null;

    return new Promise((resolve) => {
      const taskId = Math.random().toString(36).substring(7);
      this.rebalanceCallbacks.set(taskId, resolve);
      worker.postMessage({ taskId, ...payload });
    });
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
