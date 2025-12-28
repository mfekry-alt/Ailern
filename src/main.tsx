import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

async function enableMocking() {
  // Enable MSW in both development and production until real backend is ready
  if (import.meta.env.MODE === 'test') return;
  const { worker } = await import('./mocks/browser');
  await worker.start();
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
