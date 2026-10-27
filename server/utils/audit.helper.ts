import { AuditLog } from '../../src/types.ts';
import { db, saveDatabase } from '../database/json-db.ts';
import { mongoService } from '../mongodb.ts';
import { multiDbService } from '../multiDatabase.ts';

// Helper function to log audit events and status changes on lost items
export const addAudit = async (
  action: string,
  entityType: 'item' | 'staff' | 'settings' | 'auth' | 'certificate' | 'database' = 'item',
  details: string = '',
  performedBy = 'MD ABU SAYEED RIDAY',
  userRole: any = 'Super Admin',
  entityId?: string,
  extraMeta?: {
    actionType?: AuditLog['actionType'];
    itemCode?: string;
    itemName?: string;
    category?: string;
    previousStatus?: any;
    newStatus?: any;
    performedByEmail?: string;
    performedById?: string;
    reason?: string;
    changes?: Array<{ field: string; label: string; from: any; to: any }>;
    ip?: string;
    deviceType?: string;
    browser?: string;
    meta?: Record<string, any>;
  }
): Promise<AuditLog> => {
  let resolvedActionType = extraMeta?.actionType;
  if (!resolvedActionType) {
    const actLower = (action || '').toLowerCase();
    if (actLower.includes('status') || actLower.includes('returned to store')) resolvedActionType = 'status_change';
    else if (actLower.includes('handover') || actLower.includes('handed over')) resolvedActionType = 'handover';
    else if (actLower.includes('dispatch')) resolvedActionType = 'dispatch';
    else if (actLower.includes('approve')) resolvedActionType = 'approval';
    else if (actLower.includes('reject')) resolvedActionType = 'rejection';
    else if (actLower.includes('register') || actLower.includes('created') || actLower.includes('added') || actLower.includes('submission')) resolvedActionType = 'create';
    else if (actLower.includes('return')) resolvedActionType = 'return_to_store';
    else if (actLower.includes('restore')) resolvedActionType = 'restore';
    else if (actLower.includes('trash') || actLower.includes('delete') || actLower.includes('remove') || actLower.includes('recycle')) resolvedActionType = 'trash';
    else if (actLower.includes('bulk') || actLower.includes('batch')) resolvedActionType = 'bulk_action';
    else if (actLower.includes('export') || actLower.includes('download')) resolvedActionType = 'export';
    else if (actLower.includes('view') || actLower.includes('inspect')) resolvedActionType = 'view';
    else resolvedActionType = 'update';
  }

  // Try resolving item code and name if entityId is an item code or ID
  let resolvedItemCode = extraMeta?.itemCode;
  let resolvedItemName = extraMeta?.itemName;
  let resolvedCategory = extraMeta?.category;

  if (entityType === 'item' && entityId) {
    const matchedItem = db.items.find(i => i.id === entityId || i.code === entityId);
    if (matchedItem) {
      if (!resolvedItemCode) resolvedItemCode = matchedItem.code;
      if (!resolvedItemName) resolvedItemName = matchedItem.itemName;
      if (!resolvedCategory) resolvedCategory = matchedItem.category;
    }
  }

  const auditEntry: AuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    action,
    actionType: resolvedActionType,
    entityType,
    entityId: entityId || resolvedItemCode,
    itemCode: resolvedItemCode,
    itemName: resolvedItemName,
    category: resolvedCategory,
    previousStatus: extraMeta?.previousStatus,
    newStatus: extraMeta?.newStatus,
    performedBy: performedBy || 'MD ABU SAYEED RIDAY',
    userRole: userRole || 'Super Admin',
    performedByRole: userRole || 'Super Admin',
    performedByEmail: extraMeta?.performedByEmail,
    performedById: extraMeta?.performedById,
    timestamp: new Date().toISOString(),
    details: details || `${action} on ${entityType} ${resolvedItemCode || entityId || ''}`.trim(),
    reason: extraMeta?.reason,
    changes: extraMeta?.changes,
    ip: extraMeta?.ip,
    deviceType: extraMeta?.deviceType,
    browser: extraMeta?.browser,
    meta: extraMeta?.meta
  };

  if (!Array.isArray(db.auditLogs)) {
    db.auditLogs = [];
  }
  db.auditLogs.unshift(auditEntry);
  if (db.auditLogs.length > 5000) {
    db.auditLogs = db.auditLogs.slice(0, 5000);
  }
  saveDatabase();

  if (mongoService.isLive) {
    try {
      await mongoService.insertAuditLog(auditEntry);
    } catch (err: any) {
      console.warn('MongoDB insertAuditLog error:', err.message);
    }
  }

  // Broadcast in real-time
  multiDbService.broadcast('audit_log_created', auditEntry);
  return auditEntry;
};
