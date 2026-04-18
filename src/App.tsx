import { useEffect, useState } from 'react';
import { AppProviders } from './app/providers';
import { AppRouter } from './app/router';
import { ErrorBoundary } from './app/ErrorBoundary';
import { GlobalErrorOverlay } from './app/GlobalErrorOverlay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useMe } from './features/auth/api';
import { useAuthStore } from './features/auth/store';

function AppContent() {
  const { isLoading, isFetching } = useMe();
  const setLoading = useAuthStore((state) => state.setLoading);
  const [ready, setReady] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);

  useEffect(() => {
    if (!isLoading && !isFetching) {
      setLoading(false);
      setReady(true);
    }
  }, [isLoading, isFetching, setLoading]);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => setShowSpinner(false), 450);
    return () => clearTimeout(timer);
  }, [ready]);

  return (
    <>
      {showSpinner && <LoadingSpinner fading={ready} />}
      {ready && <AppRouter />}
    </>
  );
}

function App() {
  return (
    <AppProviders>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
      <GlobalErrorOverlay />
    </AppProviders>
  );
}

export default App;
