import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  theme?: 'light' | 'dark';
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full p-8 text-center bg-[#171717] text-white">
          <div className="p-4 rounded-full mb-6 bg-red-900/20 text-red-500 border border-red-500/20">
            <AlertTriangle size={48} />
          </div>
          <h2 className="text-2xl font-bold mb-2 tracking-tight">System Interrupt</h2>
          <p className="mb-8 max-w-md text-slate-400 font-mono text-xs">
            ERROR: {this.state.error?.message}
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm text-black bg-white hover:bg-slate-200 transition-colors"
          >
            <RefreshCw size={14} />
            Reinitialize
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}