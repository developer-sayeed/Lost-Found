import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Handle Service Worker registration:
// In development, unregister any existing service worker to prevent intercepting dev APIs & workbox log spam.
// In production, register the service worker for offline caching and spotty Wi-Fi resilience.
if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const reg of registrations) {
        reg.unregister();
      }
    });
  } else {
    registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log('Warwick L&F: New update available.');
      },
      onOfflineReady() {
        console.log('Warwick L&F: Service Worker registered. Dashboard & active items cached for offline access.');
      },
      onRegisterError(error) {
        console.warn('Warwick L&F: Service Worker registration error:', error);
      }
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
