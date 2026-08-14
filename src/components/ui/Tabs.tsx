import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  ReactNode,
} from 'react';

export type TabsVariant = 'pill' | 'underline' | 'segmented';
export type TabsSize = 'sm' | 'md' | 'lg';

interface TabsContextValue {
  activeTab: string;
  onChange: (value: string) => void;
  variant: TabsVariant;
  size: TabsSize;
  baseId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export interface TabsProps {
  /** Selected active tab value */
  value: string;
  /** Callback on tab select */
  onChange: (value: string) => void;
  /** Visual variant */
  variant?: TabsVariant;
  /** Sizing */
  size?: TabsSize;
  /** Unique id prefix for ARIA attributes */
  id?: string;
  /** Tab children */
  children: ReactNode;
  /** Extra container className */
  className?: string;
}

export function Tabs({
  value,
  onChange,
  variant = 'pill',
  size = 'md',
  id = 'tabs',
  children,
  className = '',
}: TabsProps) {
  return (
    <TabsContext.Provider value={{ activeTab: value, onChange, variant, size, baseId: id }}>
      <div className={`w-full ${className}`}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export interface TabListProps {
  children: ReactNode;
  'aria-label'?: string;
  className?: string;
}

export function TabList({
  children,
  'aria-label': ariaLabel = 'Navigation Tabs',
  className = '',
}: TabListProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabList must be used within <Tabs>');

  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!listRef.current) return;
    const tabs = Array.from(listRef.current.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])'));
    if (tabs.length === 0) return;

    const currentIndex = tabs.findIndex((t) => t === document.activeElement);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== currentIndex) {
      tabs[nextIndex].focus();
      tabs[nextIndex].click();
    }
  }, []);

  const variantContainerStyles: Record<TabsVariant, string> = {
    pill: 'flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1',
    underline: 'flex items-center gap-6 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar',
    segmented: 'inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-[12px] border border-slate-200/60 dark:border-slate-700/60',
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation="horizontal"
      onKeyDown={handleKeyDown}
      className={`${variantContainerStyles[context.variant]} ${className}`}
    >
      {children}
    </div>
  );
}

export interface TabProps {
  value: string;
  children: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Tab({
  value,
  children,
  icon,
  badge,
  disabled = false,
  className = '',
}: TabProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('Tab must be used within <Tabs>');

  const { activeTab, onChange, variant, size, baseId } = context;
  const isActive = activeTab === value;
  const tabId = `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel-${value}`;

  const sizeStyles: Record<TabsSize, string> = {
    sm: 'text-xs px-2.5 py-1 min-h-[30px] gap-1.5',
    md: 'text-sm px-3.5 py-1.5 min-h-[36px] gap-2',
    lg: 'text-base px-4 py-2 min-h-[42px] gap-2.5',
  };

  let tabVariantStyles = '';
  if (variant === 'pill') {
    tabVariantStyles = isActive
      ? 'bg-blue-600 text-white font-semibold shadow-xs'
      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium';
  } else if (variant === 'underline') {
    tabVariantStyles = isActive
      ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 font-semibold -mb-[1px]'
      : 'border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium';
  } else if (variant === 'segmented') {
    tabVariantStyles = isActive
      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-xs rounded-[9px]'
      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium rounded-[9px]';
  }

  return (
    <button
      type="button"
      role="tab"
      id={tabId}
      aria-controls={panelId}
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={() => onChange(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-[10px] transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-600 select-none disabled:opacity-50 disabled:cursor-not-allowed ${sizeStyles[size]} ${tabVariantStyles} ${className}`}
    >
      {icon && <span className="shrink-0" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
      {badge !== undefined && (
        <span
          className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full select-none ${
            isActive
              ? 'bg-white/20 text-current'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

export interface TabPanelProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabPanel({
  value,
  children,
  className = '',
}: TabPanelProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabPanel must be used within <Tabs>');

  const { activeTab, baseId } = context;
  const isActive = activeTab === value;
  const tabId = `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel-${value}`;

  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      id={panelId}
      aria-labelledby={tabId}
      tabIndex={0}
      className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded-[10px] ${className}`}
    >
      {children}
    </div>
  );
}
