import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface SectionErrorBoundaryProps {
  children: ReactNode;
  sectionName?: string;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
  message: string;
}

/**
 * Lightweight error boundary for individual dashboard sections.
 * Instead of crashing the whole app, shows an inline error card with retry.
 */
export default class SectionErrorBoundary extends Component<SectionErrorBoundaryProps, SectionErrorBoundaryState> {
  state: SectionErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): SectionErrorBoundaryState {
    return {
      hasError: true,
      message: error.message,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.sectionName ?? 'section'}] render error:`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center"
          role="alert"
        >
          <AlertTriangle size={24} className="mx-auto text-red-400 mb-3" />
          <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">
            {this.props.sectionName ?? 'This section'} encountered an error
          </p>
          <p className="text-xs text-red-500 dark:text-red-400/70 mb-4">{this.state.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-700 rounded-lg px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          >
            <RefreshCw size={12} />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
