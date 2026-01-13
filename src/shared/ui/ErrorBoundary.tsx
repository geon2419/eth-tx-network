"use client";

import { Component, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

/**
 * Error boundary component to catch and handle React errors.
 * Wraps components that may throw errors during rendering.
 *
 * @example
 * ```tsx
 * <ErrorBoundary fallback={<ErrorFallback />}>
 *   <SuspenseComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <div className="mb-4 text-4xl">⚠️</div>
          <h2 className="mb-2 text-lg font-semibold text-red-900">
            Something went wrong
          </h2>
          <p className="mb-4 max-w-md text-sm text-red-700">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={this.reset}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
