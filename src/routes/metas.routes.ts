import { Router } from 'express';
import { metasController } from '../controllers/metas.controller';
import { authMiddleware } from '../middleware/auth';
import { requireGestor } from '../middleware/roleGuard';

export const metasRouter = Router();

metasRouter.use(authMiddleware);
metasRouter.get('/:brokerId', (req, res) => metasController.getByBroker(req, res));
metasRouter.get('/:brokerId/:month', (req, res) => metasController.getByBrokerAndMonth(req, res));
metasRouter.put('/:brokerId/:month', requireGestor, (req, res) => metasController.upsert(req, res));
