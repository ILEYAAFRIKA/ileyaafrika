import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends (React.Component as any) {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/guest-dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FBF6EC] flex flex-col items-center justify-center p-6 text-[#14231C]">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#1B4332]/10 shadow-lg text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold font-serif text-[#1B4332]">
                {this.props.fallbackTitle || 'Unable to load dashboard'}
              </h2>
              <p className="text-xs text-[#6B756F] leading-relaxed">
                We encountered an unexpected rendering issue. Your data and verified reservations are safe.
              </p>
              {this.state.error?.message && (
                <div className="mt-2 p-2.5 rounded-xl bg-[#FBF6EC] border border-[#1B4332]/10 text-[11px] font-mono text-left text-[#14231C] overflow-x-auto">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-[#1B4332] text-white hover:bg-[#2D6A4F] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-[#E8A33D] text-[#14231C] hover:bg-[#d99530] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Explore Stays</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

