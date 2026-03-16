import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Catches render errors in children and shows a fallback UI instead of a blank screen.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const message = this.props.fallbackMessage ?? "문제가 발생했습니다. 새로고침 후 다시 시도해 주세요.";
      return (
        <div className="min-h-[40vh] flex items-center justify-center p-8 relative z-[100] bg-background">
          <div className="max-w-md w-full rounded-lg border border-destructive/30 bg-card p-6 text-center shadow-lg">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-3" aria-hidden />
            <h2 className="text-lg font-semibold text-foreground mb-2">오류가 발생했습니다</h2>
            <p className="text-sm text-muted-foreground mb-4">{message}</p>
            <button
              type="button"
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <RefreshCw className="w-4 h-4" />
              다시 시도
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="ml-3 inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              페이지 새로고침
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
