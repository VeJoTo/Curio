import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  renderFallback: (reset: () => void, error: Error | null) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// A general-purpose render-error boundary. Note: this is NOT expo-router's
// `ErrorBoundary` route export — it's a plain component we wire in manually
// (see app/_layout.tsx), so naming it `ErrorBoundary` does not trigger any
// framework auto-wiring.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('Uncaught render error:', error);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return this.props.renderFallback(this.reset, this.state.error);
    }
    return this.props.children;
  }
}
