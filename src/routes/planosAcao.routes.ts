import { Router } from 'express';
import { planosAcaoController } from '../controllers/planosAcao.controller';
import { authMiddleware } from '../middleware/auth';
import { requireGestao } from '../middleware/roleGuard';

export const planosAcaoRouter = Router();

planosAcaoRouter.use(authMiddleware);
planosAcaoRouter.get('/:brokerId', (req, res) => planosAcaoController.getByBroker(req, res));
planosAcaoRouter.get('/:brokerId/:month', (req, res) => planosAcaoController.getByBrokerAndMonth(req, res));
planosAcaoRouter.post('/:brokerId', requireGestao, (req, res) => planosAcaoController.create(req, res));
planosAcaoRouter.put('/:id', requireGestao, (req, res) => planosAcaoController.update(req, res));
planosAcaoRouter.delete('/:id', requireGestao, (req, res) => planosAcaoController.delete(req, res));
