import React, {
  useState,
  useRef,
  useId,
  useCallback,
  ReactNode,
  cloneElement,
  isValidElement,
} from 'react';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  /** Text or node content for the tooltip */
  content: ReactNode;
  /** Position of tooltip relative to trigger */
  placement?: TooltipPlacement;
  /** Delay before showing in ms */
  delay?: number;
  /** Whether tooltip is disabled */
  disabled?: boolean;
  /** The target child element */
  children: ReactNode;
  /** Extra tooltip content className */
  className?: string;
}

export function Tooltip({
  content,
  placement = 'top',
  delay = 200,
  disabled = false,
  children,
  className = '',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = useId();

  const show = useCallback(() => {
    if (disabled || !content) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [disabled, content, delay]);

  const hide = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        hide();
      }
    },
    [isVisible, hide]
  );

  if (!content || disabled) {
    return <>{children}</>;
  }

  const placementStyles: Record<TooltipPlacement, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowStyles: Record<TooltipPlacement, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-900 dark:border-t-slate-800 border-x-transparent border-b-transparent border-4',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 dark:border-b-slate-800 border-x-transparent border-t-transparent border-4',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-900 dark:border-l-slate-800 border-y-transparent border-r-transparent border-4',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-900 dark:border-r-slate-800 border-y-transparent border-l-transparent border-4',
  };

  // Enhance child with handlers and ARIA attributes
  const childElement = isValidElement(children) ? (
    cloneElement(children as React.ReactElement<React.HTMLAttributes<Element>>, {
      onMouseEnter: (e: React.MouseEvent<Element>) => {
        (children.props as React.HTMLAttributes<Element>)?.onMouseEnter?.(e);
        show();
      },
      onMouseLeave: (e: React.MouseEvent<Element>) => {
        (children.props as React.HTMLAttributes<Element>)?.onMouseLeave?.(e);
        hide();
      },
      onFocus: (e: React.FocusEvent<Element>) => {
        (children.props as React.HTMLAttributes<Element>)?.onFocus?.(e);
        show();
      },
      onBlur: (e: React.FocusEvent<Element>) => {
        (children.props as React.HTMLAttributes<Element>)?.onBlur?.(e);
        hide();
      },
      'aria-describedby': isVisible ? tooltipId : (children.props as Record<string, string | undefined>)?.[
        'aria-describedby'
      ],
    })
  ) : (
    <span
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      tabIndex={0}
      aria-describedby={isVisible ? tooltipId : undefined}
    >
      {children}
    </span>
  );

  return (
    <div
      className="relative inline-flex items-center"
      onKeyDown={handleKeyDown}
    >
      {childElement}

      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`absolute z-50 pointer-events-none whitespace-nowrap px-2.5 py-1 text-xs font-medium text-white bg-slate-900 dark:bg-slate-800 rounded-[6px] shadow-lg border border-slate-800 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-100 ${placementStyles[placement]} ${className}`}
        >
          {content}
          <div className={`absolute w-0 h-0 ${arrowStyles[placement]}`} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
