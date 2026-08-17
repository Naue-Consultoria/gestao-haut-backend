import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middleware/auth';
import { requireGestao } from '../middleware/roleGuard';

export const dashboardRouter = Router();

dashboardRouter.use(authMiddleware);
dashboardRouter.get('/consolidated', requireGestao, (req, res) => dashboardController.consolidated(req, res));
dashboardRouter.get('/consolidated/evolution', requireGestao, (req, res) => dashboardController.consolidatedEvolution(req, res));
dashboardRouter.get('/consolidated/yearly', requireGestao, (req, res) => dashboardController.consolidatedYearly(req, res));
dashboardRouter.get('/individual/:brokerId', (req, res) => dashboardController.individual(req, res));
dashboardRouter.get('/individual/:brokerId/evolution', (req, res) => dashboardController.yearlyEvolution(req, res));
dashboardRouter.get('/individual/:brokerId/yearly', (req, res) => dashboardController.individualYearly(req, res));
dashboardRouter.get('/ranking', requireGestao, (req, res) => dashboardController.ranking(req, res));
dashboardRouter.get('/roi', requireGestao, (req, res) => dashboardController.roi(req, res));
dashboardRouter.get('/roi/yearly', requireGestao, (req, res) => dashboardController.roiYearly(req, res));
