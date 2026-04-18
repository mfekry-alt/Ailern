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
                position="top-right"
                richColors
                closeButton
                toastOptions={{
                    duration: 4000,
                    style: { fontWeight: 600 },
                }}
            />
            {import.meta.env.VITE_ENABLE_DEVTOOLS === 'true' && (
                <ReactQueryDevtools initialIsOpen={false} />
            )}
        </QueryClientProvider>
    );
};

