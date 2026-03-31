// components/LoadingSpinner.tsx
export const LoadingSpinner = ( ) => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="flex flex-col items-center space-y-5">
            {/* اللودر البنفسجي */}
            <div className="relative h-14 w-14">
                <div className="animate-spin rounded-full h-14 w-14 border-[3px] border-purple-500/20 border-t-purple-600"></div>
            </div>

            {/* كلمة التحميل */}
            <p className="text-purple-500/80 dark:text-purple-400/80 font-bold text-sm tracking-widest animate-pulse">
                Loading...{}
            </p>
        </div>
    </div>
);