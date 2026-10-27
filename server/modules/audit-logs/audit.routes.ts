import { Router, Request } from 'express';
import { db, saveDatabase } from '../../database/json-db.ts';
import { mongoService } from '../../mongodb.ts';
import { addAudit } from '../../utils/audit.helper.ts';
import { actorHasPermission } from '../../middleware/permission.middleware.ts';
import { AuditLog } from '../../../src/types.ts';

const router = Router();

const isAuditAdminUser = (req: Request): boolean => {
  const actorRole = (req.headers['x-user-role'] as string) || '';
  const actorName = ((req.headers['x-user-name'] as string) || '').trim();
  const actorEmail = ((req.headers['x-user-email'] as string) || '').toLowerCase().trim();

  if (actorRole === 'Super Admin' || actorRole === 'Admin') return true;
  if (actorEmail === 'abusayeedriday@gmail.com' || actorEmail === 'mdriday256@gmail.com') return true;
  if (actorHasPermission(req, 'audit_logs')) return true;

  // Check against registered users in database
  const matchingUser = db.users.find(u =>
    (u.email && actorEmail && u.email.toLowerCase() === actorEmail) ||
    (u.name && actorName && u.name.toLowerCase() === actorName.toLowerCase())
  );

  if (matchingUser && (matchingUser.role === 'Super Admin' || matchingUser.role === 'Admin')) {
    return true;
  }

  return false;
};

router.get('/', async (req, res) => {
  try {
    if (!isAuditAdminUser(req)) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: Only Administrators and Super Admins can access Audit Logs.',
        logs: []
      });
    }

    const {
      search,
      entityType,
      actionType,
      action,
      itemId,
      itemCode,
      userRole,
      performedBy,
      startDate,
      endDate,
      limit = '500'
    } = req.query;

    let allLogs: AuditLog[] = [];
    let source = 'local';

    if (mongoService.isLive) {
      try {
        const mongoLogs = await mongoService.getAuditLogs({}, parseInt(limit as string, 10) || 1000);
        if (mongoLogs && mongoLogs.length > 0) {
          allLogs = mongoLogs;
          source = 'mongodb';
        }
      } catch (e: any) {
        console.warn('Failed to load audit logs from MongoDB, falling back to local memory:', e.message);
      }
    }

    if (allLogs.length === 0) {
      allLogs = Array.isArray(db.auditLogs) ? [...db.auditLogs] : [];
      source = 'local';
    }

    let filtered = allLogs;

    if (entityType && entityType !== 'all') {
      filtered = filtered.filter(l => l.entityType === entityType);
    }

    if (actionType && actionType !== 'all') {
      filtered = filtered.filter(l => l.actionType === actionType);
    }

    if (action && action !== 'all') {
      filtered = filtered.filter(l => l.action?.toLowerCase() === (action as string).toLowerCase());
    }

    if (itemId) {
      filtered = filtered.filter(l => l.entityId === itemId || l.itemCode === itemId);
    }

    if (itemCode) {
      filtered = filtered.filter(l => l.itemCode?.toLowerCase() === (itemCode as string).toLowerCase() || l.entityId === itemCode);
    }

    if (userRole && userRole !== 'all') {
      filtered = filtered.filter(l => (l.userRole || l.performedByRole) === userRole);
    }

    if (performedBy && performedBy !== 'all') {
      filtered = filtered.filter(l => l.performedBy?.toLowerCase().includes((performedBy as string).toLowerCase()));
    }

    if (startDate) {
      const start = new Date(startDate as string).getTime();
      if (!isNaN(start)) {
        filtered = filtered.filter(l => new Date(l.timestamp).getTime() >= start);
      }
    }

    if (endDate) {
      const end = new Date(endDate as string).getTime();
      if (!isNaN(end)) {
        filtered = filtered.filter(l => new Date(l.timestamp).getTime() <= end);
      }
    }

    if (search && typeof search === 'string' && search.trim()) {
      const s = search.toLowerCase().trim();
      filtered = filtered.filter(l =>
        (l.action && l.action.toLowerCase().includes(s)) ||
        (l.details && l.details.toLowerCase().includes(s)) ||
        (l.performedBy && l.performedBy.toLowerCase().includes(s)) ||
        (l.itemCode && l.itemCode.toLowerCase().includes(s)) ||
        (l.itemName && l.itemName.toLowerCase().includes(s)) ||
        (l.category && l.category.toLowerCase().includes(s)) ||
        (l.reason && l.reason.toLowerCase().includes(s)) ||
        (l.performedByEmail && l.performedByEmail.toLowerCase().includes(s))
      );
    }

    // Sort newest first
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const maxLimit = parseInt(limit as string, 10) || 500;
    const sliced = filtered.slice(0, maxLimit);

    return res.json({
      success: true,
      total: filtered.length,
      returned: sliced.length,
      logs: sliced,
      source
    });
  } catch (err: any) {
    console.error('Error fetching audit logs:', err);
    return res.status(500).json({ success: false, error: err.message, logs: [] });
  }
});

router.get('/stats', async (req, res) => {
  try {
    if (!isAuditAdminUser(req)) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: Only Administrators and Super Admins can access Audit Log statistics.'
      });
    }

    const logs = Array.isArray(db.auditLogs) ? db.auditLogs : [];
    const total = logs.length;
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    const recent24h = logs.filter(l => new Date(l.timestamp).getTime() >= twentyFourHoursAgo).length;
    const statusChanges = logs.filter(l => l.actionType === 'status_change' || l.action?.toLowerCase().includes('status')).length;
    const itemCreations = logs.filter(l => l.actionType === 'create' || l.action?.toLowerCase().includes('register')).length;
    const handovers = logs.filter(l => l.actionType === 'handover' || l.action?.toLowerCase().includes('handover')).length;
    const dispatches = logs.filter(l => l.actionType === 'dispatch' || l.action?.toLowerCase().includes('dispatch')).length;
    const approvals = logs.filter(l => l.actionType === 'approval' || l.action?.toLowerCase().includes('approve')).length;

    // Group by action type
    const byActionType: Record<string, number> = {};
    logs.forEach(l => {
      const type = l.actionType || 'other';
      byActionType[type] = (byActionType[type] || 0) + 1;
    });

    // Top actors
    const actorCounts: Record<string, { count: number; role: string }> = {};
    logs.forEach(l => {
      const actor = l.performedBy || 'Unknown';
      if (!actorCounts[actor]) {
        actorCounts[actor] = { count: 0, role: (l.userRole || l.performedByRole || 'Staff') as string };
      }
      actorCounts[actor].count += 1;
    });

    const topActors = Object.entries(actorCounts)
      .map(([name, data]) => ({ name, count: data.count, role: data.role }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return res.json({
      success: true,
      stats: {
        total,
        recent24h,
        statusChanges,
        itemCreations,
        handovers,
        dispatches,
        approvals,
        byActionType,
        topActors
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      action,
      actionType,
      entityType = 'item',
      entityId,
      itemCode,
      itemName,
      category,
      previousStatus,
      newStatus,
      details,
      reason,
      changes,
      meta
    } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action is required for audit logging' });
    }

    const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
    const role = (req.headers['x-user-role'] as any) || 'Super Admin';
    const email = req.headers['x-user-email'] as string;
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip;
    const userAgent = req.headers['user-agent'] || '';

    const log = await addAudit(
      action,
      entityType,
      details,
      actor,
      role,
      entityId || itemCode,
      {
        actionType,
        itemCode,
        itemName,
        category,
        previousStatus,
        newStatus,
        performedByEmail: email,
        reason,
        changes,
        ip,
        deviceType: userAgent.includes('Mobi') ? 'Mobile' : 'Desktop',
        browser: userAgent.includes('Chrome') ? 'Google Chrome' : userAgent.includes('Safari') ? 'Safari' : userAgent.includes('Edge') ? 'Edge' : 'Browser',
        meta
      }
    );

    return res.status(201).json({ success: true, log });
  } catch (err: any) {
    console.error('Error creating audit log:', err);
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!isAuditAdminUser(req)) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: Only Administrators can delete audit logs.'
      });
    }

    const { id } = req.params;

    // 1. Remove from local memory / db.json
    if (Array.isArray(db.auditLogs)) {
      db.auditLogs = db.auditLogs.filter(l => l.id !== id && (l as any)._id !== id);
    }
    saveDatabase();

    // 2. Remove from MongoDB
    if (mongoService.isLive) {
      await mongoService.deleteAuditLog(id).catch(err => {
        console.warn('[MongoDB] deleteAuditLog error:', err.message);
      });
    }

    return res.json({
      success: true,
      message: 'Audit log entry deleted successfully.'
    });
  } catch (err: any) {
    console.error('Error deleting audit log:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/', async (req, res) => {
  try {
    if (!isAuditAdminUser(req)) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: Only Administrators can delete audit logs.'
      });
    }

    const { ids, clearAll } = req.body || {};
    const actor = (req.headers['x-user-name'] as string) || 'Admin';
    const role = (req.headers['x-user-role'] as any) || 'Super Admin';

    if (clearAll) {
      db.auditLogs = [];
      saveDatabase();

      if (mongoService.isLive) {
        await mongoService.clearAuditLogs().catch(err => {
          console.warn('[MongoDB] clearAuditLogs error:', err.message);
        });
      }

      await addAudit(
        'Audit Logs Cleared',
        'settings',
        `All historical audit logs were cleared by ${role} "${actor}".`,
        actor,
        role
      );

      return res.json({
        success: true,
        message: 'All audit logs have been successfully cleared.'
      });
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Array of audit log IDs is required.' });
    }

    const idsSet = new Set(ids);
    if (Array.isArray(db.auditLogs)) {
      db.auditLogs = db.auditLogs.filter(l => !idsSet.has(l.id) && !idsSet.has((l as any)._id));
    }
    saveDatabase();

    if (mongoService.isLive) {
      await mongoService.deleteAuditLogs(ids).catch(err => {
        console.warn('[MongoDB] batch delete audit logs error:', err.message);
      });
    }

    return res.json({
      success: true,
      deletedCount: ids.length,
      message: `${ids.length} audit log entries successfully deleted.`
    });
  } catch (err: any) {
    console.error('Error batch deleting audit logs:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
