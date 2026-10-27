import { startServer } from './server/app.ts';

startServer().catch((err) => {
  console.error('[Server Error]:', err);
  process.exit(1);
});
