import { Router } from 'express';
import { reportsController } from '../controllers/reports.controller';
import { authMiddleware } from '../middleware/auth';
import { requireGestao } from '../middleware/roleGuard';

export const reportsRouter = Router();

reportsRouter.use(authMiddleware);
reportsRouter.get('/broker/:brokerId', requireGestao, (req, res) => reportsController.brokerReport(req, res));
reportsRouter.get('/parceria/:parceriaId', requireGestao, (req, res) => reportsController.parceriaReport(req, res));
