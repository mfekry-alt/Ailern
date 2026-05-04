import { useEffect, useState } from 'react';
import { AppProviders } from './app/providers';
import { AppRouter } from './app/router';
import { ErrorBoundary } from './app/ErrorBoundary';
import { GlobalErrorOverlay } from './app/GlobalErrorOverlay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { AuthProvider } from './features/auth';
import { SessionExpiredHandler } from './components/SessionExpiredHandler';

/**
 * AppContent handles the initial loading state for the application.
 * Note: AuthProvider handles auth initialization, we just need a brief
 * delay to ensure all providers are ready.
 */
function AppContent() {
  const [ready, setReady] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);

  useEffect(() => {
    // Brief delay to ensure all providers are initialized
    const timer = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => setShowSpinner(false), 450);
    return () => clearTimeout(timer);
  }, [ready]);

  return (
    <>
      {showSpinner && <LoadingSpinner fading={ready} />}
      {ready && (
        <>
          <SessionExpiredHandler />
          <AppRouter />
        </>
      )}
    </>
  );
}

function App() {
  return (
    <AppProviders>
      <AuthProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </AuthProvider>
      <GlobalErrorOverlay />
    </AppProviders>
  );
}

export default App;
