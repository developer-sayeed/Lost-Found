import { Router } from 'express';
import { multiDbService } from '../../multiDatabase.ts';

const router = Router();

// API: Real-Time SSE Stream & Multi-Terminal Sync
router.get('/stream', (req, res) => {
  multiDbService.registerSSEClient(res);
});

router.get('/status', (req, res) => {
  res.json({
    activeClients: multiDbService.getConnectedClientsCount(),
    primaryEngine: multiDbService.getPrimaryEngine(),
    timestamp: new Date().toISOString()
  });
});

router.post('/broadcast', (req, res) => {
  const { event, payload } = req.body;
  if (!event) return res.status(400).json({ error: 'Event name required' });
  multiDbService.broadcast(event, payload);
  return res.json({ success: true, clientsReached: multiDbService.getConnectedClientsCount() });
});

export default router;
