import { Router } from 'express';
import { db } from '../../database/json-db.ts';
import { mongoService } from '../../mongodb.ts';
import { multiDbService } from '../../multiDatabase.ts';
import { createNotificationHelper } from '../../utils/notification.helper.ts';
import { LostItem, GuestInquiry } from '../../../src/types.ts';

const router = Router();

// Public items catalog: sanitized to protect guest privacy
router.get('/public/items', async (req, res) => {
  try {
    let itemsList: LostItem[] = [];
    if (mongoService.isLive) {
      try {
        itemsList = await mongoService.getItems();
      } catch {
        itemsList = db.items;
      }
    } else {
      itemsList = db.items;
    }

    // Filter to only approved / stored or found items, not deleted/archived
    const publicItems = itemsList
      .filter(item => !item.isDeleted && item.status !== 'Archived' && item.status !== 'Disposed')
      .map(item => ({
        id: item.id,
        code: item.code,
        itemName: item.itemName,
        category: item.category,
        description: item.description,
        brand: item.brand,
        color: item.color,
        locationFound: item.locationFound,
        dateFound: item.dateFound,
        status: item.status,
        imageUrl: item.imageUrl,
        retentionPeriodDays: item.dispatchDurationDays,
        deadlineDate: item.dispatchDeadline
      }));

    return res.json({
      success: true,
      count: publicItems.length,
      items: publicItems
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/public/website-settings', (req, res) => {
  res.json(multiDbService.getPublicSettings());
});

router.put('/public/website-settings', (req, res) => {
  const updated = multiDbService.updatePublicSettings(req.body);
  return res.json({ success: true, settings: updated });
});

export default router;
