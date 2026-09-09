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
          className="bg-[var(--surface-solid)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] shadow-xl overflow-hidden min-w-[180px] origin-top-left animate-in fade-in zoom-in-95 duration-200"
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
                  flex items-center justify-between px-4 py-3 text-sm cursor-pointer
                  transition-colors active:bg-[var(--surface-secondary)] hover:bg-[var(--surface-secondary)]
                  ${index !== items.length - 1 ? 'border-b border-[var(--border-subtle)]' : ''}
                  ${item.danger ? 'text-[var(--negative)]' : 'text-[var(--text-primary)]'}
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
