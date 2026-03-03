import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middleware/auth';
import { requireGestor } from '../middleware/roleGuard';

export const dashboardRouter = Router();

dashboardRouter.use(authMiddleware);
dashboardRouter.get('/consolidated', (req, res) => dashboardController.consolidated(req, res));
dashboardRouter.get('/individual/:brokerId', (req, res) => dashboardController.individual(req, res));
dashboardRouter.get('/ranking', requireGestor, (req, res) => dashboardController.ranking(req, res));
