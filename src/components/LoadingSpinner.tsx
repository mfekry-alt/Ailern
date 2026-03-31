// components/LoadingSpinner.tsx
export const LoadingSpinner = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
        <div className="flex flex-col items-center space-y-4">

            <div className="animate-spin rounded-full h-14 w-14 border-4 border-purple-200 border-t-purple-600"></div>

            <p className="text-purple-600/70 dark:text-purple-400/70 font-bold text-xs uppercase tracking-[0.2em] animate-pulse">
                Loading
            </p>
        </div>
    </div>
);