import { useEffect, useState } from 'react';

export const GlobalErrorOverlay = () => {
    const [error, setError] = useState<null | { message: string; stack?: string }>(null);

    useEffect(() => {
        const onError = (ev: ErrorEvent) => {
            setError({ message: ev.message, stack: ev.error?.stack });
            // keep logging
            console.error('Global error captured', ev.error || ev.message);
        };

        const onRejection = (ev: PromiseRejectionEvent) => {
            const reason = ev.reason;
            const message = typeof reason === 'string' ? reason : reason?.message || 'Unhandled promise rejection';
            setError({ message, stack: reason?.stack });
            console.error('Unhandled rejection captured', reason);
        };

        window.addEventListener('error', onError);
        window.addEventListener('unhandledrejection', onRejection as any);
        return () => {
            window.removeEventListener('error', onError);
            window.removeEventListener('unhandledrejection', onRejection as any);
        };
    }, []);

    if (!error) return null;

    return (
        <div style={{ position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 99999 }}>
            <div className="max-w-4xl mx-auto bg-red-600 text-white rounded-lg p-4 shadow-lg">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-semibold">Application Error</h4>
                        <p className="text-sm mt-1">{error.message}</p>
                    </div>
                    <div>
                        <button
                            onClick={() => setError(null)}
                            className="ml-4 bg-white text-red-600 px-3 py-1 rounded"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
                {error.stack && (
                    <pre className="text-xs whitespace-pre-wrap mt-3 bg-red-700 p-3 rounded">{error.stack}</pre>
                )}
            </div>
        </div>
    );
};
