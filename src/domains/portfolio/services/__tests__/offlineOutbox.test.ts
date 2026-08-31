import { describe, it, expect, beforeEach } from 'vitest';
import { offlineOutboxService } from '../offlineOutboxService';

describe('OfflineOutboxService', () => {
  beforeEach(async () => {
    // Clear outbox queue before each test
    const queue = await offlineOutboxService.getQueue();
    for (const item of queue) {
      await offlineOutboxService.remove(item.id);
    }
  });

  it('enqueues mutations and increments pending count', async () => {
    expect(await offlineOutboxService.getPendingCount()).toBe(0);

    const m1 = await offlineOutboxService.enqueue('ADD_PORTFOLIO', { name: 'alice', label: 'Alice' });
    expect(m1.id).toBeDefined();
    expect(m1.type).toBe('ADD_PORTFOLIO');
    expect(await offlineOutboxService.getPendingCount()).toBe(1);

    const m2 = await offlineOutboxService.enqueue('ADD_ASSET', {
      assetType: 'fd',
      portfolioName: 'alice',
      payload: { bank_name: 'HDFC Bank', principal_amount: 100000 },
    });
    expect(m2.type).toBe('ADD_ASSET');
    expect(await offlineOutboxService.getPendingCount()).toBe(2);

    const queue = await offlineOutboxService.getQueue();
    expect(queue.length).toBe(2);
    expect(queue[0].id).toBe(m1.id);
    expect(queue[1].id).toBe(m2.id);
  });

  it('removes individual mutations by id', async () => {
    const m1 = await offlineOutboxService.enqueue('DELETE_ASSET', { assetType: 'gold', id: 'g-123' });
    const m2 = await offlineOutboxService.enqueue('RENAME_PORTFOLIO', { id: 'p-1', newLabel: 'Bob' });
    expect(await offlineOutboxService.getPendingCount()).toBe(2);

    await offlineOutboxService.remove(m1.id);
    expect(await offlineOutboxService.getPendingCount()).toBe(1);

    const remaining = await offlineOutboxService.getQueue();
    expect(remaining[0].id).toBe(m2.id);

    await offlineOutboxService.remove(m2.id);
    expect(await offlineOutboxService.getPendingCount()).toBe(0);
  });

  it('notifies subscribers when mutations are queued and removed', async () => {
    const counts: number[] = [];
    const unsubscribe = offlineOutboxService.subscribe((count) => {
      counts.push(count);
    });

    const m = await offlineOutboxService.enqueue('ADD_PORTFOLIO', { name: 'test', label: 'Test' });
    await offlineOutboxService.remove(m.id);

    unsubscribe();
    expect(counts).toEqual([1, 0]);
  });
});
