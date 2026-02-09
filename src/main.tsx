import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// Enable mocking for development and testing
async function enableMocking() {
  if (import.meta.env.MODE === 'test') return;
  const { worker } = await import('./mocks/browser');
  await worker.start({
    onUnhandledRequest: 'bypass', // Allow unhandled requests to pass through
  });
  console.log('🔶 Mock Service Worker enabled');
}

enableMocking().then(() => {
  try {
    const rootElement = document.getElementById('root');
    if (!rootElement) throw new Error('Root element not found');

    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } catch (error) {
    console.error('Failed to mount app:', error);
    document.body.innerHTML = `<div style="color: red; padding: 20px;">
      <h1>Application Failed to Start</h1>
      <pre>${error instanceof Error ? error.message : String(error)}</pre>
    </div>`;
  }
});