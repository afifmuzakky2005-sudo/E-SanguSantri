import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full p-6 md:p-12 flex items-center justify-center min-h-[350px]">
          <div className="bg-white rounded-3xl border border-rose-200 shadow-xl p-8 max-w-lg w-full text-center space-y-5">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {this.props.fallbackTitle || 'Terjadi Kendala Tampilan'}
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Halaman ini mengalami gangguan saat memuat data. Tenang, seluruh saldo dan catatan database Anda tetap aman di sistem.
              </p>
              {this.state.error && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left overflow-x-auto text-[11px] font-mono text-rose-600">
                  {this.state.error.message || 'Error tidak terduga'}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                Coba Muat Ulang
              </button>
              {this.props.onReset && (
                <button
                  type="button"
                  onClick={this.props.onReset}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali ke Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
