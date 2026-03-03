import { Router } from 'express';
import { reportsController } from '../controllers/reports.controller';
import { authMiddleware } from '../middleware/auth';
import { requireGestor } from '../middleware/roleGuard';

export const reportsRouter = Router();

reportsRouter.use(authMiddleware);
reportsRouter.get('/broker/:brokerId', requireGestor, (req, res) => reportsController.brokerReport(req, res));
