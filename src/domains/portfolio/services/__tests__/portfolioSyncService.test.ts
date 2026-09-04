import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PortfolioSyncService } from '../portfolioSyncService';

describe('PortfolioSyncService Mutex & Concurrency Controls', () => {
  let syncService: PortfolioSyncService;

  beforeEach(() => {
    syncService = new PortfolioSyncService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('executes fast-path mutation and notifies subscriber of mutating state transitions', async () => {
    const states: boolean[] = [];
    const unsubscribe = syncService.subscribe((isMutating) => {
      states.push(isMutating);
    });

    const result = await syncService.runMutation(async () => {
      return { success: true, id: 'asset_123' };
    });

    expect(result).toEqual({ success: true, id: 'asset_123' });
    expect(syncService.getIsMutating()).toBe(false);
    // Initial: false, On start: true, On finish: false
    expect(states).toEqual([false, true, false]);

    unsubscribe();
  });

  it('queues concurrent mutations sequentially in FIFO order', async () => {
    const executionOrder: number[] = [];

    const p1 = syncService.runMutation(async () => {
      await new Promise((res) => setTimeout(res, 20));
      executionOrder.push(1);
      return 'one';
    });

    const p2 = syncService.runMutation(async () => {
      executionOrder.push(2);
      return 'two';
    });

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toBe('one');
    expect(r2).toBe('two');
    expect(executionOrder).toEqual([1, 2]);
    expect(syncService.getIsMutating()).toBe(false);
  });

  it('rejects with timeout when a mutation exceeds the specified timeout window', async () => {
    const slowMutation = syncService.runMutation(
      () => new Promise((resolve) => setTimeout(() => resolve('done'), 1000)),
      50 // 50ms timeout
    );

    await expect(slowMutation).rejects.toThrow('Mutation timed out. Please try again.');
    expect(syncService.getIsMutating()).toBe(false);
  });

  it('allows subsequent mutations to succeed after a prior mutation times out (no deadlock)', async () => {
    // 1. Stuck mutation that times out after 50ms
    const hungMutation = syncService.runMutation(
      () => new Promise((resolve) => setTimeout(resolve, 500)),
      50 // 50ms timeout
    );

    await expect(hungMutation).rejects.toThrow('Mutation timed out');

    // 2. Next mutation must succeed immediately without deadlocking
    const secondResult = await syncService.runMutation(async () => {
      return 'recovered_successfully';
    });

    expect(secondResult).toBe('recovered_successfully');
    expect(syncService.getIsMutating()).toBe(false);
  });

  it('resets stuck state and mutation queue when reset() is called explicitly', async () => {
    const states: boolean[] = [];
    syncService.subscribe((isMutating) => states.push(isMutating));

    // Force a hanging mutation
    syncService.runMutation(() => new Promise(() => {})).catch(() => {});

    // Allow microtask queue to run execute()
    await new Promise((r) => setTimeout(r, 10));

    expect(syncService.getIsMutating()).toBe(true);

    // Manual emergency escape hatch
    syncService.reset();

    expect(syncService.getIsMutating()).toBe(false);
    expect(states[states.length - 1]).toBe(false);

    // New mutation can run cleanly
    const res = await syncService.runMutation(async () => 42);
    expect(res).toBe(42);
  });

  it('triggers onLateSettle listener when a slow mutation resolves after client timeout', async () => {
    let lateResult: unknown = null;
    const unsubscribe = syncService.onLateSettle((result) => {
      lateResult = result;
    });

    let resolveMutation!: (value: unknown) => void;
    const deferredPromise = new Promise((res) => {
      resolveMutation = res;
    });

    // Run mutation with 30ms timeout
    const mutationPromise = syncService.runMutation(async () => deferredPromise, 30);

    // Initial client expectation: times out after 30ms
    await expect(mutationPromise).rejects.toThrow('Mutation timed out. Please try again.');
    expect(lateResult).toBeNull();

    // Now server operation finally settles in the background
    resolveMutation({ status: 'db_write_success', id: 'holding_999' });

    // Allow event loop ticks for execution
    await new Promise((r) => setTimeout(r, 20));

    expect(lateResult).toEqual({ status: 'db_write_success', id: 'holding_999' });

    unsubscribe();
  });
});
