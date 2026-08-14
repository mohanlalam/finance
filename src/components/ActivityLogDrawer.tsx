import React, { useState, useEffect, useCallback } from 'react';
import { ActivityEntry, getActivities, clearActivities } from '../utils/activityLogger';
import { Clock, Plus, Trash2, Edit2, CheckCircle2 } from './icons/AppIcons';
import Modal from './Modal';
import { Button } from './ui/Button';

interface ActivityLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ActivityLogDrawer({ isOpen, onClose }: ActivityLogDrawerProps) {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const logs = await getActivities();
    setActivities(logs);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, fetchLogs]);

  const handleClear = async () => {
    await clearActivities();
    setActivities([]);
  };

  function getActionBadge(action: ActivityEntry['action']) {
    switch (action) {
      case 'add':
        return (
          <span className="w-6 h-6 rounded-full bg-[var(--positive-soft)] text-[var(--positive)] flex items-center justify-center">
            <Plus size={12} />
          </span>
        );
      case 'update':
        return (
          <span className="w-6 h-6 rounded-full bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] flex items-center justify-center">
            <Edit2 size={12} />
          </span>
        );
      case 'delete':
        return (
          <span className="w-6 h-6 rounded-full bg-[var(--negative-soft)] text-[var(--negative)] flex items-center justify-center">
            <Trash2 size={12} />
          </span>
        );
    }
  }

  function formatTime(isoStr: string) {
    const d = new Date(isoStr);
    return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Activity & Audit History">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <Clock size={14} />
            <span>Recent additions, updates, and removals</span>
          </div>
          {activities.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-xs text-[var(--negative)] hover:bg-[var(--negative-soft)]"
            >
              Clear Log
            </Button>
          )}
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-[var(--text-tertiary)]">Loading audit trail...</div>
        ) : activities.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <CheckCircle2 size={20} />
            </div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">No recent activities</p>
            <p className="text-xs text-[var(--text-tertiary)]">Your asset creations and modifications will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)] max-h-[60vh] overflow-y-auto pr-1">
            {activities.map((item) => (
              <div key={item.id} className="py-3 flex items-start gap-3">
                {getActionBadge(item.action)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{item.title}</p>
                    <span className="text-[10px] text-[var(--text-tertiary)] shrink-0">{formatTime(item.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.portfolioName && (
                      <span className="text-[10px] font-medium text-[var(--accent-blue)] bg-[var(--accent-blue-soft)] px-1.5 py-0.5 rounded">
                        {item.portfolioName}
                      </span>
                    )}
                    <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">
                      {item.assetType.replace('_', ' ')}
                    </span>
                    {item.details && (
                      <span className="text-[10px] text-[var(--text-tertiary)] truncate">· {item.details}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default React.memo(ActivityLogDrawer);
