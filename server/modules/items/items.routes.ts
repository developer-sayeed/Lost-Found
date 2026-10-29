import { Router } from 'express';
import fs from 'fs';
import { db, saveDatabase } from '../../database/json-db.ts';
import { DB_FILE } from '../../config/env.config.ts';
import { mongoService } from '../../mongodb.ts';
import { multiDbService } from '../../multiDatabase.ts';
import { addAudit } from '../../utils/audit.helper.ts';
import { createNotificationHelper } from '../../utils/notification.helper.ts';
import { capitalizeWords, generateUniqueItemCode } from '../../utils/string.utils.ts';
import { actorHasPermission } from '../../middleware/permission.middleware.ts';
import { LostItem, User } from '../../../src/types.ts';
import { cloudinaryService } from '../media/cloudinary.service.ts';

const router = Router();

// Helper to locate an item: checks MongoDB first, then memory cache
const findItemByIdOrCode = async (idOrCode: string): Promise<LostItem | undefined> => {
  if (mongoService.isLive) {
    try {
      const found = await mongoService.getItems({ $or: [{ id: idOrCode }, { code: idOrCode }] });
      if (found && found.length > 0) return found[0];
    } catch (e: any) {
      mongoService.handleConnectionError(e);
    }
  }
  const itemIndex = db.items.findIndex(i => i.id === idOrCode || i.code === idOrCode || (i as any)._id === idOrCode);
  if (itemIndex >= 0) {
    return db.items[itemIndex];
  }
  return undefined;
};

// ----------------------------------------------------
// GET /api/items (Search, Filter, Pagination, Soft-Delete)
// ----------------------------------------------------
router.get('/', async (req, res) => {
  const { search, status, category, month, year, location, limit, offset, includeDeleted, deletedOnly } = req.query;

  let results: LostItem[] = [];

  const activeEngine = multiDbService.getPrimaryEngine();

  if (activeEngine === 'mongodb' && mongoService.isLive) {
    try {
      results = await mongoService.getItems();
      if (results.length > 0) {
        db.items = results;
      }
    } catch (err: any) {
      mongoService.handleConnectionError(err);
      console.warn('MongoDB query failed, fallback to local cache:', err.message);
      results = [...db.items];
    }
  } else {
    if (activeEngine === 'local_json') {
      try {
        if (fs.existsSync(DB_FILE)) {
          const fresh = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
          if (Array.isArray(fresh.items)) {
            db.items = fresh.items;
          }
        }
      } catch (e) {
        console.warn('Failed to read db.json fresh:', e);
      }
    }
    results = [...db.items];
  }

  // Auto-purge items soft-deleted for more than 60 days
  const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
  const nowTime = Date.now();
  const expiredIds: string[] = [];
  db.items = db.items.filter(item => {
    if (item.isDeleted && item.deletedAt) {
      const deletedTime = new Date(item.deletedAt).getTime();
      if (nowTime - deletedTime > SIXTY_DAYS_MS) {
        expiredIds.push(item.id);
        return false;
      }
    }
    return true;
  });

  if (expiredIds.length > 0) {
    saveDatabase();
    if (mongoService.isLive) {
      expiredIds.forEach(id => {
        mongoService.deleteItem(id).catch(() => {});
      });
    }
  }

  if (deletedOnly === 'true') {
    results = results.filter(item => Boolean(item.isDeleted));
  } else if (includeDeleted !== 'true') {
    results = results.filter(item => !item.isDeleted);
  }

  if (search && typeof search === 'string') {
    const q = search.trim().toLowerCase();
    results = results.filter(item =>
      item.code.toLowerCase().includes(q) ||
      item.itemName.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.locationFound.toLowerCase().includes(q) ||
      (item.roomNumber && item.roomNumber.toLowerCase().includes(q)) ||
      (item.guestName && item.guestName.toLowerCase().includes(q)) ||
      item.employeeName.toLowerCase().includes(q) ||
      item.storeLocation.toLowerCase().includes(q)
    );
  }

  if (status && status !== 'All' && status !== 'All Status') {
    results = results.filter(item => item.status.toLowerCase() === (status as string).toLowerCase());
  }

  if (category && category !== 'All' && category !== 'All Categories') {
    results = results.filter(item => item.category.toLowerCase() === (category as string).toLowerCase());
  }

  if (year && year !== 'All') {
    results = results.filter(item => item.dateFound.startsWith(year as string));
  }

  if (month && month !== 'All') {
    results = results.filter(item => {
      const itemMonth = new Date(item.dateFound).getMonth() + 1;
      return itemMonth.toString() === month || item.dateFound.includes(`-${month.toString().padStart(2, '0')}-`);
    });
  }

  results.sort((a, b) => new Date(b.dateFound).getTime() - new Date(a.dateFound).getTime());

  const total = results.length;
  const pageLimit = limit ? parseInt(limit as string, 10) : total;
  const pageOffset = offset ? parseInt(offset as string, 10) : 0;
  const paginated = results.slice(pageOffset, pageOffset + pageLimit).map(item => ({
    ...item,
    itemName: capitalizeWords(item.itemName)
  }));

  return res.json({
    items: paginated,
    total,
    limit: pageLimit,
    offset: pageOffset,
    source: mongoService.isLive ? 'mongodb' : 'local_storage'
  });
});

// ----------------------------------------------------
// Batch Operations & Special Endpoints (Must be placed before /:id)
// ----------------------------------------------------
router.post('/batch-delete', async (req, res) => {
  const { ids, permanent, reason } = req.body;
  const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
  const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';
  const isPermanent = permanent === true;
  const deletionReason = (reason || 'Moved to Removed Items (Batch Delete)').toString();

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No item IDs provided for batch deletion.' });
  }

  const now = new Date();
  let deletedCount = 0;
  const deletedItems: LostItem[] = [];

  if (isPermanent) {
    for (const id of ids) {
      const idx = db.items.findIndex(i => i.id === id || i.code === id);
      if (idx >= 0) {
        if (db.items[idx].status === 'Handed Over') continue;
        db.items.splice(idx, 1);
        deletedCount++;
        if (mongoService.isLive) {
          mongoService.deleteItem(id).catch(() => {});
        }
      }
    }
    saveDatabase();
    await addAudit('Batch Items Permanently Deleted', 'item', `Permanently deleted ${deletedCount} items`, actor, role);
    return res.json({
      success: true,
      permanent: true,
      deletedCount,
      message: `Permanently deleted ${deletedCount} items.`
    });
  } else {
    for (const id of ids) {
      const idx = db.items.findIndex(i => i.id === id || i.code === id);
      if (idx >= 0) {
        if (db.items[idx].status === 'Handed Over') continue;
        db.items[idx].isDeleted = true;
        db.items[idx].deletedAt = now.toISOString();
        db.items[idx].deletedBy = actor;
        db.items[idx].deletedByRole = role;
        db.items[idx].deletionReason = deletionReason;
        db.items[idx].updatedAt = now.toISOString();
        if (!db.items[idx].timeline) db.items[idx].timeline = [];
        db.items[idx].timeline.push({
          id: `tl-${Date.now()}-${deletedCount}`,
          action: 'Item Moved to Removed Items (Batch)',
          performedBy: actor,
          timestamp: now.toISOString(),
          notes: `Moved to Removed Items in batch by ${role} ${actor}. Reason: ${deletionReason}`
        });
        deletedItems.push(db.items[idx]);
        deletedCount++;
        if (mongoService.isLive) {
          mongoService.updateItem(id, db.items[idx]).catch(() => {});
        }
      }
    }
    saveDatabase();
    await addAudit('Batch Items Moved to Trash', 'item', `Moved ${deletedCount} items to Removed Items`, actor, role);
    return res.json({
      success: true,
      permanent: false,
      deletedCount,
      items: deletedItems,
      message: `Successfully moved ${deletedCount} items to Removed Items.`
    });
  }
});

router.post('/batch-dispatch', async (req, res) => {
  const { ids, courierName, trackingNumber, destination, dispatchedTo, notes } = req.body;
  const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
  const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No item IDs provided for batch dispatch.' });
  }

  const now = new Date();
  let dispatchedCount = 0;
  const updatedItems: LostItem[] = [];

  for (const id of ids) {
    const idx = db.items.findIndex(i => i.id === id || i.code === id);
    if (idx >= 0) {
      const item = db.items[idx];
      const finder = item.employeeName || item.submittedByStaffName || 'Finder Staff';
      const targetReceiver = dispatchedTo || finder;

      item.status = 'Dispatched';
      item.updatedAt = now.toISOString();
      item.dispatchDetails = {
        courierName: courierName || 'Internal Staff Dispatch',
        trackingNumber: trackingNumber || `BATCH-DSP-${item.code}`,
        destination: destination || `Released to Finder Staff (${targetReceiver})`,
        dispatchedTo: targetReceiver,
        notes: notes || `Dispatched in batch to finder: ${targetReceiver}`,
        dispatchedAt: now.toISOString(),
        dispatchedBy: actor
      };

      if (!item.timeline) item.timeline = [];
      item.timeline.push({
        id: `tl-${Date.now()}-${dispatchedCount}`,
        action: 'Item Dispatched (Batch)',
        performedBy: actor,
        timestamp: now.toISOString(),
        notes: `Dispatched in batch via ${item.dispatchDetails.courierName} to ${targetReceiver}`
      });

      updatedItems.push(item);
      dispatchedCount++;

      if (mongoService.isLive) {
        mongoService.updateItem(id, item).catch(() => {});
      }
    }
  }

  saveDatabase();
  await addAudit('Batch Items Dispatched', 'item', `Dispatched ${dispatchedCount} items in batch`, actor, role);

  return res.json({
    success: true,
    dispatchedCount,
    items: updatedItems,
    message: `Successfully dispatched ${dispatchedCount} items.`
  });
});

router.post('/trash/restore-batch', async (req, res) => {
  const { ids } = req.body;
  const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
  const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No IDs provided for batch restore.' });
  }

  const now = new Date().toISOString();
  let restoredCount = 0;

  for (const id of ids) {
    const idx = db.items.findIndex(i => i.id === id || i.code === id);
    if (idx >= 0) {
      db.items[idx].isDeleted = false;
      db.items[idx].deletedAt = undefined;
      db.items[idx].deletionReason = undefined;
      db.items[idx].updatedAt = now;
      if (!db.items[idx].timeline) db.items[idx].timeline = [];
      db.items[idx].timeline.push({
        id: `tl-${Date.now()}-${restoredCount}`,
        action: 'Item Restored (Batch)',
        performedBy: actor,
        timestamp: now,
        notes: `Restored in batch by ${role} ${actor}`
      });
      restoredCount++;
      if (mongoService.isLive) {
        mongoService.updateItem(id, db.items[idx]).catch(() => {});
      }
    }
  }

  saveDatabase();
  await addAudit('Batch Items Restored', 'item', `Restored ${restoredCount} items from Removed Items`, actor, role);

  return res.json({
    success: true,
    restoredCount,
    message: `Successfully restored ${restoredCount} items.`
  });
});

router.post('/trash/delete-batch', async (req, res) => {
  const { ids } = req.body;
  const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
  const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No IDs provided for batch delete.' });
  }

  let deletedCount = 0;
  for (const id of ids) {
    const idx = db.items.findIndex(i => i.id === id || i.code === id);
    if (idx >= 0) {
      db.items.splice(idx, 1);
      deletedCount++;
      if (mongoService.isLive) {
        mongoService.deleteItem(id).catch(() => {});
      }
    }
  }

  saveDatabase();
  await addAudit('Batch Items Permanently Deleted', 'item', `Permanently deleted ${deletedCount} items from Trash`, actor, role);

  return res.json({
    success: true,
    deletedCount,
    message: `Permanently deleted ${deletedCount} items.`
  });
});

router.post('/trash/empty', async (req, res) => {
  const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
  const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

  const deletedIds: string[] = [];
  db.items = db.items.filter(item => {
    if (item.isDeleted) {
      deletedIds.push(item.id);
      return false;
    }
    return true;
  });

  saveDatabase();

  if (mongoService.isLive) {
    deletedIds.forEach(id => {
      mongoService.deleteItem(id).catch(() => {});
    });
  }

  await addAudit('Recycle Bin Emptied', 'item', `Emptied trash (${deletedIds.length} items permanently deleted)`, actor, role);

  return res.json({
    success: true,
    count: deletedIds.length,
    message: `Recycle Bin emptied. ${deletedIds.length} items permanently removed.`
  });
});

router.post('/import', async (req, res) => {
  const { items: rawItems, mode = 'append' } = req.body;
  const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
  const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return res.status(400).json({ error: 'No valid items data provided for import.' });
  }

  const now = new Date();
  const todayIso = now.toISOString().split('T')[0];

  const processedItems: LostItem[] = [];
  for (let index = 0; index < rawItems.length; index++) {
    const raw: any = rawItems[index];
    const dateFound = raw.dateFound || todayIso;
    const prefix = db.settings.codePrefix || 'LF';
    const allExisting = [...db.items, ...processedItems];
    const itemCode = raw.code || generateUniqueItemCode(allExisting, prefix, dateFound);
    const itemId = raw.id || `item-imp-${Date.now()}-${index}`;
    const dispatchDays = Number(raw.dispatchDurationDays) || 90;

    let deadline = raw.dispatchDeadline;
    if (!deadline && dateFound) {
      const d = new Date(dateFound);
      d.setDate(d.getDate() + dispatchDays);
      deadline = d.toISOString().split('T')[0];
    }

    const item: LostItem = {
      id: itemId,
      code: itemCode,
      itemName: raw.itemName || raw.name || raw.description || 'Imported Item',
      category: (raw.category as any) || 'Other',
      description: raw.description || raw.itemName || '',
      dateFound: dateFound,
      timeFound: raw.timeFound || '12:00',
      locationFound: raw.locationFound || raw.location || 'Hotel Premises',
      roomNumber: raw.roomNumber || '',
      guestName: raw.guestName || '',
      employeeName: raw.employeeName || raw.foundBy || actor,
      storeLocation: raw.storeLocation || db.settings.defaultStoreLocation || 'HK Office',
      dispatchDurationDays: dispatchDays,
      dispatchDeadline: deadline || '',
      status: (raw.status as any) || 'Stored',
      isApproved: raw.isApproved ?? true,
      approvalStatus: raw.approvalStatus || 'approved',
      recordedBy: raw.recordedBy || actor,
      createdAt: raw.createdAt || now.toISOString(),
      updatedAt: raw.updatedAt || now.toISOString(),
      timeline: raw.timeline || [
        {
          id: `tl-imp-${Date.now()}-${index}`,
          action: 'Item Imported',
          performedBy: actor,
          timestamp: now.toISOString(),
          notes: `Imported via Data Import batch by ${role} ${actor}`
        }
      ]
    };

    processedItems.push(item);
  }

  if (mode === 'replace') {
    db.items = processedItems;
  } else {
    for (const item of processedItems) {
      const existingIdx = db.items.findIndex(i => i.id === item.id || i.code === item.code);
      if (existingIdx >= 0) {
        db.items[existingIdx] = { ...db.items[existingIdx], ...item };
      } else {
        db.items.unshift(item);
      }
    }
  }

  saveDatabase();

  if (mongoService.isLive) {
    try {
      await mongoService.importItems(processedItems, mode);
    } catch (err: any) {
      console.warn('MongoDB import error:', err.message);
    }
  }

  await addAudit(
    'Data Imported',
    'item',
    `Imported ${processedItems.length} items (${mode} mode) by ${actor}`,
    actor,
    role
  );

  return res.json({
    success: true,
    count: processedItems.length,
    mode,
    items: db.items,
    message: `Successfully imported ${processedItems.length} items.`
  });
});

// ----------------------------------------------------
// POST /api/items (Create New Item)
// ----------------------------------------------------
router.post('/', async (req, res) => {
  const body = req.body;
  const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
  const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';
  const isAdminTier = ['Super Admin', 'Admin', 'Manager', 'Supervisor'].includes(role);

  const foundDate = body.dateFound || new Date().toISOString().split('T')[0];
  const prefix = db.settings.codePrefix || 'LF';

  if (body.code && db.items.some(i => i.code?.trim().toUpperCase() === body.code.trim().toUpperCase())) {
    return res.status(400).json({
      success: false,
      errorType: 'DUPLICATE_ITEM_CODE',
      error: `Already exists: Item with tracking code "${body.code.trim()}" already exists in the database. Duplicate item tracking codes are not permitted.`
    });
  }

  const autoCode = generateUniqueItemCode(db.items, prefix, foundDate);
  const duration = parseInt(body.dispatchDurationDays || '90', 10);
  const deadlineDate = new Date(foundDate);
  deadlineDate.setDate(deadlineDate.getDate() + duration);
  const computedDeadline = deadlineDate.toISOString().split('T')[0];

  const isApproved = isAdminTier && body.isApproved !== false;
  const approvalStatus: 'approved' | 'pending' = isApproved ? 'approved' : 'pending';
  const status: LostItem['status'] = isApproved ? ((body.status as LostItem['status']) || 'Stored') : 'Pending Approval';
  const employeeName = isAdminTier ? (body.employeeName || actor) : actor;
  const recordedBy = isApproved ? actor : 'Pending Approval';

  let itemImageUrl = body.imageUrl || '';
  if (cloudinaryService.isConfigured() && typeof itemImageUrl === 'string' && itemImageUrl.startsWith('data:')) {
    try {
      const cloudRes = await cloudinaryService.upload(itemImageUrl, {
        folder: 'warwick_items',
        resourceType: 'image',
        publicId: `item_${body.code || autoCode}_${Date.now()}`
      });
      itemImageUrl = cloudRes.secureUrl;
    } catch (e: any) {
      console.warn('[Cloudinary] Item image upload fallback:', e.message);
    }
  }

  const newItem: LostItem = {
    id: `item-${Date.now()}`,
    code: body.code || autoCode,
    itemName: capitalizeWords(body.itemName || body.description?.substring(0, 30) || 'Lost Item'),
    category: body.category || 'Other',
    description: body.description || '',
    brand: body.brand || '',
    color: body.color || '',
    dateFound: foundDate,
    timeFound: body.timeFound || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    locationFound: body.locationFound || (body.roomNumber ? `Room ${body.roomNumber}` : 'General Hotel Area'),
    roomNumber: body.roomNumber || '',
    guestName: body.guestName || 'Unknown',
    employeeName,
    storeLocation: body.storeLocation || 'HK Office',
    dispatchDurationDays: duration,
    dispatchDeadline: body.dispatchDeadline || computedDeadline,
    status,
    recordedBy,
    imageUrl: itemImageUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isApproved,
    approvalStatus,
    approvedBy: isApproved ? actor : undefined,
    approvedAt: isApproved ? new Date().toISOString() : undefined,
    submittedByStaffName: actor,
    timeline: [
      {
        id: `tl-${Date.now()}-1`,
        action: isApproved ? 'Item Registered & Stored' : 'Submitted by Staff (Pending Approval)',
        actionType: 'create',
        performedBy: actor,
        performedByRole: role,
        timestamp: new Date().toISOString(),
        notes: isApproved
          ? `Registered by ${role} ${actor}. Found by staff "${employeeName}" in ${body.roomNumber ? `Room ${body.roomNumber}` : body.locationFound || 'Hotel premises'}. Assigned to storage "${body.storeLocation || 'HK Office'}".`
          : `Submitted by Staff ${actor} (${role}). Awaiting Admin / Manager approval.`
      }
    ]
  };

  db.items.unshift(newItem);
  saveDatabase();

  if (mongoService.isLive) {
    try {
      await mongoService.insertItem(newItem);
    } catch (err: any) {
      console.warn('MongoDB insertItem error:', err.message);
    }
  }

  const auditAction = isApproved ? 'Item Registered' : 'Item Submission Pending Approval';
  const auditDesc = isApproved
    ? `Registered item ${newItem.code} (${newItem.itemName}) recorded by ${actor}`
    : `Staff ${actor} submitted new item ${newItem.code} for admin approval`;

  await addAudit(auditAction, 'item', auditDesc, actor, role, newItem.code);

  if (!isApproved) {
    createNotificationHelper({
      title: `📦 Storage Approval Request: ${newItem.code}`,
      message: `Staff member "${actor}" registered a lost item "${newItem.itemName}" (${newItem.code}) found in ${newItem.locationFound}. Awaiting Admin / Supervisor approval.`,
      type: 'store_request',
      priority: 'high',
      targetType: 'roles',
      targetRoles: ['Super Admin', 'Admin', 'Manager', 'Supervisor'],
      itemId: newItem.id,
      itemCode: newItem.code,
      senderName: actor,
      senderRole: role
    }).catch(() => {});
  } else {
    createNotificationHelper({
      title: `📦 New Item Stored: ${newItem.code}`,
      message: `Item ${newItem.code} (${newItem.itemName}) was registered in "${newItem.storeLocation}" by ${actor}.`,
      type: 'notice',
      priority: 'normal',
      targetType: 'all',
      itemId: newItem.id,
      itemCode: newItem.code,
      senderName: actor,
      senderRole: role
    }).catch(() => {});
  }

  return res.status(201).json({
    success: true,
    item: newItem,
    message: isApproved
      ? `Item ${newItem.code} registered and stored successfully.`
      : `Item ${newItem.code} submitted successfully. Waiting for Admin / Supervisor approval.`
  });
});

// ----------------------------------------------------
// Specific Item ID routes (/api/items/:id)
// ----------------------------------------------------
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const item = await findItemByIdOrCode(id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found in database' });
  }
  return res.json({ item, source: mongoService.isLive ? 'mongodb' : 'local' });
});

router.post('/:id/approve', async (req, res) => {
  const { id } = req.params;
  const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
  const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';
  const isAdminTier = ['Super Admin', 'Admin', 'Manager', 'Supervisor'].includes(role);

  if (!isAdminTier) {
    return res.status(403).json({ error: 'Permission denied. Only Admin, Manager, or Supervisor can approve items.' });
  }

  const currentItem = await findItemByIdOrCode(id);
  if (!currentItem) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const itemIndex = db.items.findIndex(i => i.id === currentItem.id || i.code === currentItem.code);
  const originalSubmitter = currentItem.employeeName || currentItem.submittedByStaffName || currentItem.foundBy || actor;
  const preservedRecordedBy = (currentItem.recordedBy && currentItem.recordedBy !== 'Pending Approval')
    ? currentItem.recordedBy
    : originalSubmitter;

  const updatedItem: LostItem = {
    ...currentItem,
    isApproved: true,
    approvalStatus: 'approved',
    status: 'Stored',
    recordedBy: preservedRecordedBy,
    approvedBy: actor,
    approvedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeline: [
      ...(currentItem.timeline || []),
      {
        id: `tl-${Date.now()}`,
        action: 'Item Approved by Admin',
        actionType: 'approve',
        performedBy: actor,
        performedByRole: role,
        timestamp: new Date().toISOString(),
        notes: `Approved by ${role} "${actor}". Verified and stored in active inventory.`
      }
    ]
  };

  if (itemIndex >= 0) {
    db.items[itemIndex] = updatedItem;
  } else {
    db.items.unshift(updatedItem);
  }
  saveDatabase();

  if (mongoService.isLive) {
    try {
      await mongoService.updateItem(id, updatedItem);
    } catch (err: any) {
      console.warn('MongoDB approve updateItem error:', err.message);
    }
  }

  await addAudit('Item Approved', 'item', `Item ${updatedItem.code} approved and recorded by ${actor}`, actor, role, updatedItem.code);

  const targetStaff = updatedItem.submittedByStaffName || updatedItem.employeeName || (updatedItem.recordedBy !== 'Pending Approval' ? updatedItem.recordedBy : '') || '';
  const targetStaffId = updatedItem.submittedByStaffId;
  const staffMember = db.staff.find(s => 
    (targetStaffId && (s.id === targetStaffId || s.userId === targetStaffId)) ||
    (s.name && targetStaff && s.name.toLowerCase().trim() === targetStaff.toLowerCase().trim()) ||
    (s.userId && targetStaff && s.userId.toLowerCase().trim() === targetStaff.toLowerCase().trim())
  );

  createNotificationHelper({
    title: `✅ Item Approved: ${updatedItem.code}`,
    message: `Your submitted item "${updatedItem.itemName || updatedItem.code}" has been approved by ${actor} (${role}) and safely stored in "${updatedItem.storeLocation}".`,
    type: 'item_approved',
    priority: 'normal',
    targetType: 'individual',
    targetStaffName: targetStaff || staffMember?.name,
    targetStaffEmail: staffMember?.email,
    targetUserId: targetStaffId || staffMember?.id || staffMember?.userId,
    itemId: updatedItem.id,
    itemCode: updatedItem.code,
    senderName: actor,
    senderRole: role
  }).catch(() => {});

  return res.json({
    success: true,
    item: updatedItem,
    message: `Item ${updatedItem.code} approved successfully and recorded by ${actor}.`
  });
});

router.post('/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
  const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';
  const isAdminTier = ['Super Admin', 'Admin', 'Manager', 'Supervisor'].includes(role);

  if (!isAdminTier) {
    return res.status(403).json({ error: 'Permission denied. Only Admin, Manager, or Supervisor can reject items.' });
  }

  const currentItem = await findItemByIdOrCode(id);
  if (!currentItem) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const itemIndex = db.items.findIndex(i => i.id === currentItem.id || i.code === currentItem.code);
  const cleanReason = (reason && typeof reason === 'string' && reason.trim())
    ? reason.trim()
    : 'Submission was rejected during supervisor verification.';

  const updatedItem: LostItem = {
    ...currentItem,
    isApproved: false,
    approvalStatus: 'rejected',
    status: 'Disposed',
    rejectionReason: cleanReason,
    rejectedBy: actor,
    rejectedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeline: [
      ...(currentItem.timeline || []),
      {
        id: `tl-${Date.now()}`,
        action: 'Item Submission Rejected',
        actionType: 'reject',
        performedBy: actor,
        performedByRole: role,
        timestamp: new Date().toISOString(),
        notes: `Rejected by ${role} "${actor}". Reason: ${cleanReason}`
      }
    ]
  };

  if (itemIndex >= 0) {
    db.items[itemIndex] = updatedItem;
  } else {
    db.items.unshift(updatedItem);
  }
  saveDatabase();

  if (mongoService.isLive) {
    try {
      await mongoService.updateItem(id, updatedItem);
    } catch (err: any) {
      console.warn('MongoDB reject updateItem error:', err.message);
    }
  }

  await addAudit('Item Rejected', 'item', `Item ${updatedItem.code} rejected by ${actor}. Reason: ${cleanReason}`, actor, role, updatedItem.code);

  const targetStaff = updatedItem.submittedByStaffName || updatedItem.employeeName || (updatedItem.recordedBy !== 'Pending Approval' ? updatedItem.recordedBy : '') || '';
  const targetStaffId = updatedItem.submittedByStaffId;
  const staffMember = db.staff.find(s => 
    (targetStaffId && (s.id === targetStaffId || s.userId === targetStaffId)) ||
    (s.name && targetStaff && s.name.toLowerCase().trim() === targetStaff.toLowerCase().trim()) ||
    (s.userId && targetStaff && s.userId.toLowerCase().trim() === targetStaff.toLowerCase().trim())
  );

  await createNotificationHelper({
    title: `❌ Item Submission Rejected: ${updatedItem.code}`,
    message: `Your submitted item "${updatedItem.itemName || updatedItem.code}" was rejected by ${actor} (${role}). Reason: ${cleanReason}`,
    type: 'item_rejected',
    priority: 'high',
    targetType: 'individual',
    targetStaffName: targetStaff || staffMember?.name,
    targetStaffEmail: staffMember?.email,
    targetUserId: targetStaffId || staffMember?.id || staffMember?.userId,
    itemId: updatedItem.id,
    itemCode: updatedItem.code,
    senderName: actor,
    senderRole: role
  }).catch(err => console.warn('createNotificationHelper error on reject:', err));

  return res.json({
    success: true,
    item: updatedItem,
    message: `Item ${updatedItem.code} rejected.`
  });
});

const handleItemUpdate = async (req: any, res: any) => {
  const { id } = req.params;
  const body = req.body;
  const actor = req.headers['x-user-name'] as string || 'MD ABU SAYEED RIDAY';
  const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

  const currentItem = await findItemByIdOrCode(id);
  if (!currentItem) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const itemIndex = db.items.findIndex(i => i.id === currentItem.id || i.code === currentItem.code);

  if (currentItem.status === 'Handed Over') {
    return res.status(403).json({ error: 'Handed Over items are locked and cannot be edited.' });
  }

  if (body.code && body.code.trim().toUpperCase() !== currentItem.code?.trim().toUpperCase()) {
    const duplicateItem = db.items.find(i => i.id !== currentItem.id && i.code?.trim().toUpperCase() === body.code.trim().toUpperCase());
    if (duplicateItem) {
      return res.status(400).json({
        success: false,
        errorType: 'DUPLICATE_ITEM_CODE',
        error: `Already exists: Item with tracking code "${body.code.trim()}" already exists in the database (${duplicateItem.itemName || 'Existing Item'}). Duplicate tracking codes are not permitted.`
      });
    }
  }

  const protectedEmployeeName = currentItem.employeeName || body.employeeName;

  const changes: Array<{ field: string; label: string; from: any; to: any }> = [];
  const fieldLabels: Record<string, string> = {
    itemName: 'Item Name',
    description: 'Description',
    category: 'Category',
    storeLocation: 'Storage Location',
    roomNumber: 'Room Number',
    guestName: 'Guest Name',
    brand: 'Brand',
    color: 'Color',
    dispatchDurationDays: 'Dispatch Duration',
    dispatchDeadline: 'Dispatch Deadline',
    status: 'Status',
    locationFound: 'Location Found',
    imageUrl: 'Item Photo'
  };

  for (const [key, label] of Object.entries(fieldLabels)) {
    if (body[key] !== undefined && String(body[key]).trim() !== String((currentItem as any)[key] || '').trim()) {
      changes.push({
        field: key,
        label,
        from: (currentItem as any)[key] || 'None',
        to: body[key] || 'None'
      });
    }
  }

  let activityNotes = body.updateNotes;
  if (!activityNotes && changes.length > 0) {
    activityNotes = changes.map(c => `${c.label}: "${c.from}" → "${c.to}"`).join(', ');
  } else if (!activityNotes) {
    activityNotes = 'Item details updated via dashboard';
  }

  let updatedItem: LostItem = {
    ...currentItem,
    ...body,
    itemName: capitalizeWords(body.itemName || currentItem.itemName),
    employeeName: protectedEmployeeName,
    updatedAt: new Date().toISOString()
  };

  if (!updatedItem.timeline) updatedItem.timeline = [];
  updatedItem.timeline.push({
    id: `tl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    action: 'Item Information Updated',
    actionType: 'update',
    performedBy: actor,
    performedByRole: role,
    timestamp: new Date().toISOString(),
    notes: activityNotes,
    changes: changes.length > 0 ? changes : undefined
  });

  if (itemIndex >= 0) {
    db.items[itemIndex] = updatedItem;
  } else {
    db.items.unshift(updatedItem);
  }
  saveDatabase();

  if (mongoService.isLive) {
    try {
      const mongoRes = await mongoService.updateItem(id, updatedItem);
      if (mongoRes) {
        updatedItem = mongoRes;
        if (itemIndex >= 0) db.items[itemIndex] = mongoRes;
      }
    } catch (err: any) {
      console.warn('MongoDB updateItem error:', err.message);
    }
  }

  const statusChange = changes.find(c => c.field === 'status');
  const isStatusChanged = !statusChange;
  const auditAction = isStatusChanged
    ? `Status Changed: ${statusChange?.from} ➔ ${statusChange?.to}`
    : 'Item Updated';

  await addAudit(
    auditAction,
    'item',
    isStatusChanged
      ? `Status updated from "${statusChange?.from}" to "${statusChange?.to}" for ${updatedItem.code} by ${actor}. ${activityNotes}`
      : `Updated details for item ${updatedItem.code}: ${activityNotes}`,
    actor,
    role,
    updatedItem.code,
    {
      actionType: isStatusChanged ? 'status_change' : 'update',
      itemCode: updatedItem.code,
      itemName: updatedItem.itemName,
      category: updatedItem.category,
      previousStatus: statusChange ? statusChange.from : currentItem.status,
      newStatus: statusChange ? statusChange.to : updatedItem.status,
      performedByEmail: req.headers['x-user-email'] as string,
      reason: body.updateNotes,
      changes: changes.length > 0 ? changes : undefined,
      ip: (req.headers['x-forwarded-for'] as string) || req.ip,
      deviceType: req.headers['user-agent']?.includes('Mobi') ? 'Mobile' : 'Desktop'
    }
  );

  return res.json({
    success: true,
    item: updatedItem,
    message: 'Item updated successfully.'
  });
};

router.put('/:id', handleItemUpdate);
router.patch('/:id', handleItemUpdate);

router.post('/:id/handover', async (req, res) => {
  const { id } = req.params;
  const { receiverName, contactNumber, remarks, idType, idNumber } = req.body;
  const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
  const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

  const canHandover = role === 'Super Admin' || ['Admin', 'Manager'].includes(role) || actorHasPermission(req, 'handover');
  if (!canHandover) {
    return res.status(403).json({ error: 'Permission denied. You do not have permission to perform Handover. Contact an Administrator.' });
  }

  const item = await findItemByIdOrCode(id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const itemIndex = db.items.findIndex(i => i.id === item.id || i.code === item.code);
  const now = new Date();
  const formattedDate = `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;

  item.status = 'Handed Over';
  item.updatedAt = now.toISOString();
  item.handoverDetails = {
    receiverName: receiverName || 'Guest',
    contactNumber: contactNumber || '0',
    idType,
    idNumber,
    handoverDate: formattedDate,
    handedOverBy: actor,
    remarks: remarks || 'Verified with room reservation and guest identity.'
  };

  if (!item.timeline) item.timeline = [];
  item.timeline.push({
    id: `tl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    action: 'Item Handed Over to Guest',
    actionType: 'handover',
    performedBy: actor,
    performedByRole: role,
    timestamp: now.toISOString(),
    notes: `Handed over to "${receiverName}" (Contact: ${contactNumber}) by ${role} "${actor}". ID: ${idType || 'Verified'} ${idNumber || ''}.${remarks ? ' Remarks: ' + remarks : ''}`,
    meta: {
      receiverName,
      contactNumber,
      idType,
      idNumber,
      remarks
    }
  });

  if (itemIndex >= 0) {
    db.items[itemIndex] = item;
  }
  saveDatabase();

  if (mongoService.isLive) {
    try {
      await mongoService.updateItem(id, item);
    } catch (err: any) {
      console.warn('MongoDB handover update error:', err.message);
    }
  }

  await addAudit(
    'Item Handed Over to Guest',
    'item',
    `Item ${item.code} (${item.itemName || 'Lost Item'}) handed over to guest "${receiverName}". Contact: ${contactNumber}. Verified by Admin ${actor}.`,
    actor,
    role,
    item.code,
    {
      actionType: 'handover',
      itemCode: item.code,
      itemName: item.itemName,
      category: item.category,
      previousStatus: 'Stored',
      newStatus: 'Handed Over',
      performedByEmail: req.headers['x-user-email'] as string,
      reason: remarks || 'Verified with room reservation and guest identity.',
      changes: [
        { field: 'status', label: 'Status', from: 'Stored', to: 'Handed Over' },
        { field: 'receiverName', label: 'Receiver Name', from: 'None', to: receiverName }
      ],
      ip: (req.headers['x-forwarded-for'] as string) || req.ip,
      deviceType: req.headers['user-agent']?.includes('Mobi') ? 'Mobile' : 'Desktop',
      meta: {
        receiverName,
        contactNumber,
        idType,
        idNumber,
        remarks
      }
    }
  );

  const targetStaff = item.employeeName || item.submittedByStaffName;
  createNotificationHelper({
    title: `🤝 Item Handed Over: ${item.code}`,
    message: `Item ${item.code} (${item.itemName || 'Lost Item'}) found by "${targetStaff}" has been officially handed over to guest "${receiverName}" by ${actor}.`,
    type: 'item_handover',
    priority: 'normal',
    targetType: 'all',
    targetStaffName: targetStaff,
    itemId: item.id,
    itemCode: item.code,
    senderName: actor,
    senderRole: role
  }).catch(() => {});

  return res.json({
    success: true,
    item,
    message: `Item ${item.code} successfully handed over to ${receiverName}.`
  });
});

router.post('/:id/return-to-store', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body || {};
  const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
  const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

  const canReturnToStore = role === 'Super Admin' || ['Admin', 'Manager'].includes(role) || actorHasPermission(req, 'handover') || actorHasPermission(req, 'edit');
  if (!canReturnToStore) {
    return res.status(403).json({ error: 'Permission denied. You do not have permission to return items to store.' });
  }

  const item = await findItemByIdOrCode(id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  let handoverTimestamp: number | null = null;
  if (item.timeline && Array.isArray(item.timeline)) {
    const hEvt = [...item.timeline].reverse().find(t =>
      t.actionType === 'handover' || (t.action && t.action.toLowerCase().includes('handed over'))
    );
    if (hEvt?.timestamp) {
      const t = new Date(hEvt.timestamp).getTime();
      if (!isNaN(t)) handoverTimestamp = t;
    }
  }
  if (!handoverTimestamp && item.handoverDetails?.handoverDate) {
    const t = new Date(item.handoverDetails.handoverDate).getTime();
    if (!isNaN(t)) handoverTimestamp = t;
  }
  if (!handoverTimestamp && item.updatedAt) {
    const t = new Date(item.updatedAt).getTime();
    if (!isNaN(t)) handoverTimestamp = t;
  }

  if (handoverTimestamp && (Date.now() - handoverTimestamp > 24 * 60 * 60 * 1000)) {
    return res.status(400).json({
      error: 'Return to Store expired. Items can only be returned to store within 24 hours of handover.'
    });
  }

  const itemIndex = db.items.findIndex(i => i.id === item.id || i.code === item.code);
  const previousStatus = item.status;
  const now = new Date();

  const updatedItem: LostItem = {
    ...item,
    status: 'Stored',
    handoverDetails: undefined,
    dispatchDetails: undefined,
    updatedAt: now.toISOString(),
    timeline: [
      ...(item.timeline || []),
      {
        id: `tl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        action: 'Item Returned to Store',
        actionType: 'return_to_store',
        performedBy: actor,
        performedByRole: role,
        timestamp: now.toISOString(),
        notes: `Reverted status from "${previousStatus}" back to active "Stored" inventory by ${role} "${actor}".${reason ? ' Reason: ' + reason : ''}`
      }
    ]
  };

  if (itemIndex >= 0) {
    db.items[itemIndex] = updatedItem;
  } else {
    db.items.unshift(updatedItem);
  }
  saveDatabase();

  if (mongoService.isLive) {
    try {
      await mongoService.updateItem(id, updatedItem);
    } catch (err: any) {
      console.warn('MongoDB return-to-store update error:', err.message);
    }
  }

  await addAudit(
    'Status Changed: Returned to Store',
    'item',
    `Item ${updatedItem.code} status reverted from "${previousStatus}" back to "Stored" by Admin ${actor}.${reason ? ' Reason: ' + reason : ''}`,
    actor,
    role,
    updatedItem.code,
    {
      actionType: 'return_to_store',
      itemCode: updatedItem.code,
      itemName: updatedItem.itemName,
      category: updatedItem.category,
      previousStatus,
      newStatus: 'Stored',
      performedByEmail: req.headers['x-user-email'] as string,
      reason,
      changes: [
        { field: 'status', label: 'Status', from: previousStatus, to: 'Stored' }
      ],
      ip: (req.headers['x-forwarded-for'] as string) || req.ip,
      deviceType: req.headers['user-agent']?.includes('Mobi') ? 'Mobile' : 'Desktop'
    }
  );

  return res.json({
    success: true,
    item: updatedItem,
    message: `Item ${updatedItem.code} successfully returned to Stored inventory.`
  });
});

router.post('/:id/dispatch', async (req, res) => {
  const { id } = req.params;
  const { courierName, trackingNumber, destination, remarks, dispatchedTo, notes } = req.body;
  const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
  const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

  const canDispatch = role === 'Super Admin' || ['Admin', 'Manager'].includes(role) || actorHasPermission(req, 'dispatch');
  if (!canDispatch) {
    return res.status(403).json({ error: 'Permission denied. You do not have permission to dispatch items.' });
  }

  const item = await findItemByIdOrCode(id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const itemIndex = db.items.findIndex(i => i.id === item.id || i.code === item.code);
  const now = new Date();
  const formattedDate = `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;

  const targetRecipient = dispatchedTo || destination || 'Finder Staff / Courier';
  const courierTag = courierName || 'Internal Staff Dispatch';
  const trackingTag = trackingNumber || `DSP-${item.code}`;

  item.status = 'Dispatched';
  item.updatedAt = now.toISOString();
  item.dispatchDetails = {
    courierName: courierTag,
    trackingNumber: trackingTag,
    destination: destination || `Released to ${targetRecipient}`,
    dispatchedDate: formattedDate,
    dispatchedBy: actor,
    dispatchedTo: targetRecipient,
    remarks: remarks || notes || 'Dispatched after custody period expiry / guest release authorization.'
  };

  if (!item.timeline) item.timeline = [];
  item.timeline.push({
    id: `tl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    action: 'Item Dispatched',
    actionType: 'dispatch',
    performedBy: actor,
    performedByRole: role,
    timestamp: now.toISOString(),
    notes: `Dispatched by ${role} "${actor}". Released to "${targetRecipient}" via ${courierTag} (Ref/Tracking: ${trackingTag}).${notes || remarks ? ' Note: ' + (notes || remarks) : ''}`,
    meta: {
      courierName: courierTag,
      trackingNumber: trackingTag,
      destination: destination || targetRecipient,
      dispatchedTo: targetRecipient
    }
  });

  if (itemIndex >= 0) {
    db.items[itemIndex] = item;
  }
  saveDatabase();

  if (mongoService.isLive) {
    try {
      await mongoService.updateItem(id, item);
    } catch (err: any) {
      console.warn('MongoDB dispatch update error:', err.message);
    }
  }

  await addAudit(
    'Status Changed: Stored ➔ Dispatched',
    'item',
    `Item ${item.code} (${item.itemName || 'Lost Item'}) dispatched to "${targetRecipient}" via ${courierTag} (Tracking: ${trackingTag}) by ${actor}.`,
    actor,
    role,
    item.code,
    {
      actionType: 'dispatch',
      itemCode: item.code,
      itemName: item.itemName,
      category: item.category,
      previousStatus: 'Stored',
      newStatus: 'Dispatched',
      performedByEmail: req.headers['x-user-email'] as string,
      reason: remarks || notes || 'Dispatched after custody period expiry / guest release authorization.',
      changes: [
        { field: 'status', label: 'Status', from: 'Stored', to: 'Dispatched' },
        { field: 'courierName', label: 'Courier', from: 'None', to: courierTag },
        { field: 'dispatchedTo', label: 'Recipient', from: 'None', to: targetRecipient }
      ],
      ip: (req.headers['x-forwarded-for'] as string) || req.ip,
      deviceType: req.headers['user-agent']?.includes('Mobi') ? 'Mobile' : 'Desktop',
      meta: {
        courierName: courierTag,
        trackingNumber: trackingTag,
        destination: destination || targetRecipient,
        dispatchedTo: targetRecipient,
        remarks
      }
    }
  );

  const targetStaff = item.employeeName || item.submittedByStaffName;
  createNotificationHelper({
    title: `🚚 Item Dispatched: ${item.code}`,
    message: `Item ${item.code} (${item.itemName || 'Lost Item'}) was dispatched to "${targetRecipient}" by ${actor}.`,
    type: 'item_dispatched',
    priority: 'normal',
    targetType: 'all',
    targetStaffName: targetStaff,
    itemId: item.id,
    itemCode: item.code,
    senderName: actor,
    senderRole: role
  }).catch(() => {});

  return res.json({
    success: true,
    item,
    message: `Item ${item.code} marked as dispatched.`
  });
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const isPermanent = req.query.permanent === 'true' || req.body?.permanent === true;
  const deletionReason = (req.body?.reason || req.query.reason || 'Moved to Removed Items').toString();
  const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
  const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

  const canDelete = role === 'Super Admin' || ['Admin', 'Manager'].includes(role) || actorHasPermission(req, 'delete') || actorHasPermission(req, 'removed_items');
  if (!canDelete) {
    return res.status(403).json({ error: 'Permission denied. You do not have permission to delete items.' });
  }

  const currentItem = await findItemByIdOrCode(id);
  if (!currentItem) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const itemIndex = db.items.findIndex(i => i.id === id || i.code === id);

  if (currentItem.status === 'Handed Over') {
    return res.status(403).json({ error: 'Handed Over items are locked and cannot be deleted.' });
  }

  const code = currentItem.code;

  if (isPermanent) {
    if (itemIndex >= 0) {
      db.items.splice(itemIndex, 1);
    }
    saveDatabase();

    if (mongoService.isLive) {
      try {
        await mongoService.deleteItem(id);
      } catch (err: any) {
        console.warn('MongoDB deleteItem error:', err.message);
      }
    }

    await addAudit('Item Permanently Deleted', 'item', `Permanently deleted item ${code}`, actor, role, code);

    return res.json({
      success: true,
      permanent: true,
      message: `Item ${code} permanently deleted.`
    });
  } else {
    const now = new Date();
    const updatedItem: LostItem = {
      ...currentItem,
      isDeleted: true,
      deletedAt: now.toISOString(),
      deletedBy: actor,
      deletedByRole: role,
      deletionReason: deletionReason,
      updatedAt: now.toISOString(),
      timeline: [
        ...(currentItem.timeline || []),
        {
          id: `tl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          action: 'Item Moved to Removed Items',
          actionType: 'delete',
          performedBy: actor,
          performedByRole: role,
          timestamp: now.toISOString(),
          notes: `Moved to Removed Items (Trash) by ${role} "${actor}". Retention: 60 days. Reason: ${deletionReason}`
        }
      ]
    };

    if (itemIndex >= 0) {
      db.items[itemIndex] = updatedItem;
    } else {
      db.items.push(updatedItem);
    }
    saveDatabase();

    if (mongoService.isLive) {
      try {
        await mongoService.updateItem(id, updatedItem);
      } catch (err: any) {
        console.warn('MongoDB soft delete error:', err.message);
      }
    }

    await addAudit(
      'Item Moved to Trash',
      'item',
      `Item ${code} (${currentItem.itemName || 'Lost Item'}) moved to Removed Items (retained for 60 days). Reason: ${deletionReason}`,
      actor,
      role,
      code,
      {
        actionType: 'trash',
        itemCode: code,
        itemName: currentItem.itemName,
        category: currentItem.category,
        previousStatus: currentItem.status,
        performedByEmail: req.headers['x-user-email'] as string,
        reason: deletionReason,
        changes: [
          { field: 'isDeleted', label: 'Trash Status', from: false, to: true },
          { field: 'deletionReason', label: 'Reason', from: 'None', to: deletionReason }
        ],
        ip: (req.headers['x-forwarded-for'] as string) || req.ip,
        deviceType: req.headers['user-agent']?.includes('Mobi') ? 'Mobile' : 'Desktop'
      }
    );

    return res.json({
      success: true,
      permanent: false,
      item: updatedItem,
      message: `Item ${code} moved to Removed Items. It will be kept for 60 days.`
    });
  }
});

router.post('/:id/restore', async (req, res) => {
  const { id } = req.params;
  const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
  const role = (req.headers['x-user-role'] as User['role']) || 'Super Admin';

  const currentItem = await findItemByIdOrCode(id);
  if (!currentItem) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const itemIndex = db.items.findIndex(i => i.id === id || i.code === id);
  const now = new Date();
  const updatedItem: LostItem = {
    ...currentItem,
    isDeleted: false,
    deletedAt: undefined,
    deletedBy: undefined,
    deletedByRole: undefined,
    deletionReason: undefined,
    updatedAt: now.toISOString(),
    timeline: [
      ...(currentItem.timeline || []),
      {
        id: `tl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        action: 'Item Restored to Inventory',
        actionType: 'restore',
        performedBy: actor,
        performedByRole: role,
        timestamp: now.toISOString(),
        notes: `Restored back to active inventory from Removed Items by ${role} "${actor}".`
      }
    ]
  };

  if (itemIndex >= 0) {
    db.items[itemIndex] = updatedItem;
  } else {
    db.items.unshift(updatedItem);
  }
  saveDatabase();

  if (mongoService.isLive) {
    try {
      await mongoService.updateItem(id, updatedItem);
    } catch (err: any) {
      console.warn('MongoDB restore error:', err.message);
    }
  }

  await addAudit(
    'Item Restored to Inventory',
    'item',
    `Item ${updatedItem.code} (${updatedItem.itemName || 'Lost Item'}) restored from Removed Items back to active inventory by ${actor}.`,
    actor,
    role,
    updatedItem.code,
    {
      actionType: 'restore',
      itemCode: updatedItem.code,
      itemName: updatedItem.itemName,
      category: updatedItem.category,
      newStatus: updatedItem.status,
      performedByEmail: req.headers['x-user-email'] as string,
      changes: [
        { field: 'isDeleted', label: 'Trash Status', from: true, to: false }
      ],
      ip: (req.headers['x-forwarded-for'] as string) || req.ip,
      deviceType: req.headers['user-agent']?.includes('Mobi') ? 'Mobile' : 'Desktop'
    }
  );

  return res.json({
    success: true,
    item: updatedItem,
    message: `Item ${updatedItem.code} successfully restored to active inventory.`
  });
});

export default router;
