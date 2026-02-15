import { Component } from 'react';
import type { ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    message?: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, message: error.message };
    }

    componentDidCatch(error: Error, info: unknown) {
        console.error('App error boundary caught:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950 px-4 text-center">
                    <div className="max-w-md w-full bg-white dark:bg-zinc-900 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-zinc-700">
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-zinc-100 mb-2">Something went wrong</h1>
                        <p className="text-sm text-gray-600 dark:text-zinc-400 mb-4">
                            {this.state.message || 'An unexpected error occurred.'}
                        </p>
                        <button
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            onClick={() => window.location.reload()}
                        >
                            Reload page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
