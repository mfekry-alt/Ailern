import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 30 * 1000,
        },
    },
});

interface AppProvidersProps {
    children: React.ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                {children}
            </BrowserRouter>
            <Toaster
                position="top-center"
                offset="90px"
                richColors={false}
                closeButton
                toastOptions={{
                    duration: 4000,
                    unstyled: true,
                    classNames: {
                        toast: 'group relative w-auto min-w-[320px] flex items-center justify-center gap-4 px-12 py-5 rounded-[2rem] bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-gray-200/50 dark:border-slate-800/50 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.2)] pointer-events-auto',
                        title: 'text-[13px] font-black tracking-tight text-gray-900 dark:text-white leading-tight text-center',
                        description: 'text-xs font-semibold text-gray-500 dark:text-slate-400 mt-0.5 text-center',
                        success: '!bg-emerald-500/5 !border-emerald-500/20 !text-emerald-600 dark:!text-emerald-400',
                        error: '!bg-red-500/5 !border-red-500/20 !text-red-600 dark:!text-red-400',
                        info: '!bg-blue-500/5 !border-blue-500/20 !text-blue-600 dark:!text-blue-400',
                        warning: '!bg-amber-500/5 !border-amber-500/20 !text-amber-600 dark:!text-amber-400',
                        closeButton: 'absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all !rounded-full !w-6 !h-6 !flex !items-center !justify-center !bg-gray-100/50 dark:!bg-slate-800/50 !backdrop-blur-md !border-none !text-gray-500 hover:!text-gray-900 dark:hover:!text-white hover:!bg-white dark:hover:!bg-slate-700 shadow-sm hover:scale-110 active:scale-90',
                        actionButton: 'bg-blue-600 text-white font-black text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors',
                        cancelButton: 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 font-black text-xs px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors',
                    }
                }}
            />
            {import.meta.env.VITE_ENABLE_DEVTOOLS === 'true' && (
                <ReactQueryDevtools initialIsOpen={false} />
            )}
        </QueryClientProvider>
    );
};

