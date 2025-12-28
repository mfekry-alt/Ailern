import { useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { AppProviders } from './app/providers';
import { AppRouter } from './app/router';
import { ErrorBoundary } from './app/ErrorBoundary';
import { GlobalErrorOverlay } from './app/GlobalErrorOverlay';
import { useMe } from './features/auth/api';
import { useAuthStore } from './features/auth/store';

function AppContent() {
  const { isLoading } = useMe();
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    if (!isLoading) {
      setLoading(false);
    }
  }, [isLoading, setLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <AppRouter />;
}

function App() {
  return (
    <AppProviders>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
      <GlobalErrorOverlay />
      <Analytics />
    </AppProviders>
  );
}

export default App;
