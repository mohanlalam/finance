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
    
    const isChunkError = 
      error.message.includes('dynamically imported module') ||
      error.message.includes('chunk load') ||
      error.message.includes('Loading chunk') ||
      error.message.includes('loading chunk') ||
      error.message.includes('Importing a module script failed') ||
      error.message.includes('module script failed');
      
    if (isChunkError) {
      const chunkErrorKey = 'finance_chunk_error_reload';
      const lastReload = sessionStorage.getItem(chunkErrorKey);
      const now = Date.now();
      
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem(chunkErrorKey, now.toString());
        window.location.reload();
      }
    }
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

