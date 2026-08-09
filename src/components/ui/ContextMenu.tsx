import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

export interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  items: ContextMenuItem[];
}

export function ContextMenu({ isOpen, position, onClose, items }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-[400]" style={{ pointerEvents: 'auto' }} role="menu">
      {/* Click-away backdrop */}
      <div 
        className="absolute inset-0 bg-black/5 dark:bg-black/20"
        onClick={onClose}
        aria-label="Context menu backdrop"
      />
      
      {/* Menu positioning container */}
      <div 
        className="absolute"
        style={{ 
          top: Math.min(position.y, window.innerHeight - (items.length * 45 + 20)), 
          left: Math.min(position.x, window.innerWidth - 190) 
        }}
      >
        {/* Menu card */}
        <div 
          ref={menuRef}
          className="bg-white dark:bg-slate-900 border border-[var(--border-subtle)] rounded-xl shadow-xl overflow-hidden min-w-[180px] origin-top-left animate-in fade-in zoom-in-95 duration-200"
          style={{ animationTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        >
          <div className="flex flex-col">
            {items.map((item, index) => (
              <button
                key={index}
                role="menuitem"
                onClick={() => {
                  item.onClick();
                  onClose();
                }}
                className={`
                  flex items-center justify-between px-4 py-3 text-sm
                  transition-colors active:bg-slate-100 dark:active:bg-slate-700
                  ${index !== items.length - 1 ? 'border-b border-slate-100 dark:border-slate-700/40' : ''}
                  ${item.danger ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}
                `}
              >
                <span>{item.label}</span>
                {item.icon && <span className="ml-3 text-lg opacity-80">{item.icon}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal if possible
  const portalRoot = document.getElementById('root');
  if (portalRoot) {
    return createPortal(content, portalRoot);
  }

  return content;
}
