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

  /** Reset any stuck mutation queue — call this if a previous mutation timed out. */
  reset(): void {
    this.mutationQueue = Promise.resolve();
    this.isMutating = false;
    this.notify();
  }

  async runMutation<T>(fn: () => Promise<T>, timeoutMs = 20000): Promise<T> {
    const nextPromise = new Promise<T>((resolve, reject) => {
      const execute = async () => {
        this.isMutating = true;
        this.notify();

        // Hard timeout so a stuck upstream promise never permanently blocks the queue
        const timer = setTimeout(() => {
          reject(new Error('Mutation timed out. Please try again.'));
          this.isMutating = false;
          this.notify();
          // Reset queue so future mutations are not blocked
          this.mutationQueue = Promise.resolve();
        }, timeoutMs);

        try {
          const res = await fn();
          clearTimeout(timer);
          resolve(res);
        } catch (err) {
          clearTimeout(timer);
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
