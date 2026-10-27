import express from 'express';
import { mongoService } from '../../mongodb.ts';

export const healthRouter = express.Router();

healthRouter.get('/api/health', async (req, res) => {
  const mongoStatus = await mongoService.getStatus();
  res.json({
    status: 'ok',
    service: 'Warwick Hotel Baha L&F API',
    timestamp: new Date().toISOString(),
    database: mongoStatus
  });
});

export default healthRouter;

