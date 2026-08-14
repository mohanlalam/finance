import { describe, it, expect, beforeEach } from 'vitest';
import { logActivity, getActivities, clearActivities } from '../activityLogger';

describe('activityLogger', () => {
  beforeEach(async () => {
    await clearActivities();
  });

  it('records and fetches activity log items', async () => {
    await logActivity('add', 'stocks', 'Added RELIANCE stock', 'Ram');
    await logActivity('update', 'fd', 'Updated HDFC FD', 'Priya');

    const logs = await getActivities();
    expect(logs.length).toBeGreaterThanOrEqual(2);
    expect(logs[0].title).toBe('Updated HDFC FD');
    expect(logs[1].title).toBe('Added RELIANCE stock');
  });

  it('clears all logged activities', async () => {
    await logActivity('delete', 'gold', 'Deleted Gold Coin');
    await clearActivities();

    const logs = await getActivities();
    expect(logs).toEqual([]);
  });
});
