import { startServer } from './server/app.ts';

// Global error guards to prevent server process from dying on unexpected background network/driver issues
process.on('uncaughtException', (err: any) => {
  // Ignore harmless WebSocket/HMR or closed socket errors
  if (err?.code === 'EADDRINUSE' || err?.message?.includes('WebSocket') || err?.message?.includes('closed')) {
    console.warn('[Server Warning] Suppressed uncaught exception:', err.message);
    return;
  }
  console.error('[Global Uncaught Exception]:', err);
});

process.on('unhandledRejection', (reason: any) => {
  console.warn('[Global Unhandled Rejection]:', reason?.message || reason);
});

startServer().catch((err) => {
  console.error('[Server Error]:', err);
});
