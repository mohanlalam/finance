import { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes, ReactNode } from 'react';
import { Skeleton } from './Skeleton';

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  /** Responsive container wrapper with horizontal overflow */
  responsive?: boolean;
  /** Sticky header styling */
  stickyHeader?: boolean;
  /** Extra container className */
  containerClassName?: string;
}

export function Table({
  responsive = true,
  stickyHeader = false,
  className = '',
  containerClassName = '',
  children,
  ...props
}: TableProps) {
  const tableElement = (
    <table
      className={`w-full text-left border-collapse text-slate-800 dark:text-slate-200 text-sm ${stickyHeader ? 'relative' : ''} ${className}`}
      {...props}
    >
      {children}
    </table>
  );

  if (responsive) {
    return (
      <div className={`w-full overflow-x-auto rounded-[12px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 ${containerClassName}`}>
        {tableElement}
      </div>
    );
  }

  return tableElement;
}

export type TableHeaderProps = HTMLAttributes<HTMLTableSectionElement>;

export function TableHeader({ className = '', children, ...props }: TableHeaderProps) {
  return (
    <thead
      className={`bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
}

export type TableBodyProps = HTMLAttributes<HTMLTableSectionElement>;

export function TableBody({ className = '', children, ...props }: TableBodyProps) {
  return (
    <tbody
      className={`divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300 font-normal ${className}`}
      {...props}
    >
      {children}
    </tbody>
  );
}

export type TableFooterProps = HTMLAttributes<HTMLTableSectionElement>;

export function TableFooter({ className = '', children, ...props }: TableFooterProps) {
  return (
    <tfoot
      className={`bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200 ${className}`}
      {...props}
    >
      {children}
    </tfoot>
  );
}

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  /** Hover highlight effect */
  hoverable?: boolean;
  /** Active / selected row styling */
  isSelected?: boolean;
}

export function TableRow({
  hoverable = true,
  isSelected = false,
  className = '',
  children,
  ...props
}: TableRowProps) {
  const hoverStyles = hoverable ? 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors' : '';
  const selectedStyles = isSelected ? 'bg-blue-50/60 dark:bg-blue-950/30' : '';

  return (
    <tr
      className={`${hoverStyles} ${selectedStyles} ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export type SortDirection = 'asc' | 'desc' | null;

export interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  /** Sortable column toggle */
  sortable?: boolean;
  /** Active sort direction */
  sortDirection?: SortDirection;
  /** Sort callback */
  onSort?: () => void;
  /** Cell alignment */
  align?: 'left' | 'center' | 'right';
}

export function TableHead({
  sortable = false,
  sortDirection = null,
  onSort,
  align = 'left',
  className = '',
  children,
  ...props
}: TableHeadProps) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const ariaSort =
    sortDirection === 'asc'
      ? 'ascending'
      : sortDirection === 'desc'
      ? 'descending'
      : sortable
      ? 'none'
      : undefined;

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      onClick={sortable ? onSort : undefined}
      className={`px-4 py-3 select-none text-xs font-semibold ${alignClasses[align]} ${
        sortable ? 'cursor-pointer hover:text-slate-800 dark:hover:text-slate-100 group' : ''
      } ${className}`}
      {...props}
    >
      <div className={`inline-flex items-center gap-1.5 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        <span>{children}</span>
        {sortable && (
          <span className="shrink-0 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">
            {sortDirection === 'asc' ? (
              <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            ) : sortDirection === 'desc' ? (
              <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m7 15 5 5 5-5" />
                <path d="m7 9 5-5 5 5" />
              </svg>
            )}
          </span>
        )}
      </div>
    </th>
  );
}

export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'center' | 'right';
  tabular?: boolean;
}

export function TableCell({
  align = 'left',
  tabular = false,
  className = '',
  children,
  ...props
}: TableCellProps) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <td
      className={`px-4 py-3 ${alignClasses[align]} ${tabular ? 'text-financial' : ''} ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}

export interface TableEmptyStateProps {
  colSpan: number;
  message?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}

export function TableEmptyState({
  colSpan,
  message = 'No data available',
  icon,
  action,
}: TableEmptyStateProps) {
  return (
    <TableRow hoverable={false}>
      <TableCell colSpan={colSpan} className="text-center py-10">
        <div className="flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
          {icon || (
            <svg className="w-8 h-8 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
          )}
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{message}</p>
          {action && <div className="mt-2">{action}</div>}
        </div>
      </TableCell>
    </TableRow>
  );
}

export interface TableLoadingStateProps {
  colSpan: number;
  rows?: number;
}

export function TableLoadingState({ colSpan, rows = 5 }: TableLoadingStateProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <TableRow key={`loading-row-${rIdx}`} hoverable={false}>
          {Array.from({ length: colSpan }).map((_, cIdx) => (
            <TableCell key={`loading-cell-${rIdx}-${cIdx}`}>
              <Skeleton height="18px" width={cIdx === 0 ? '70%' : '50%'} className="rounded-sm" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
