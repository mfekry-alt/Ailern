export const TabLoadingState = () => (
    <div className="space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
            <div
                key={i}
                className="bg-white dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/50 rounded-2xl p-6 space-y-4"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-slate-700" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded-lg w-2/3" />
                        <div className="h-3 bg-gray-100 dark:bg-slate-700/50 rounded-lg w-1/3" />
                    </div>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-slate-700/50 rounded-lg w-full" />
                <div className="h-3 bg-gray-100 dark:bg-slate-700/50 rounded-lg w-4/5" />
            </div>
        ))}
    </div>
);
