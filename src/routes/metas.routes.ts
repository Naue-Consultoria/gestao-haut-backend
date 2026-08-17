import { Router } from 'express';
import { metasController } from '../controllers/metas.controller';
import { authMiddleware } from '../middleware/auth';
import { requireGestao } from '../middleware/roleGuard';

export const metasRouter = Router();

metasRouter.use(authMiddleware);
metasRouter.get('/:brokerId', (req, res) => metasController.getByBroker(req, res));
metasRouter.get('/:brokerId/:month', (req, res) => metasController.getByBrokerAndMonth(req, res));
metasRouter.put('/:brokerId/bulk-vgv', requireGestao, (req, res) => metasController.bulkUpsertVgv(req, res));
metasRouter.put('/:brokerId/:month', requireGestao, (req, res) => metasController.upsert(req, res));
