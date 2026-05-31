import { Component, ErrorInfo, ReactNode } from 'react';
import DashboardError from './DashboardError';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error.message,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[app] render failed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <DashboardError
          message="Something unexpected happened while rendering the dashboard."
          onRetry={() => window.location.reload()}
        />
      );
    }

    return this.props.children;
  }
}

