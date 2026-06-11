import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative font-sans">
          {/* Decorative glows */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute top-[10%] left-[10%] w-[30%] h-[30%] bg-red-500/10 rounded-full blur-[100px]"></div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-8 max-w-md w-full shadow-2xl text-center z-10 relative">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-950/10">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h2 className="text-xl font-extrabold text-slate-100 mb-2">Something went wrong</h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              An unexpected error occurred while loading this view. Our secure database session remains safe.
            </p>

            {this.state.error && (
              <details className="text-left bg-slate-950 border border-slate-850 rounded-xl p-3 mb-6 max-h-32 overflow-y-auto">
                <summary className="text-[10px] font-bold text-slate-500 cursor-pointer uppercase tracking-wider select-none hover:text-slate-400">
                  Technical details
                </summary>
                <p className="text-[10.5px] font-mono text-red-400 mt-2 whitespace-pre-wrap break-all leading-normal">
                  {this.state.error.toString()}
                </p>
              </details>
            )}

            <button
              onClick={this.handleReset}
              className="w-full px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-950/20 active:scale-95 transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
