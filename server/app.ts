import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { PORT } from './config/env.config.ts';
import { db, saveDatabase, ensureDatabaseAuthIntegrity } from './database/json-db.ts';
import { mongoService } from './mongodb.ts';
import { sessionTrackingMiddleware } from './middleware/session.middleware.ts';

// Synchronize all live records from MongoDB Atlas into active runtime database
export async function syncLiveMongoData() {
  try {
    console.log('[Startup] Initializing MongoDB connection...');
    await mongoService.init();
    if (mongoService.isLive) {
      console.log('[Startup] MongoDB connected. Synchronizing collections from MongoDB Atlas ("hotel")...');
      const [liveItems, liveStaff, liveUsers, liveSettings, liveCerts, liveLogs] = await Promise.all([
        mongoService.getItems().catch(err => { console.warn('[Startup] Items load warning:', err.message); return []; }),
        mongoService.getStaff().catch(err => { console.warn('[Startup] Staff load warning:', err.message); return []; }),
        mongoService.getUsers().catch(err => { console.warn('[Startup] Users load warning:', err.message); return []; }),
        mongoService.getSettings().catch(err => { console.warn('[Startup] Settings load warning:', err.message); return null; }),
        mongoService.getCertificates().catch(err => { console.warn('[Startup] Certs load warning:', err.message); return []; }),
        mongoService.getAuditLogs({}, 500).catch(err => { console.warn('[Startup] Audit logs load warning:', err.message); return []; })
      ]);

      if (liveItems && liveItems.length > 0) {
        db.items = liveItems;
        console.log(`[Startup] Synchronized ${liveItems.length} items from MongoDB Atlas.`);
      }
      if (liveStaff && liveStaff.length > 0) {
        db.staff = liveStaff;
        console.log(`[Startup] Synchronized ${liveStaff.length} staff members from MongoDB Atlas.`);
      }
      if (liveUsers && liveUsers.length > 0) {
        db.users = liveUsers;
        console.log(`[Startup] Synchronized ${liveUsers.length} users from MongoDB Atlas.`);
      }
      if (liveSettings) {
        db.settings = { ...db.settings, ...liveSettings };
      }
      if (liveCerts && liveCerts.length > 0) {
        db.certificates = liveCerts;
        console.log(`[Startup] Synchronized ${liveCerts.length} certificates from MongoDB Atlas.`);
      }
      if (liveLogs && liveLogs.length > 0) {
        db.auditLogs = liveLogs;
      }
      saveDatabase();
      console.log('[Startup] MongoDB Atlas live synchronization finished successfully.');
    }
  } catch (err: any) {
    console.warn('[Startup] MongoDB sync notice:', err.message);
  }
}

// Feature Modules
import healthRoutes from './modules/health/health.routes.ts';
import authRoutes from './modules/auth/auth.routes.ts';
import settingsRoutes from './modules/settings/settings.routes.ts';
import securityRoutes from './modules/security/security.routes.ts';
import backupRoutes from './modules/backup/backup.routes.ts';
import databaseRoutes from './modules/database/database.routes.ts';
import realtimeRoutes from './modules/realtime/realtime.routes.ts';
import publicRoutes from './modules/public/public.routes.ts';
import notificationsRoutes from './modules/notifications/notifications.routes.ts';
import auditRoutes from './modules/audit-logs/audit.routes.ts';
import staffRoutes from './modules/staff/staff.routes.ts';
import userRoutes from './modules/users/user.routes.ts';
import itemsRoutes from './modules/items/items.routes.ts';
import certificatesRoutes from './modules/certificates/certificates.routes.ts';
import mediaRoutes from './modules/media/media.routes.ts';

export async function createApp() {
  ensureDatabaseAuthIntegrity();
  // Trigger background MongoDB Atlas connection and live synchronization
  syncLiveMongoData().catch(err => console.warn('[Startup] MongoDB sync error:', err));

  const app = express();

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Real-Time Active Session Tracking & Device Blocking Middleware
  app.use(sessionTrackingMiddleware);

  // Mount API Feature Modules
  app.use(healthRoutes);
  app.use(authRoutes);
  app.use(settingsRoutes);
  app.use(securityRoutes);
  app.use('/api/backup', backupRoutes);
  app.use('/api', databaseRoutes);
  app.use('/api/realtime', realtimeRoutes);
  app.use('/api', publicRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/audit-logs', auditRoutes);
  app.use('/api/staff', staffRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/items', itemsRoutes);
  app.use('/api/certificates', certificatesRoutes);
  app.use('/api/media', mediaRoutes);

  // Vite Integration (Dev middleware or Static Dist Serving)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

export async function startServer() {
  const app = await createApp();
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Warwick Hotel Baha L&F Server running on http://localhost:${PORT}`);
    // Clear notifications on boot
    db.notifications = [];
    saveDatabase();
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Server] Port ${PORT} currently occupied, retrying in 1s...`);
      setTimeout(() => {
        try {
          server.close();
        } catch {}
        server.listen(PORT, '0.0.0.0');
      }, 1000);
    } else {
      console.error('[Server] Server listen error:', err);
    }
  });

  return server;
}
