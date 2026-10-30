import { Router } from 'express';
import { db, saveDatabase, getInitialFreshDatabase, loadDatabase } from '../../database/json-db.ts';
import { mongoService } from '../../mongodb.ts';
import { addAudit } from '../../utils/audit.helper.ts';
import { INITIAL_ITEMS } from '../../../src/lib/constants.ts';
import { LostItem, User } from '../../../src/types.ts';

const router = Router();

// ----------------------------------------------------
// Real MongoDB Management & Controls
// ----------------------------------------------------
router.get('/mongodb/status', async (req, res) => {
  try {
    const status = await mongoService.getStatus();
    return res.json(status);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/mongodb/connect', async (req, res) => {
  const { uri, dbName } = req.body;
  if (!uri) {
    return res.status(400).json({ error: 'MongoDB URI connection string is required.' });
  }

  const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
  const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

  try {
    const status = await mongoService.connect(uri.trim(), dbName || 'warwick_lost_found');
    
    // If MongoDB is empty, seed with current dataset so user immediately sees their hotel data
    if (status.collections.itemsCount === 0 && db.items.length > 0) {
      console.log('[MongoDB] Auto-seeding initial hotel data into newly connected MongoDB...');
      await mongoService.seedAllData({
        items: db.items,
        staff: db.staff,
        users: db.users,
        settings: db.settings,
        auditLogs: db.auditLogs
      });
    }

    await addAudit(
      'MongoDB Connected',
      'settings',
      `Connected to real MongoDB Database: ${dbName || 'warwick_lost_found'} (${status.host})`,
      actor,
      role
    );

    const refreshedStatus = await mongoService.getStatus();
    return res.json({
      success: true,
      message: `Successfully connected to MongoDB "${status.databaseName}"!`,
      status: refreshedStatus
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: err.message || 'Failed to connect to MongoDB. Please verify your connection URI, username, password, and IP whitelist (0.0.0.0/0 on Atlas).'
    });
  }
});

router.post('/mongodb/test', async (req, res) => {
  const { uri, dbName } = req.body;
  if (!uri) {
    return res.status(400).json({ error: 'URI is required for testing' });
  }
  try {
    const tempStatus = await mongoService.connect(uri.trim(), dbName || 'warwick_lost_found');
    return res.json({
      success: true,
      message: `MongoDB connection test succeeded! Database: ${tempStatus.databaseName}`,
      pingMs: tempStatus.pingMs,
      collections: tempStatus.collections
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

router.post('/mongodb/seed', async (req, res) => {
  const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
  const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

  if (!mongoService.isLive) {
    return res.status(400).json({ error: 'MongoDB is not connected. Please connect first.' });
  }

  try {
    const status = await mongoService.seedAllData({
      items: db.items,
      staff: db.staff,
      users: db.users,
      settings: db.settings,
      auditLogs: db.auditLogs,
      media: db.media
    });

    await addAudit('MongoDB Seeded', 'settings', 'Synchronized all local data to MongoDB collections', actor, role);

    return res.json({
      success: true,
      message: 'All inventory items, staff, settings, and logs successfully synced into real MongoDB!',
      status
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/mongodb/disconnect', async (req, res) => {
  const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
  const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

  try {
    await mongoService.disconnect();
    await addAudit('MongoDB Disconnected', 'settings', 'Disconnected from MongoDB. Reverted to local JSON storage.', actor, role);
    const status = await mongoService.getStatus();
    return res.json({
      success: true,
      message: 'Disconnected from MongoDB. System is now using persistent local storage.',
      status
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Restore Initial Database Data
router.post(['/database/restore-initial', '/mongodb/restore-initial'], async (req, res) => {
  const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
  const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

  try {
    const freshDb = getInitialFreshDatabase();
    db.settings = freshDb.settings;
    db.items = freshDb.items;
    db.staff = freshDb.staff;
    db.users = freshDb.users;
    db.auditLogs = freshDb.auditLogs;
    db.notifications = freshDb.notifications;
    db.certificates = freshDb.certificates;
    db.media = freshDb.media || [];
    saveDatabase();

    let mongoStatus = null;
    if (mongoService.isLive) {
      mongoStatus = await mongoService.seedAllData({
        items: freshDb.items,
        staff: freshDb.staff,
        users: freshDb.users,
        settings: freshDb.settings,
        auditLogs: freshDb.auditLogs,
        media: freshDb.media
      });
    }

    await addAudit(
      'Database Restored',
      'settings',
      `Reverted and restored all database items, staff, and settings to the initial state (${freshDb.items.length} items)`,
      actor,
      role
    );

    return res.json({
      success: true,
      message: `Database successfully restored to original initial state with ${freshDb.items.length} items and ${freshDb.staff.length} staff members!`,
      itemsCount: freshDb.items.length,
      staffCount: freshDb.staff.length,
      mongoStatus
    });
  } catch (err: any) {
    console.error('Error restoring initial database:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to restore database to initial state'
    });
  }
});

// Repair & Restore Missing Fields
router.post(['/mongodb/restore-fields', '/items/restore-fields'], async (req, res) => {
  try {
    let mongoRepaired = { updatedCount: 0, totalCount: 0 };
    if (mongoService.isLive) {
      mongoRepaired = await mongoService.repairAndRestoreAllItemFields();
    }

    // Also repair local database items
    let localRepairedCount = 0;
    const initialMap = new Map<string, LostItem>();
    INITIAL_ITEMS.forEach(i => {
      if (i.id) initialMap.set(i.id.toLowerCase(), i);
      if (i.code) initialMap.set(i.code.toLowerCase(), i);
      if (i.roomNumber) initialMap.set(`room-${i.roomNumber.toLowerCase()}`, i);
    });

    db.items = db.items.map(item => {
      const match = (item.id && initialMap.get(item.id.toLowerCase())) ||
        (item.code && initialMap.get(item.code.toLowerCase())) ||
        (item.roomNumber ? initialMap.get(`room-${item.roomNumber.toLowerCase()}`) : undefined);

      if (match) {
        localRepairedCount++;
        return {
          ...item,
          itemName: item.itemName && item.itemName !== 'Untitled Item' ? item.itemName : match.itemName,
          description: (!item.description || ['dummy', 'test', ''].includes(item.description.toLowerCase().trim())) ? match.description : item.description,
          employeeName: (!item.employeeName || ['staff member', 'system', 'dummy', ''].includes(item.employeeName.toLowerCase().trim())) ? match.employeeName : item.employeeName,
          guestName: item.guestName || match.guestName || '',
          roomNumber: item.roomNumber || match.roomNumber || '',
          category: item.category || match.category || 'Other',
          locationFound: item.locationFound || match.locationFound || 'Hotel Premises',
          storeLocation: item.storeLocation || match.storeLocation || 'HK Office',
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });

    saveDatabase();

    return res.json({
      success: true,
      message: `Database fields repaired successfully. Repaired ${localRepairedCount} local items and ${mongoRepaired.updatedCount} MongoDB items.`,
      localRepairedCount,
      mongoRepaired
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
