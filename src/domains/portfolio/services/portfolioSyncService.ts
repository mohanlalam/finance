/**
 * Serialized Promise Queue Mutex to prevent race conditions during rapid user mutations.
 */
export class PortfolioSyncService {
  private isMutating = false;
  private mutationQueue: Promise<unknown> = Promise.resolve();
  private listeners: Set<(isMutating: boolean) => void> = new Set();

  subscribe(listener: (isMutating: boolean) => void): () => void {
    this.listeners.add(listener);
    listener(this.isMutating);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this.isMutating));
  }

  getIsMutating(): boolean {
    return this.isMutating;
  }

  async runMutation<T>(fn: () => Promise<T>): Promise<T> {
    const nextPromise = new Promise<T>((resolve, reject) => {
      const execute = async () => {
        this.isMutating = true;
        this.notify();
        try {
          const res = await fn();
          resolve(res);
        } catch (err) {
          reject(err);
        } finally {
          this.isMutating = false;
          this.notify();
        }
      };

      this.mutationQueue.then(execute, execute);
    });

    const queuedPromise = nextPromise.catch(() => {}).finally(() => {
      if (this.mutationQueue === queuedPromise) {
        this.mutationQueue = Promise.resolve();
      }
    });
    this.mutationQueue = queuedPromise;
    return nextPromise;
  }
}

export const portfolioSyncService = new PortfolioSyncService();
