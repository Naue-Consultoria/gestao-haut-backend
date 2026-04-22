import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middleware/auth';
import { requireGestor } from '../middleware/roleGuard';

export const dashboardRouter = Router();

dashboardRouter.use(authMiddleware);
dashboardRouter.get('/consolidated', (req, res) => dashboardController.consolidated(req, res));
dashboardRouter.get('/consolidated/evolution', (req, res) => dashboardController.consolidatedEvolution(req, res));
dashboardRouter.get('/consolidated/yearly', (req, res) => dashboardController.consolidatedYearly(req, res));
dashboardRouter.get('/individual/:brokerId', (req, res) => dashboardController.individual(req, res));
dashboardRouter.get('/individual/:brokerId/evolution', (req, res) => dashboardController.yearlyEvolution(req, res));
dashboardRouter.get('/individual/:brokerId/yearly', (req, res) => dashboardController.individualYearly(req, res));
dashboardRouter.get('/ranking', requireGestor, (req, res) => dashboardController.ranking(req, res));
dashboardRouter.get('/roi', requireGestor, (req, res) => dashboardController.roi(req, res));
dashboardRouter.get('/roi/yearly', requireGestor, (req, res) => dashboardController.roiYearly(req, res));
